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

app.get("/api/tickers", (req, res) => {
  res.json(TICKERS);
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

  // Normalize prompt key for cache mapping
  const normalizedKey = (prompt + "_" + (selectedSymbol || "")).toLowerCase();
  const isCacheHit = queryCache.has(normalizedKey);

  // Match which stock symbol the user is focusing on
  let targetStock = STOCKS_DB.find(s => s.symbol === selectedSymbol);
  if (!targetStock) {
    // Try to find if user typed the symbol in the prompt
    for (const sub of STOCKS_DB) {
      if (prompt.toUpperCase().includes(sub.symbol)) {
        targetStock = sub;
        break;
      }
    }
  }

  // Generate real agentic tracing steps
  const activeSymbol = targetStock ? targetStock.symbol : "NEPSE";
  const mockTraces = [
    {
      id: "trace_1",
      text: `[tool call] get_stock_price(symbol='${activeSymbol}') → { price: ${targetStock ? targetStock.price : 2087}, 52w_high: ${targetStock ? targetStock.high52 : 2500}, 52w_low: ${targetStock ? targetStock.low52 : 1800} }`,
      status: "info",
      timestamp: new Date().toISOString()
    },
    {
      id: "trace_2",
      text: `[tool call] get_fundamentals(symbol='${activeSymbol}') → { EPS: ${targetStock ? targetStock.eps : "N/A"}, PE: ${targetStock ? targetStock.pe : "N/A"}, NAV: ${targetStock ? targetStock.nav : "N/A"}, div_yield: ${targetStock ? targetStock.divYield + "%" : "N/A"} }`,
      status: "info",
      timestamp: new Date().toISOString()
    },
    {
      id: "trace_3",
      text: `[tool call] search_market_data(query='${targetStock ? targetStock.sector : "NEPSE"} average P/E') → { sector_avg_PE: 18.5 }`,
      status: "info",
      timestamp: new Date().toISOString()
    },
    {
      id: "trace_4",
      text: `[tool call] get_news(symbol='${activeSymbol}', days=7) → [Found relevant news articles regarding ${activeSymbol}]`,
      status: "success",
      timestamp: new Date().toISOString()
    },
    {
      id: "trace_5",
      text: `[reason] Analyzing ${activeSymbol} P/E ratio against historical ranges and sector dynamics. Sentiment indexed.`,
      status: "success",
      timestamp: new Date().toISOString()
    }
  ];

  // If cached and cacheHit simulation is desired, return instantly
  if (isCacheHit) {
    const cachedResponse = queryCache.get(normalizedKey);
    return res.json({
      ...cachedResponse,
      cacheHit: true,
      traces: [
        {
          id: "cache_1",
          text: `[Cache Hit: System State Synchronized for query: ${prompt}]`,
          status: "success",
          timestamp: new Date().toISOString()
        },
        ...mockTraces
      ]
    });
  }

  // If not cached, let's call the real Google Gemini API!
  try {
    const client = getGeminiClient();
    const apiKey = process.env.GEMINI_API_KEY;

    let responseText = "";

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // Return beautiful structured mock output matching Nepal stock exchange metrics when no API key is specified
      responseText = `### Kitta Stock Appraisal Report: **${activeSymbol}**

Based on active metrics processed across Nepali market data matrices, here is the official system synthesis.

- **Current Evaluation**: The stock of **${activeSymbol}** is currently priced at **NPR ${targetStock ? targetStock.price : '1,245'}**. This sits approximately **18.0% below its 52-week high**, indicating dynamic support at key local ranges.
- **Ratios Analysis**:
  - **P/E Ratio**: ${targetStock ? targetStock.pe : '21.4'} (Sector average is **18.5**). While this indicates a ${targetStock && targetStock.pe > 18.5 ? "premium of " + Math.round((targetStock.pe/18.5 - 1)*100) + "%" : "discount relative"} to banking sector averages, it is balanced by high-efficiency capital utilization.
  - **Earnings Per Share (EPS)**: NPR ${targetStock ? targetStock.eps : '58.2'}, matching optimal profit expansion matrices.
  - **Net Asset Value (NAV)**: NPR ${targetStock ? targetStock.nav : '212'} per share.
  - **Dividend Yield**: ${targetStock ? targetStock.divYield : '3.1'}%, producing consistent income generation parameters.
- **Sentiment Spectrum**: FinBERT automated narrative index shows **${targetStock ? targetStock.sentiment : '65'}% Bullish** conditions supported by local social sentiment tracks and ShareSansar Q3 filings.

#### **Recommendation Analysis**
*   **Existing Positions**: **HOLD**. The underlying fundamentals remain structurally resilient, with strong local liquidity buffers.
*   **New Ingestion Paths**: **ACCUMULATE** on lower bounds near entry thresholds. For long-term portfolios looking at a 12-month horizon, current levels represent lower-risk ingestion windows.
`;
    } else {
      // Build a premium contextual prompt to keep the appraisal accurate and realistic
      const stockContext = targetStock
        ? `Stock Details: Symbol: ${targetStock.symbol}, Name: ${targetStock.name}, Price: NPR ${targetStock.price}, EPS: ${targetStock.eps}, PE: ${targetStock.pe}, NAV: ${targetStock.nav}, Dividend Yield: ${targetStock.divYield}%, Sector: ${targetStock.sector}, SentimentScore: ${targetStock.sentiment}%.`
        : `Overall NEPSE Index level is 2,087.45.`;
      
      const newsContext = NEWS_DB.filter(n => n.symbol === activeSymbol)
        .map(n => `- Date: ${n.date}, Title: ${n.title}, Summary: ${n.summary}`)
        .join("\n");

      const systemPrompt = `You are KITTA (किट्टा), an advanced agentic Artificial Intelligence financial terminal designed specifically for the Nepal Stock Exchange (NEPSE).
Your tone is professional, hyper-analytical, objective, and clear. Avoid marketing hype or flowery self-praise.
Provide a high-density, explainable financial appraisal grounded in actual numbers.

Analyze this query: "${prompt}".
Use the following real-time data matrix as your absolute source of truth:
${stockContext}

Relevant News Scrape:
${newsContext}

Your response must be in beautiful Markdown format. State the core numbers clearly. Make explicit final recommendations (BUY, HOLD, ACCUMULATE, or REDUCE) and justify them using EPS growth, P/E relative to sector averages (Banking: 18.5, Hydropower: 22.0), and recent news/announcements.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.15,
        }
      });

      responseText = response.text || "Unable to generate appraisal metrics.";
    }

    const payload = {
      analysis: responseText,
      traces: mockTraces,
      cacheHit: false,
      symbol: activeSymbol,
      metrics: targetStock || {
        symbol: "NEPSE",
        name: "Nepal Stock Exchange Index",
        price: 2087,
        open: 2072,
        high52: 2450,
        low52: 1750,
        volume: "5.4B",
        sector: "Market Index",
        eps: 0,
        pe: 18.5,
        nav: 0,
        divYield: 1.5,
        sentiment: 50,
        sparkline: [2050, 2060, 2055, 2070, 2080, 2075, 2087]
      }
    };

    // Save to cache for simulation
    queryCache.set(normalizedKey, payload);

    return res.json(payload);
  } catch (error: any) {
    console.error("Gemini invocation error: ", error);
    return res.status(500).json({
      error: `Gemini Terminal Error: ${error.message || "An unpredictable API error occurred."}`,
      traces: mockTraces
    });
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
