import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory data repository for NEPSE Kitta Terminal
const STOCKS_DB = [
  {
    symbol: "NABIL",
    name: "Nabil Bank Limited",
    price: 1245,
    open: 1230,
    high52: 1520,
    low52: 1050,
    volume: "1,245K",
    sector: "Commercial Banks",
    eps: 58.2,
    pe: 21.4,
    nav: 212,
    divYield: 3.1,
    sentiment: 78,
    sparkline: [1200, 1210, 1195, 1220, 1225, 1215, 1230, 1235, 1240, 1245]
  },
  {
    symbol: "NMB",
    name: "NMB Bank Limited",
    price: 410,
    open: 415,
    high52: 580,
    low52: 350,
    volume: "845K",
    sector: "Commercial Banks",
    eps: 25.3,
    pe: 16.2,
    nav: 145,
    divYield: 4.2,
    sentiment: 42,
    sparkline: [430, 425, 420, 418, 412, 415, 410, 408, 412, 410]
  },
  {
    symbol: "AHPC",
    name: "Arun Valley Hydropower",
    price: 280,
    open: 275,
    high52: 420,
    low52: 210,
    volume: "1,850K",
    sector: "Hydropower",
    eps: 12.1,
    pe: 23.1,
    nav: 108,
    divYield: 0.0,
    sentiment: 35,
    sparkline: [290, 285, 280, 274, 277, 281, 280, 276, 278, 280]
  },
  {
    symbol: "NICA",
    name: "NIC Asia Bank Limited",
    price: 720,
    open: 715,
    high52: 980,
    low52: 650,
    volume: "960K",
    sector: "Commercial Banks",
    eps: 41.5,
    pe: 17.3,
    nav: 180,
    divYield: 2.8,
    sentiment: 65,
    sparkline: [700, 712, 705, 715, 722, 718, 720, 723, 719, 720]
  },
  {
    symbol: "HDL",
    name: "Himalayan Distillery",
    price: 2150,
    open: 2180,
    high52: 2900,
    low52: 1850,
    volume: "320K",
    sector: "Manufacturing",
    eps: 68.4,
    pe: 31.4,
    nav: 195,
    divYield: 5.2,
    sentiment: 82,
    sparkline: [2100, 2125, 2140, 2130, 2160, 2150, 2145, 2135, 2155, 2150]
  }
];

const NEWS_DB = [
  {
    id: "news_1",
    date: "2026-05-24",
    symbol: "NABIL",
    title: "NABIL Reports Strong 14% Q3 Net Profit Growth YoY",
    summary: "Nabil Bank Limited has published its third-quarter financial reports demonstrating exceptional net profitability growth, rising YoY by 14%. Core earnings drivers remain extremely robust despite general banking sector liquidity shifts.",
    bullets: [
      "Net profit increased to NPR 4.2 Billion for the quarter",
      "Non-performing loan (NPL) ratio contained steady at 1.82%",
      "Solid margin improvements with loan expansion focused on green energy portfolios"
    ]
  },
  {
    id: "news_2",
    date: "2026-05-22",
    symbol: "NABIL",
    title: "Nabil Bank Declares Early Cash Dividend of NPR 35 Per Share",
    summary: "The Board of Directors of Nabil Bank Limited proposed an early cash dividend allocation following excellent reserve stability, indicating robust management confidence.",
    bullets: [
      "NPR 35 per share cash payout proposed subject to Nepal Rastra Bank confirmation",
      "Dividend yield calculated at approx 3.1% at present market valuations",
      "AGM date scheduled for next month to approve dividend distribution"
    ]
  },
  {
    id: "news_3",
    date: "2026-05-23",
    symbol: "NMB",
    title: "NMB Bank Partners with FMO for USD 25M Corporate Credit Line",
    summary: "NMB Bank has finalized international credit facility lines with Dutch development bank FMO to support small-medium enterprises running clean-tech infrastructures in Nepal.",
    bullets: [
      "USD 25 Million credit buffer targeting long-term SME ventures",
      "Puts NMB at the forefront of sustainable business banking structures",
      "EPS projection remains steady despite higher localized interest rates"
    ]
  },
  {
    id: "news_4",
    date: "2026-05-25",
    symbol: "AHPC",
    title: "Arun Valley Hydropower Commences Testing of Piluwa Power Unit",
    summary: "AHPC has completed technical installations on its secondary turbine array. Power integration testing against the national grid begins immediately.",
    bullets: [
      "Expected to add 8.5 MW directly to peak hour grid operations",
      "Will elevate revenue stream reliability beginning in early Q1 next year",
      "Current PE remains elevated pending full revenue integration"
    ]
  }
];

// In-Memory mock alerts list
let ALERT_RULES = [
  { id: "alert_1", symbol: "NABIL", metric: "PE", operator: "<", value: 22.0, active: true, tag: "Monitoring Verified" },
  { id: "alert_2", symbol: "NMB", metric: "Price", operator: "<", value: 450, active: true, tag: "Monitoring Verified" },
  { id: "alert_3", symbol: "AHPC", metric: "DivYield", operator: ">", value: 1.0, active: false, tag: "Inactive" }
] as any[];

