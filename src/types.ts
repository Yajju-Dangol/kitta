/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  open: number;
  high52: number;
  low52: number;
  volume: string;
  sector: string;
  eps: number;
  pe: number;
  rsi?: number;
  nav: number;
  divYield: number;
  sentiment: number; // 0 to 100 (bearish to bullish)
  sparkline: number[]; // Array of 10-15 data points for minimal chart rendering
  aiTarget?: string;
  aiRisk?: string;
  relativeVolume?: string;
}

export interface NewsItem {
  id: string;
  date: string;
  symbol: string;
  title: string;
  summary: string;
  bullets: string[];
}

export interface AlertRule {
  id: string;
  symbol: string;
  metric: 'PE' | 'Price' | 'DivYield';
  operator: '<' | '>';
  value: number;
  active: boolean;
  tag: 'Monitoring Verified' | 'Triggered' | 'Inactive';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface TraceLine {
  id: string;
  text: string;
  status: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

export interface AppState {
  currentView: 'dashboard' | 'drilldown' | 'watchlist' | 'sandbox';
  selectedSymbol: string; // Active drill-down target
  queryText: string; // Current user queries prefilled or entered
}
