import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const BACKEND_URL = process.env.BACKEND_URL || "https://kitta-2mgs.onrender.com";

// ---------------------------------------------------------------------------
// Supabase Admin Client (Service Role — server-side only, never sent to browser)
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

// ---------------------------------------------------------------------------
// Auth helper — extract user_id from the Bearer JWT forwarded from the browser
// ---------------------------------------------------------------------------
async function getUserId(req: express.Request): Promise<string | null> {
  const auth = req.headers["authorization"];
  if (!auth || !auth.startsWith("Bearer ") || !supabase) return null;
  const token = auth.slice(7);
  try {
    const { data, error } = await supabase.auth.getUser(token);
    return error || !data?.user ? null : data.user.id;
  } catch {
    return null;
  }
}

// Default watchlist UUID for anonymous / MVP usage
const DEFAULT_WATCHLIST_ID = "3abec7be-0a38-46f6-aacb-b7f0d6732ef7";

async function getOrCreateWatchlist(userId: string | null): Promise<string> {
  if (!supabase) return DEFAULT_WATCHLIST_ID;

  if (!userId) {
    try {
      const { data: chk } = await supabase.from("watchlists").select("id").eq("id", DEFAULT_WATCHLIST_ID).maybeSingle();
      if (!chk) {
        await supabase.from("watchlists").insert({ id: DEFAULT_WATCHLIST_ID, name: "Default Watchlist" });
      }
    } catch (e) {
      console.warn("[watchlist] Default watchlist check/insert:", e);
    }
    return DEFAULT_WATCHLIST_ID;
  }

  const { data } = await supabase
    .from("watchlists")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (data && data.length > 0) return data[0].id;

  // Create a new personal watchlist for this user
  const { data: newWl, error } = await supabase
    .from("watchlists")
    .insert({ user_id: userId, name: "My Watchlist" })
    .select("id")
    .single();

  if (error || !newWl) throw new Error("Failed to create watchlist");
  return newWl.id;
}

// ---------------------------------------------------------------------------
// Enrich a single stock_cache row into the Stock shape the frontend expects
// ---------------------------------------------------------------------------
function enrichCacheRow(sym: string, row: any): Record<string, any> {
  if (!row) {
    // Pending placeholder — analysis not yet done
    return {
      symbol: sym,
      name: sym,
      price: 0,
      open: 0,
      high52: 0,
      low52: 0,
      volume: "—",
      sector: "—",
      eps: 0,
      pe: 0,
      rsi: 0,
      nav: 0,
      divYield: 0,
      sentiment: 50,
      sparkline: [],
      aiTarget: "Analyzing…",
      aiRisk: "Pending",
      relativeVolume: "—",
      status: "pending",
    };
  }

  let qData: any = {};
  try {
    qData = typeof row.quant_metrics === "string"
      ? JSON.parse(row.quant_metrics)
      : (row.quant_metrics ?? {});
  } catch { /* leave as {} */ }

  let nData: any = {};
  try {
    nData = typeof row.news_summary === "string"
      ? JSON.parse(row.news_summary)
      : (row.news_summary ?? {});
  } catch { /* leave as {} */ }

  const price = row.latest_price ?? 0;
  const open = qData.latest_open ?? price;

  let sparkline: number[] = row.sparkline ?? qData.sparkline ?? [];
  const histPrices: any[] = qData.historical_prices ?? [];
  if (histPrices.length > 0) {
    sparkline = histPrices.slice(-10).map((p: any) => p?.close ?? 0);
  }

  const volStats = qData.volume ?? {};
  const relativeVolume = typeof volStats === "object" && volStats.volume_trend
    ? `${volStats.volume_trend}x Avg`
    : "N/A";

  const rawRisk = qData.volatility?.risk_level ?? "Medium";
  const rawTarget = qData.trend?.trend ?? "Neutral";

  return {
    symbol: sym,
    name: row.company_name ?? sym,
    price,
    open,
    high52: 0,
    low52: 0,
    volume: "0",
    sector: "Market",
    eps: 0,
    pe: row.pe_ratio ?? qData.pe_ratio ?? 0,
    rsi: row.rsi ?? qData.rsi ?? 50,
    nav: 0,
    divYield: 0,
    sentiment: nData.sentiment_score ?? 50,
    sparkline,
    aiTarget: rawTarget ? String(rawTarget).charAt(0).toUpperCase() + String(rawTarget).slice(1) : "N/A",
    aiRisk: rawRisk ? String(rawRisk).charAt(0).toUpperCase() + String(rawRisk).slice(1) : "N/A",
    relativeVolume,
    status: "ready",
  };
}