// Global marquee / micro-ticks list
const TICKERS = [
  { symbol: "NEPSE", value: "2,087.45", delta: "+15.20", trend: "up" },
  { symbol: "Sensitive Index", value: "392.40", delta: "-1.15", trend: "down" },
  { symbol: "Banking Sector", value: "1,142.10", delta: "+8.45", trend: "up" },
  { symbol: "Hydropower Index", value: "2,410.60", delta: "-12.50", trend: "down" },
  { symbol: "Insurance", value: "9,820.00", delta: "+142.00", trend: "up" },
  { symbol: "NABIL", value: "1,245.00", delta: "+1.20%", trend: "up" },
  { symbol: "NMB", value: "410.00", delta: "-0.80%", trend: "down" },
  { symbol: "NICA", value: "720.00", delta: "+0.35%", trend: "up" }
];

// Initialize Gemini SDK lazily
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    // We will still proceed if key is missing, throwing a clear error on first interrogation
    aiInstance = new GoogleGenAI({
      apiKey: key || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/stocks", (req, res) => {
  res.json(STOCKS_DB);
});

app.get("/api/news", (req, res) => {
  res.json(NEWS_DB);
});

app.get("/api/tickers", async (req, res) => {
  try {
    const response = await fetch(`http://127.0.0.1:8002/api/market/tickers`);
    if (!response.ok) {
      return res.status(response.status).json(TICKERS); // fallback to hardcoded
    }
    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    console.error("Error proxying tickers request to FastAPI:", error);
    return res.json(TICKERS); // fallback to hardcoded
  }
});

app.get("/api/alerts", (req, res) => {
  res.json(ALERT_RULES);
});

app.post("/api/alerts", (req, res) => {
  const { symbol, metric, operator, value } = req.body;
  const newAlert = {
    id: `alert_${Date.now()}`,
    symbol: symbol || "NABIL",
    metric: metric || "Price",
    operator: operator || "<",
    value: parseFloat(value) || 0,
    active: true,
    tag: "Monitoring Verified"
  };
  ALERT_RULES.push(newAlert);
  res.json(newAlert);
});

app.post("/api/alerts/toggle/:id", (req, res) => {
  const { id } = req.params;
  const alert = ALERT_RULES.find(a => a.id === id);
  if (alert) {
    alert.active = !alert.active;
    alert.tag = alert.active ? "Monitoring Verified" : "Inactive";
  }
  res.json({ success: true, alerts: ALERT_RULES });
});

app.delete("/api/alerts/:id", (req, res) => {
  const { id } = req.params;
  ALERT_RULES = ALERT_RULES.filter(a => a.id !== id);
  res.json({ success: true, alerts: ALERT_RULES });
});

// Cache simulation: track queries to identify Cache Hit vs Miss
const queryCache = new Map<string, any>();

app.post("/api/interrogate", async (req, res) => {
  const { prompt, symbol: selectedSymbol } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "No prompt query provided." });
  }

  const activeSymbol = selectedSymbol || "NEPSE";

  try {
    const response = await fetch("http://127.0.0.1:8002/api/interrogate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, symbol: activeSymbol })
    });
    
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`FastAPI agent response error: ${errText}`);
    }

    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    console.error("Gemini invocation error proxying to FastAPI: ", error);
    
    // Return structured mock trace on connection failure
    const mockTraces = [
      {
        id: "trace_fail",
        text: `[Connection Fail] Failed to connect to FastAPI Multi-Agent server. Ensure it is running.`,
        status: "error",
        timestamp: new Date().toISOString()
      }
    ];
    
    return res.status(500).json({
      error: `FastAPI Engine Connection Failure: ${error.message || "FastAPI server unreachable."}`,
      traces: mockTraces,
      analysis: "### KITTA Terminal Connection Offline\n\nThe Python FastAPI server hosting the Google ADK Multi-Agent workflow is currently offline or unreachable. Please run the server using `uvicorn main:app --reload` in the `scraper` folder."
    });
  }
});

// Proxy route for generating/fetching visual technical charts
app.get("/api/chart/:symbol", async (req, res) => {
  const { symbol } = req.params;
  try {
    const response = await fetch(`http://127.0.0.1:8002/api/chart/${symbol}`);
    if (!response.ok) {
      return res.status(response.status).send("Chart not found in FastAPI");
    }
    const arrayBuffer = await response.arrayBuffer();
    res.setHeader("Content-Type", "image/png");
    return res.send(Buffer.from(arrayBuffer));
  } catch (error: any) {
    console.error("Error proxying chart request to FastAPI:", error);
    return res.status(500).send("Proxy error fetching chart from FastAPI server");
  }
});

app.get("/api/quant/:symbol", async (req, res) => {
  const { symbol } = req.params;
  try {
    const response = await fetch(`http://127.0.0.1:8002/api/quant/${symbol}`);
    if (!response.ok) {
      return res.status(response.status).json({error: "Quant metrics not found in FastAPI"});
    }
    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    console.error("Error proxying quant request to FastAPI:", error);
    return res.status(500).json({error: "Proxy error fetching quant metrics from FastAPI server"});
  }
});

app.get("/api/metrics/:symbol", async (req, res) => {
  const { symbol } = req.params;
  try {
    const response = await fetch(`http://127.0.0.1:8002/api/metrics/${symbol}`);
    if (!response.ok) {
      return res.status(response.status).json({error: "Metrics not found in FastAPI"});
    }
    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    console.error("Error proxying metrics request to FastAPI:", error);
    return res.status(500).json({error: "Proxy error fetching metrics from FastAPI server"});
  }
});

// Start server
async function boot() {
  // Vite setup for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`KITTA Node dev server compiled and listening on http://localhost:${PORT}`);
  });
}

boot();
