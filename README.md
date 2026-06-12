# Kitta (किट्टा)

**Kitta** is an agentic stock appraiser terminal for the **Nepal Stock Exchange (NEPSE)**. It combines a high-density analytics dashboard with an AI assistant powered by Google Gemini, featuring real-time agentic trace consoles, watchlist alerting, and explainable, data-grounded stock appraisals.

## Features

- **Main Terminal** – High-density spreadsheet grid of NEPSE stocks (price, EPS, P/E, NAV, dividend yield, sentiment, sparklines) with a live telemetry strip
- **Asset Deep Dive** – Per-symbol drilldown with timeseries charts, evidence matrix, and news timeline
- **Watchlist Forge** – Create, toggle, and delete custom alert rules (e.g. `NABIL Price < 1200`)
- **Macro Insights Hub** – Market-wide and sector-level insights
- **Sidecar Assistant** – Gemini-powered AI appraiser that produces Markdown reports with explicit BUY / HOLD / ACCUMULATE / REDUCE recommendations, grounded in stock fundamentals and scraped news
- **Agentic Trace Console** – Visualizes the assistant's tool calls and reasoning steps (`get_stock_price`, `get_fundamentals`, `get_news`, ...)
- **Query caching** – Repeated prompts are served instantly from an in-memory cache

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 4, Motion, lucide-react |
| Backend | Express (Node.js), `tsx` for dev, esbuild bundle for production |
| AI | Google Gemini via `@google/genai` |
| Tooling | `scrape.py` – Playwright-based NEPSE chart snapshot tool |

## Getting Started

### Prerequisites

- Node.js 20+
- A Google Gemini API key (optional – the app falls back to structured mock appraisals without one)

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables (copy `.env.example` to `.env`):

   ```bash
   GEMINI_API_KEY="your-gemini-api-key"
   APP_URL="http://localhost:3000"
   ```

3. Start the development server (Express + Vite in middleware mode):

   ```bash
   npm run dev
   ```

   The app is served at `http://localhost:3000`.

### Production Build

```bash
npm run build   # builds the Vite frontend and bundles server.ts to dist/server.cjs
npm start       # runs the production server
```

Other scripts: `npm run lint` (type check), `npm run clean` (remove `dist/`).

## API Endpoints

The Express server (`server.ts`) exposes:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/stocks` | NEPSE stock data with fundamentals and sparklines |
| `GET` | `/api/news` | News articles per symbol |
| `GET` | `/api/tickers` | Ticker tape data |
| `GET` | `/api/alerts` | List alert rules |
| `POST` | `/api/alerts` | Create an alert rule |
| `POST` | `/api/alerts/toggle/:id` | Toggle an alert on/off |
| `DELETE` | `/api/alerts/:id` | Delete an alert rule |
| `POST` | `/api/interrogate` | Run an AI appraisal query (`{ prompt, symbol }`) returning analysis, agentic traces, and metrics |

## Project Structure

```
├── server.ts              # Express server, in-memory NEPSE data, Gemini integration
├── scrape.py              # Playwright tool to capture NEPSE chart screenshots
├── src/
│   ├── App.tsx            # Root app, view routing and shared state
│   ├── types.ts           # Shared TypeScript types (Stock, AlertRule, ...)
│   ├── pages/
│   │   ├── MainTerminalPage.tsx
│   │   ├── AssetDeepDivePage.tsx
│   │   ├── WatchlistForgePage.tsx
│   │   └── MacroInsightsHubPage.tsx
│   └── components/        # SpreadsheetGrid, SidecarAssistant, TraceConsole, etc.
├── vite.config.ts
└── package.json
```

## Chart Snapshot Tool

`scrape.py` captures chart screenshots from NepseAlpha for any NEPSE symbol:

```bash
pip install playwright
playwright install chromium
python scrape.py
```

Enter a symbol (e.g. `NABIL`, `NICA`, `UPPER`) when prompted; screenshots are saved as PNG files.

## Notes

- Stock and news data is currently served from an in-memory repository in `server.ts` for demonstration purposes.
- Without a valid `GEMINI_API_KEY`, the `/api/interrogate` endpoint returns a realistic mock appraisal so the full UI flow can be tested offline.