// ---------------------------------------------------------------------------
// WATCHLIST — Serverless TypeScript routes
// ---------------------------------------------------------------------------

/**
 * GET /api/watchlist
 * Returns the enriched watchlist for the current user (non-blocking cache read).
 * Symbols still being analyzed in the background are returned as pending rows.
 */
app.get("/api/watchlist", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured" });

  try {
    const userId = await getUserId(req);
    const watchlistId = await getOrCreateWatchlist(userId);

    // 1. Fetch watchlist items
    const { data: items, error: itemsErr } = await supabase
      .from("watchlist_items")
      .select("symbol")
      .eq("watchlist_id", watchlistId);

    if (itemsErr) throw itemsErr;
    const symbols: string[] = [...new Set((items ?? []).map((i: any) => i.symbol as string))];

    if (symbols.length === 0) return res.json({ stocks: [], has_pending: false });

    // 2. Bulk-fetch from stock_cache in ONE query (read-only, never triggers Python)
    const { data: cacheRows } = await supabase
      .from("stock_cache")
      .select("*")
      .in("symbol", symbols);

    const cacheMap = new Map<string, any>(
      (cacheRows ?? []).map((r: any) => [r.symbol, r])
    );

    const stocks = symbols.map((sym) => enrichCacheRow(sym, cacheMap.get(sym)));
    const hasPending = stocks.some((s) => s.status === "pending");

    return res.json({ stocks, has_pending: hasPending });
  } catch (err: any) {
    console.error("[watchlist GET]", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/watchlist/add
 * Adds a stock to the user's watchlist.
 * - If stock_cache already has fresh data → responds immediately.
 * - If no data exists → fires off an async analysis via the Python backend
 *   (fire-and-forget, does NOT block the response).
 * The frontend will see a "pending" row until the background analysis completes.
 */
app.post("/api/watchlist/add", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured" });

  const sym: string = (req.body?.symbol ?? "").trim().toUpperCase();
  if (!sym) return res.status(400).json({ error: "symbol is required" });

  try {
    const userId = await getUserId(req);
    const watchlistId = await getOrCreateWatchlist(userId);

    // Check if already in watchlist
    const { data: existing } = await supabase
      .from("watchlist_items")
      .select("id")
      .eq("watchlist_id", watchlistId)
      .eq("symbol", sym)
      .maybeSingle();

    if (!existing) {
      const { error: insertErr } = await supabase
        .from("watchlist_items")
        .insert({ watchlist_id: watchlistId, symbol: sym });
      if (insertErr) throw insertErr;
    }

    // Check stock_cache freshness
    const { data: cacheRows } = await supabase
      .from("stock_cache")
      .select("symbol, expires_at")
      .eq("symbol", sym)
      .maybeSingle();

    const now = Date.now();
    let needsAnalysis = !cacheRows;

    if (cacheRows?.expires_at) {
      const expiresAt = new Date(cacheRows.expires_at).getTime();
      if (now >= expiresAt) needsAnalysis = true;
    }

    if (needsAnalysis) {
      // Fire-and-forget: ask Python backend to run the full analysis pipeline.
      // We do NOT await this — the response returns immediately to the browser.
      fetch(`http://127.0.0.1:8002/api/watchlist/cron/auto-scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).catch((e) =>
        console.error(`[watchlist] Failed to trigger Python analysis for ${sym}:`, e)
      );

      return res.json({
        status: "success",
        pending: true,
        message: `Added ${sym} to your watchlist. Stock analysis is running in the background — the table will update automatically.`,
      });
    }

    return res.json({
      status: "success",
      pending: false,
      message: `Added ${sym} to your watchlist.`,
    });
  } catch (err: any) {
    console.error("[watchlist POST /add]", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/watchlist/remove/:symbol
 * Removes a stock from the user's watchlist.
 */
app.delete("/api/watchlist/remove/:symbol", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured" });

  const sym = (req.params.symbol ?? "").trim().toUpperCase();
  if (!sym) return res.status(400).json({ error: "symbol is required" });

  try {
    const userId = await getUserId(req);
    const watchlistId = await getOrCreateWatchlist(userId);

    const { error } = await supabase
      .from("watchlist_items")
      .delete()
      .eq("watchlist_id", watchlistId)
      .eq("symbol", sym);

    if (error) throw error;
    return res.json({ status: "success", message: `Removed ${sym} from your watchlist` });
  } catch (err: any) {
    console.error("[watchlist DELETE]", err);
    return res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// ALERTS — Serverless TypeScript routes (Supabase-backed)
// ---------------------------------------------------------------------------

app.get("/api/alerts", async (req, res) => {
  if (!supabase) return res.json(ALERT_RULES); // fallback to in-memory

  try {
    const userId = await getUserId(req);
    let query = supabase.from("alerts").select("*");
    if (userId) {
      query = query.eq("user_id", userId) as any;
    } else {
      query = query.is("user_id", null) as any;
    }
    const { data, error } = await query;
    if (error) throw error;
    return res.json(data ?? []);
  } catch (err: any) {
    console.error("[alerts GET]", err);
    return res.json(ALERT_RULES); // fallback
  }
});

app.post("/api/alerts", async (req, res) => {
  const { symbol, metric, operator, value } = req.body;

  if (!supabase) {
    // In-memory fallback
    const newAlert = {
      id: `alert_${Date.now()}`,
      symbol: symbol || "NABIL",
      metric: metric || "Price",
      operator: operator || "<",
      value: parseFloat(value) || 0,
      active: true,
      tag: "Monitoring Verified",
    };
    ALERT_RULES.push(newAlert);
    return res.json(newAlert);
  }

  try {
    const userId = await getUserId(req);
    const payload: any = {
      symbol: (symbol ?? "").trim().toUpperCase(),
      condition: `${metric}_${operator}_${value}`,
      target_value: parseFloat(value) || 0,
      message: `${metric} ${operator} ${value} for ${symbol}`,
      is_active: true,
    };
    if (userId) payload.user_id = userId;

    const { data, error } = await supabase.from("alerts").insert(payload).select().single();
    if (error) throw error;
    return res.json(data);
  } catch (err: any) {
    console.error("[alerts POST]", err);
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/api/alerts/:id", async (req, res) => {
  const { id } = req.params;

  if (!supabase) {
    ALERT_RULES = ALERT_RULES.filter((a) => a.id !== id);
    return res.json({ success: true });
  }

  try {
    const userId = await getUserId(req);
    let query = supabase.from("alerts").delete().eq("id", id);
    if (userId) query = query.eq("user_id", userId) as any;
    const { error } = await query;
    if (error) throw error;
    return res.json({ success: true });
  } catch (err: any) {
    console.error("[alerts DELETE]", err);
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/alerts/toggle/:id", async (req, res) => {
  const { id } = req.params;

  if (!supabase) {
    const alert = ALERT_RULES.find((a) => a.id === id);
    if (alert) {
      alert.active = !alert.active;
      alert.tag = alert.active ? "Monitoring Verified" : "Inactive";
    }
    return res.json({ success: true, alerts: ALERT_RULES });
  }

  try {
    const { data: existing } = await supabase
      .from("alerts")
      .select("is_active")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("alerts")
      .update({ is_active: !existing?.is_active })
      .eq("id", id);

    if (error) throw error;
    return res.json({ success: true, is_active: !existing?.is_active });
  } catch (err: any) {
    console.error("[alerts TOGGLE]", err);
    return res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// In-memory data (used as fallback when Supabase is unconfigured)
// ---------------------------------------------------------------------------
const STOCKS_DB = [
  { symbol: "NABIL", name: "Nabil Bank Limited", price: 1245, open: 1230, high52: 1520, low52: 1050, volume: "1,245K", sector: "Commercial Banks", eps: 58.2, pe: 21.4, nav: 212, divYield: 3.1, sentiment: 78, sparkline: [1200, 1210, 1195, 1220, 1225, 1215, 1230, 1235, 1240, 1245] },
  { symbol: "NMB", name: "NMB Bank Limited", price: 410, open: 415, high52: 580, low52: 350, volume: "845K", sector: "Commercial Banks", eps: 25.3, pe: 16.2, nav: 145, divYield: 4.2, sentiment: 42, sparkline: [430, 425, 420, 418, 412, 415, 410, 408, 412, 410] },
  { symbol: "AHPC", name: "Arun Valley Hydropower", price: 280, open: 275, high52: 420, low52: 210, volume: "1,850K", sector: "Hydropower", eps: 12.1, pe: 23.1, nav: 108, divYield: 0.0, sentiment: 35, sparkline: [290, 285, 280, 274, 277, 281, 280, 276, 278, 280] },
  { symbol: "NICA", name: "NIC Asia Bank Limited", price: 720, open: 715, high52: 980, low52: 650, volume: "960K", sector: "Commercial Banks", eps: 41.5, pe: 17.3, nav: 180, divYield: 2.8, sentiment: 65, sparkline: [700, 712, 705, 715, 722, 718, 720, 723, 719, 720] },
  { symbol: "HDL", name: "Himalayan Distillery", price: 2150, open: 2180, high52: 2900, low52: 1850, volume: "320K", sector: "Manufacturing", eps: 68.4, pe: 31.4, nav: 195, divYield: 5.2, sentiment: 82, sparkline: [2100, 2125, 2140, 2130, 2160, 2150, 2145, 2135, 2155, 2150] },
];

const NEWS_DB = [
  { id: "news_1", date: "2026-05-24", symbol: "NABIL", title: "NABIL Reports Strong 14% Q3 Net Profit Growth YoY", summary: "Nabil Bank Limited has published its third-quarter financial reports demonstrating exceptional net profitability growth, rising YoY by 14%.", bullets: ["Net profit increased to NPR 4.2 Billion for the quarter", "Non-performing loan (NPL) ratio contained steady at 1.82%", "Solid margin improvements with loan expansion focused on green energy portfolios"] },
  { id: "news_2", date: "2026-05-22", symbol: "NABIL", title: "Nabil Bank Declares Early Cash Dividend of NPR 35 Per Share", summary: "The Board of Directors of Nabil Bank Limited proposed an early cash dividend allocation.", bullets: ["NPR 35 per share cash payout proposed subject to Nepal Rastra Bank confirmation", "Dividend yield calculated at approx 3.1% at present market valuations", "AGM date scheduled for next month to approve dividend distribution"] },
  { id: "news_3", date: "2026-05-23", symbol: "NMB", title: "NMB Bank Partners with FMO for USD 25M Corporate Credit Line", summary: "NMB Bank has finalized international credit facility lines with Dutch development bank FMO.", bullets: ["USD 25 Million credit buffer targeting long-term SME ventures", "Puts NMB at the forefront of sustainable business banking structures", "EPS projection remains steady despite higher localized interest rates"] },
  { id: "news_4", date: "2026-05-25", symbol: "AHPC", title: "Arun Valley Hydropower Commences Testing of Piluwa Power Unit", summary: "AHPC has completed technical installations on its secondary turbine array.", bullets: ["Expected to add 8.5 MW directly to peak hour grid operations", "Will elevate revenue stream reliability beginning in early Q1 next year", "Current PE remains elevated pending full revenue integration"] },
];

let ALERT_RULES: any[] = [
  { id: "alert_1", symbol: "NABIL", metric: "PE", operator: "<", value: 22.0, active: true, tag: "Monitoring Verified" },
  { id: "alert_2", symbol: "NMB", metric: "Price", operator: "<", value: 450, active: true, tag: "Monitoring Verified" },
  { id: "alert_3", symbol: "AHPC", metric: "DivYield", operator: ">", value: 1.0, active: false, tag: "Inactive" },
];

const TICKERS = [
  { symbol: "NEPSE", value: "2,087.45", delta: "+15.20", trend: "up" },
  { symbol: "Sensitive Index", value: "392.40", delta: "-1.15", trend: "down" },
  { symbol: "Banking Sector", value: "1,142.10", delta: "+8.45", trend: "up" },
  { symbol: "Hydropower Index", value: "2,410.60", delta: "-12.50", trend: "down" },
  { symbol: "Insurance", value: "9,820.00", delta: "+142.00", trend: "up" },
  { symbol: "NABIL", value: "1,245.00", delta: "+1.20%", trend: "up" },
  { symbol: "NMB", value: "410.00", delta: "-0.80%", trend: "down" },
  { symbol: "NICA", value: "720.00", delta: "+0.35%", trend: "up" },
];

// ---------------------------------------------------------------------------
// Remaining proxy + static routes
// ---------------------------------------------------------------------------

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.get("/api/stocks", (_req, res) => res.json(STOCKS_DB));
app.get("/api/news", (_req, res) => res.json(NEWS_DB));

app.get("/api/tickers", async (_req, res) => {
  try {
    const response = await fetch("http://127.0.0.1:8002/api/market/tickers");
    if (!response.ok) return res.json(TICKERS);
    return res.json(await response.json());
  } catch {
    return res.json(TICKERS);
  }
});

let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "MOCK_KEY",
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });
  }
  return aiInstance;
}

app.post("/api/interrogate", async (req, res) => {
  const { prompt, symbol: selectedSymbol } = req.body;
  if (!prompt) return res.status(400).json({ error: "No prompt query provided." });
  const activeSymbol = selectedSymbol || "NEPSE";
  try {
    const response = await fetch(`${BACKEND_URL}/api/interrogate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, symbol: activeSymbol }),
    });
    if (!response.ok) throw new Error(await response.text());
    return res.json(await response.json());
  } catch (error: any) {
    return res.status(500).json({
      error: `FastAPI Engine Connection Failure: ${error.message}`,
      traces: [{ id: "trace_fail", text: "[Connection Fail] FastAPI server unreachable.", status: "error", timestamp: new Date().toISOString() }],
      analysis: "### KITTA Terminal Connection Offline\n\nThe Python FastAPI server is currently offline.",
    });
  }
});

app.post("/api/interrogate/stream", async (req, res) => {
  const { prompt, symbol: selectedSymbol } = req.body;
  if (!prompt) return res.status(400).json({ error: "No prompt query provided." });
  const activeSymbol = selectedSymbol || "NEPSE";
  try {
    const response = await fetch(`${BACKEND_URL}/api/interrogate/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, symbol: activeSymbol }),
    });
    if (!response.ok) return res.status(response.status).json({ error: "Failed to stream from FastAPI" });
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    if (response.body) {
      const reader = (response.body as any).getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } else {
      res.end();
    }
  } catch {
    res.status(500).end();
  }
});

app.get("/api/chart/:symbol", async (req, res) => {
  const { symbol } = req.params;
  try {
    const response = await fetch(`${BACKEND_URL}/api/chart/${symbol}`);
    if (!response.ok) return res.status(response.status).send("Chart not found");
    res.setHeader("Content-Type", "image/png");
    return res.send(Buffer.from(await response.arrayBuffer()));
  } catch {
    return res.status(500).send("Proxy error");
  }
});

app.get("/api/quant/:symbol", async (req, res) => {
  const { symbol } = req.params;
  try {
    const response = await fetch(`${BACKEND_URL}/api/quant/${symbol}`);
    if (!response.ok) return res.status(response.status).json({ error: "Not found" });
    return res.json(await response.json());
  } catch {
    return res.status(500).json({ error: "Proxy error" });
  }
});

app.get("/api/metrics/:symbol", async (req, res) => {
  const { symbol } = req.params;
  try {
    const response = await fetch(`${BACKEND_URL}/api/metrics/${symbol}`);
    if (!response.ok) return res.status(response.status).json({ error: "Not found" });
    return res.json(await response.json());
  } catch {
    return res.status(500).json({ error: "Proxy error" });
  }
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
async function boot() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`KITTA Node server listening on http://localhost:${PORT}`);
    console.log(`Supabase: ${supabase ? "✓ connected" : "✗ not configured"}`);
  });
}

if (!process.env.VERCEL) {
  boot();
}

export default app;
