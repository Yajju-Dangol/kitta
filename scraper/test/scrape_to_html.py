import json
import datetime
import os
import sys
import logging

# Configure basic logging to console
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Make sure we can import local nepse_scraper package
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from nepse_scraper import NepseScraper

def safe_fetch(func, *args, **kwargs):
    """Safely execute a scraper method, returning its JSON-serializable output or an error dictionary."""
    method_name = func.__name__ if hasattr(func, '__name__') else str(func)
    logger.info(f"Fetching data from {method_name}...")
    try:
        data = func(*args, **kwargs)
        # Check if the output can be JSON serialized, convert dates to string if needed
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        logger.error(f"Error fetching data from {method_name}: {e}")
        return {
            "success": False,
            "error": str(e)
        }

def generate_html(data_dict, ticker):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Simple HTML generator helper to render JSON objects or lists into readable tables or list cards
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NEPSE Scraper Dashboard - {ticker.upper()}</title>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {{
            --bg-primary: #0b0f19;
            --bg-secondary: #161d30;
            --bg-tertiary: #1f2942;
            --text-primary: #f3f4f6;
            --text-secondary: #9ca3af;
            --accent-primary: #3b82f6;
            --accent-hover: #2563eb;
            --success: #10b981;
            --danger: #ef4444;
            --warning: #f59e0b;
            --border-color: #2e3b5e;
            --glass-bg: rgba(22, 29, 48, 0.7);
            --glass-border: rgba(46, 59, 94, 0.6);
        }}

        * {{
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }}

        body {{
            font-family: 'Outfit', sans-serif;
            background-color: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.6;
            padding-bottom: 60px;
        }}

        header {{
            background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
            border-bottom: 1px solid var(--border-color);
            padding: 24px 5%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
        }}

        .logo-area h1 {{
            font-size: 24px;
            font-weight: 800;
            background: linear-gradient(to right, #60a5fa, #3b82f6, #1d4ed8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            display: flex;
            align-items: center;
            gap: 8px;
        }}

        .logo-area p {{
            font-size: 13px;
            color: var(--text-secondary);
            margin-top: 4px;
        }}

        .meta-info {{
            text-align: right;
            font-size: 14px;
        }}

        .meta-badge {{
            display: inline-block;
            padding: 4px 12px;
            border-radius: 9999px;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
        }}

        .badge-open {{
            background-color: rgba(16, 185, 129, 0.2);
            color: var(--success);
            border: 1px solid var(--success);
        }}

        .badge-closed {{
            background-color: rgba(239, 68, 68, 0.2);
            color: var(--danger);
            border: 1px solid var(--danger);
        }}

        .container {{
            max-width: 1400px;
            margin: 40px auto 0;
            padding: 0 20px;
        }}

        /* Navigation Tabs */
        .tabs {{
            display: flex;
            background-color: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 6px;
            margin-bottom: 30px;
            overflow-x: auto;
            white-space: nowrap;
            gap: 4px;
        }}

        .tab-btn {{
            background: none;
            border: none;
            color: var(--text-secondary);
            padding: 12px 24px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            border-radius: 8px;
            transition: all 0.2s ease;
            font-family: inherit;
        }}

        .tab-btn:hover {{
            color: var(--text-primary);
            background-color: rgba(255, 255, 255, 0.05);
        }}

        .tab-btn.active {{
            color: var(--text-primary);
            background-color: var(--accent-primary);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }}

        /* Tab Content */
        .tab-content {{
            display: none;
            animation: fadeIn 0.4s ease;
        }}

        .tab-content.active {{
            display: block;
        }}

        @keyframes fadeIn {{
            from {{ opacity: 0; transform: translateY(10px); }}
            to {{ opacity: 1; transform: translateY(0); }}
        }}

        /* Layout Cards */
        .grid-3 {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 24px;
            margin-bottom: 30px;
        }}

        .grid-2 {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
            gap: 24px;
            margin-bottom: 30px;
        }}

        .card {{
            background-color: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }}

        .card-title {{
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}

        /* Table Styles */
        .table-container {{
            width: 100%;
            overflow-x: auto;
            border-radius: 8px;
            border: 1px solid var(--border-color);
        }}

        table {{
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 14px;
        }}

        th {{
            background-color: var(--bg-tertiary);
            color: var(--text-primary);
            font-weight: 600;
            padding: 12px 16px;
            border-bottom: 1px solid var(--border-color);
        }}

        td {{
            padding: 12px 16px;
            border-bottom: 1px solid var(--border-color);
            color: var(--text-primary);
        }}

        tr:last-child td {{
            border-bottom: none;
        }}

        tr:hover td {{
            background-color: rgba(255, 255, 255, 0.02);
        }}

        .text-right {{
            text-align: right;
        }}

        /* Stock Stats */
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
        }}

        .stat-item {{
            background-color: var(--bg-tertiary);
            padding: 16px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.03);
        }}

        .stat-label {{
            font-size: 12px;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}

        .stat-value {{
            font-size: 20px;
            font-weight: 700;
            margin-top: 4px;
        }}

        .stat-value.up {{
            color: var(--success);
        }}

        .stat-value.down {{
            color: var(--danger);
        }}

        /* JSON Inspector */
        .json-container {{
            margin-top: 10px;
        }}

        .endpoint-selector {{
            width: 100%;
            padding: 12px;
            background-color: var(--bg-secondary);
            border: 1px solid var(--border-color);
            color: var(--text-primary);
            border-radius: 8px;
            font-size: 16px;
            font-family: inherit;
            margin-bottom: 20px;
            outline: none;
            cursor: pointer;
        }}

        .raw-json-block {{
            background-color: #05070c;
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 20px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 13px;
            color: #a7f3d0;
            overflow: auto;
            max-height: 600px;
            white-space: pre-wrap;
        }}

        .error-message {{
            background-color: rgba(239, 68, 68, 0.1);
            border: 1px solid var(--danger);
            color: var(--danger);
            padding: 16px;
            border-radius: 12px;
            margin-bottom: 20px;
            font-size: 14px;
        }}
    </style>
</head>
<body>

    <header>
        <div class="logo-area">
            <h1>📊 NEPSE Market Report</h1>
            <p>Interactive dashboard generated for ticker: <strong>{ticker.upper()}</strong></p>
        </div>
        <div class="meta-info">
            <div>Generated at: <strong style="color: var(--accent-primary);">{timestamp}</strong></div>
            <div style="margin-top: 8px;">
                Market Status: 
                <span class="meta-badge {'badge-open' if data_dict['market_open']['data'] == True else 'badge-closed'}">
                    {'OPEN' if data_dict['market_open']['data'] == True else 'CLOSED'}
                </span>
            </div>
        </div>
    </header>

    <div class="container">
        <!-- Navigation Tabs -->
        <nav class="tabs">
            <button class="tab-btn active" onclick="switchTab('stock-detail')">{ticker.upper()} Details</button>
            <button class="tab-btn" onclick="switchTab('market-overview')">Market Overview</button>
            <button class="tab-btn" onclick="switchTab('top-stocks')">Top Lists</button>
            <button class="tab-btn" onclick="switchTab('sectors-indices')">Sectors & Indices</button>
            <button class="tab-btn" onclick="switchTab('raw-data')">Raw API Inspector</button>
        </nav>

        <!-- ================= STOCK DETAIL TAB ================= -->
        <div id="stock-detail" class="tab-content active">
            <!-- Alert if any errors occurred during stock scrape -->
            {"" if data_dict['ticker_info']['success'] else f'<div class="error-message">Error fetching ticker details: {data_dict["ticker_info"].get("error")}</div>'}
            
            <div class="grid-2">
                <!-- Security Profile Card -->
                <div class="card">
                    <div class="card-title">Security Profile</div>
                    <div class="table-container">
                        <table>
                            <tbody>
                                <tr>
                                    <th>Security Name</th>
                                    <td>{get_nested(data_dict, 'ticker_info', 'data', 'security', 'securityName') or 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Symbol</th>
                                    <td><strong style="color: var(--accent-primary);">{get_nested(data_dict, 'ticker_info', 'data', 'security', 'symbol') or ticker.upper()}</strong></td>
                                </tr>
                                <tr>
                                    <th>Sector Name</th>
                                    <td>{get_nested(data_dict, 'ticker_info', 'data', 'security', 'sectorMaster', 'sectorDescription') or 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Email / Website</th>
                                    <td>{get_nested(data_dict, 'ticker_contact', 'data', 'email') or 'N/A'} / {get_nested(data_dict, 'ticker_contact', 'data', 'website') or 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Phone / Address</th>
                                    <td>{get_nested(data_dict, 'ticker_contact', 'data', 'telephoneUrl') or 'N/A'} / {get_nested(data_dict, 'ticker_contact', 'data', 'address') or 'N/A'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Daily Market Summary Stat -->
                <div class="card">
                    <div class="card-title">Daily Trade Statistics</div>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-label">Last Traded Price (LTP)</div>
                            <div class="stat-value">{get_nested(data_dict, 'ticker_info', 'data', 'securityDailyTradeDto', 'lastTransactedPrice') or 'N/A'}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Percentage Change</div>
                            <div class="stat-value {get_change_class(get_nested(data_dict, 'ticker_info', 'data', 'securityDailyTradeDto', 'percentageChange'))}">
                                {get_nested(data_dict, 'ticker_info', 'data', 'securityDailyTradeDto', 'percentageChange') or '0'}%
                            </div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">High / Low Price</div>
                            <div class="stat-value" style="font-size:16px;">
                                High: {get_nested(data_dict, 'ticker_info', 'data', 'securityDailyTradeDto', 'highPrice') or 'N/A'}<br>
                                Low: {get_nested(data_dict, 'ticker_info', 'data', 'securityDailyTradeDto', 'lowPrice') or 'N/A'}
                            </div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Total Turnover</div>
                            <div class="stat-value" style="font-size:16px;">
                                Rs. {format_number(get_nested(data_dict, 'ticker_info', 'data', 'securityDailyTradeDto', 'totalTurnover'))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Price History Table -->
            <div class="card" style="margin-top: 24px;">
                <div class="card-title">30-Day Historical Price Data</div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>High Price</th>
                                <th>Low Price</th>
                                <th>Open Price</th>
                                <th>Close Price</th>
                                <th>Total Qty Traded</th>
                                <th>Total Turnover</th>
                            </tr>
                        </thead>
                        <tbody>
                            {render_history_table(data_dict)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- ================= MARKET OVERVIEW TAB ================= -->
        <div id="market-overview" class="tab-content">
            <div class="grid-2">
                <!-- Market Summary Card -->
                <div class="card">
                    <div class="card-title">Market Summary Indicators</div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Indicator</th>
                                    <th class="text-right">Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {render_market_summary(data_dict)}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Index Overview Table -->
                <div class="card">
                    <div class="card-title">NEPSE Indices Overview</div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Index</th>
                                    <th class="text-right">Value</th>
                                    <th class="text-right">Change</th>
                                    <th class="text-right">% Change</th>
                                </tr>
                            </thead>
                            <tbody>
                                {render_indices_overview(data_dict)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- ================= TOP STOCKS TAB ================= -->
        <div id="top-stocks" class="tab-content">
            <div class="grid-2">
                <!-- Top Gainers Card -->
                <div class="card">
                    <div class="card-title">🔥 Top 10 Gainers</div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Symbol</th>
                                    <th class="text-right">LTP</th>
                                    <th class="text-right">Point Change</th>
                                    <th class="text-right">% Change</th>
                                </tr>
                            </thead>
                            <tbody>
                                {render_top_list(data_dict, 'top_gainer')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Top Losers Card -->
                <div class="card">
                    <div class="card-title">📉 Top 10 Losers</div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Symbol</th>
                                    <th class="text-right">LTP</th>
                                    <th class="text-right">Point Change</th>
                                    <th class="text-right">% Change</th>
                                </tr>
                            </thead>
                            <tbody>
                                {render_top_list(data_dict, 'top_loser')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="grid-3" style="margin-top: 24px;">
                <!-- Top Turnover -->
                <div class="card">
                    <div class="card-title">💰 Top Turnover</div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Symbol</th>
                                    <th class="text-right">Turnover</th>
                                </tr>
                            </thead>
                            <tbody>
                                {render_top_metrics(data_dict, 'top_turnover', 'turnover')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Top Trade -->
                <div class="card">
                    <div class="card-title">🔄 Top Trade Count</div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Symbol</th>
                                    <th class="text-right">Trades</th>
                                </tr>
                            </thead>
                            <tbody>
                                {render_top_metrics(data_dict, 'top_trade', 'totalTrades')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Top Transaction -->
                <div class="card">
                    <div class="card-title">⚡ Top Volume / Transaction</div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Symbol</th>
                                    <th class="text-right">Share Volume</th>
                                </tr>
                            </thead>
                            <tbody>
                                {render_top_metrics(data_dict, 'top_transaction', 'shareVolume')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- ================= SECTORS & INDICES TAB ================= -->
        <div id="sectors-indices" class="tab-content">
            <div class="card">
                <div class="card-title">Sector-wise Status Summary</div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Sector Name</th>
                                <th class="text-right">Index Value</th>
                                <th class="text-right">Change</th>
                                <th class="text-right">% Change</th>
                            </tr>
                        </thead>
                        <tbody>
                            {render_sector_summary(data_dict)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- ================= RAW DATA INSPECTOR ================= -->
        <div id="raw-data" class="tab-content">
            <div class="card">
                <div class="card-title">Raw API Data Inspector</div>
                <select class="endpoint-selector" id="endpointSelect" onchange="showRawJson()">
                    {render_json_options(data_dict)}
                </select>
                <div class="json-container">
                    <pre class="raw-json-block" id="rawJsonBlock">Select an endpoint from the dropdown above to inspect raw JSON data.</pre>
                </div>
            </div>
        </div>
    </div>

    <!-- Hidden element holding raw data for JS inspection -->
    <script id="raw-data-json" type="application/json">
        {json.dumps(data_dict)}
    </script>

    <script>
        // Simple tab switching logic
        function switchTab(tabId) {{
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            
            document.getElementById(tabId).classList.add('active');
            
            // Find button matching this action
            const buttons = Array.from(document.querySelectorAll('.tab-btn'));
            const matchingBtn = buttons.find(b => b.getAttribute('onclick').includes(tabId));
            if (matchingBtn) {{
                matchingBtn.classList.add('active');
            }}
        }}

        // Show raw json data in details inspector
        function showRawJson() {{
            const select = document.getElementById('endpointSelect');
            const block = document.getElementById('rawJsonBlock');
            const rawData = JSON.parse(document.getElementById('raw-data-json').textContent);
            
            const selectedKey = select.value;
            if (selectedKey && rawData[selectedKey]) {{
                block.textContent = JSON.stringify(rawData[selectedKey], null, 2);
            }} else {{
                block.textContent = "No data available.";
            }}
        }}

        // Initialize default view
        document.addEventListener('DOMContentLoaded', () => {{
            showRawJson();
        }});
    </script>
</body>
</html>
"""
    return html_content

def get_nested(data_dict, *keys):
    val = data_dict
    for k in keys:
        if isinstance(val, dict):
            val = val.get(k)
        elif isinstance(val, list) and isinstance(k, int):
            try:
                val = val[k]
            except IndexError:
                return None
        else:
            return None
    return val

def get_change_class(val):
    if not val:
        return ""
    try:
        val_f = float(val)
        if val_f > 0:
            return "up"
        elif val_f < 0:
            return "down"
    except ValueError:
        pass
    return ""

def format_number(val):
    if val is None:
        return "N/A"
    try:
        val_f = float(val)
        return f"{val_f:,.2f}"
    except ValueError:
        return str(val)

def render_history_table(data_dict):
    history_data = get_nested(data_dict, 'ticker_history', 'data')
    # If the history returns a dict with 'content', extract it
    if isinstance(history_data, dict) and 'content' in history_data:
        history_data = history_data['content']
        
    if not history_data or not isinstance(history_data, list):
        return "<tr><td colspan='7' style='text-align: center;'>No price history data available or error occurred.</td></tr>"
        
    rows = []
    for item in history_data[:30]:  # Limit to 30 days
        date = item.get('businessDate') or 'N/A'
        high = format_number(item.get('highPrice'))
        low = format_number(item.get('lowPrice'))
        open_p = format_number(item.get('openPrice'))
        close = format_number(item.get('closePrice'))
        qty = format_number(item.get('totalTradedQuantity'))
        turnover = format_number(item.get('totalTradedValue'))
        
        rows.append(f"""<tr>
            <td>{date}</td>
            <td>{high}</td>
            <td>{low}</td>
            <td>{open_p}</td>
            <td><strong>{close}</strong></td>
            <td>{qty}</td>
            <td>Rs. {turnover}</td>
        </tr>""")
    return "\n".join(rows)

def render_market_summary(data_dict):
    summary_data = get_nested(data_dict, 'market_summary', 'data')
    if not summary_data or not isinstance(summary_data, list):
        return "<tr><td colspan='2'>No market summary indicators available.</td></tr>"
        
    rows = []
    for item in summary_data:
        detail = item.get('detail') or 'N/A'
        val = format_number(item.get('value'))
        rows.append(f"""<tr>
            <td>{detail}</td>
            <td class="text-right"><strong>{val}</strong></td>
        </tr>""")
    return "\n".join(rows)

def render_indices_overview(data_dict):
    indices = get_nested(data_dict, 'nepse_indices', 'data')
    if not indices or not isinstance(indices, list):
        return "<tr><td colspan='4'>No index overview data available.</td></tr>"
        
    rows = []
    for item in indices:
        index_name = item.get('index') or 'N/A'
        val = format_number(item.get('currentValue'))
        change = format_number(item.get('change'))
        pct_change = format_number(item.get('perChange'))
        
        change_class = get_change_class(item.get('change'))
        
        rows.append(f"""<tr>
            <td>{index_name}</td>
            <td class="text-right"><strong>{val}</strong></td>
            <td class="text-right {change_class}">{change}</td>
            <td class="text-right {change_class}">{pct_change}%</td>
        </tr>""")
    return "\n".join(rows)

def render_top_list(data_dict, category):
    stocks = get_nested(data_dict, category, 'data')
    if not stocks or not isinstance(stocks, list):
        return "<tr><td colspan='4'>No data available.</td></tr>"
        
    rows = []
    for item in stocks[:10]:
        symbol = item.get('symbol') or 'N/A'
        ltp = format_number(item.get('ltp'))
        change = format_number(item.get('pointChange'))
        pct_change = format_number(item.get('percentageChange'))
        
        change_class = get_change_class(item.get('pointChange'))
        
        rows.append(f"""<tr>
            <td><strong>{symbol}</strong></td>
            <td class="text-right">{ltp}</td>
            <td class="text-right {change_class}">{change}</td>
            <td class="text-right {change_class}">{pct_change}%</td>
        </tr>""")
    return "\n".join(rows)

def render_top_metrics(data_dict, category, metric_key):
    stocks = get_nested(data_dict, category, 'data')
    if not stocks or not isinstance(stocks, list):
        return "<tr><td colspan='2'>No data available.</td></tr>"
        
    rows = []
    for item in stocks[:10]:
        symbol = item.get('symbol') or 'N/A'
        val = format_number(item.get(metric_key))
        
        rows.append(f"""<tr>
            <td><strong>{symbol}</strong></td>
            <td class="text-right">{val}</td>
        </tr>""")
    return "\n".join(rows)

def render_sector_summary(data_dict):
    sectors = get_nested(data_dict, 'sectorwise_summary', 'data')
    if not sectors or not isinstance(sectors, list):
        return "<tr><td colspan='4'>No sector summary data available.</td></tr>"
        
    rows = []
    for item in sectors:
        sector_name = item.get('sectorName') or 'N/A'
        idx_val = format_number(item.get('indexValue'))
        change = format_number(item.get('indexChange'))
        pct_change = format_number(item.get('percentageChange'))
        
        change_class = get_change_class(item.get('indexChange'))
        
        rows.append(f"""<tr>
            <td>{sector_name}</td>
            <td class="text-right"><strong>{idx_val}</strong></td>
            <td class="text-right {change_class}">{change}</td>
            <td class="text-right {change_class}">{pct_change}%</td>
        </tr>""")
    return "\n".join(rows)

def render_json_options(data_dict):
    options = []
    for key in sorted(data_dict.keys()):
        status = "Success" if data_dict[key]['success'] else "Failed"
        options.append(f'<option value="{key}">{key} ({status})</option>')
    return "\n".join(options)


def main():
    print("=========================================================")
    print("NEPSE Scraper & HTML Dashboard Generator")
    print("=========================================================")
    
    ticker = input("Enter the stock ticker symbol to scrape (e.g. NABIL, ACLBSL): ").strip()
    if not ticker:
        print("Error: Ticker cannot be empty.")
        return

    print(f"\nInitializing NEPSE Scraper for ticker: {ticker.upper()}...")
    scraper = NepseScraper(verify_ssl=False)
    
    # Calculate date ranges for historical data (last 30 days)
    end_date = datetime.date.today()
    start_date = end_date - datetime.timedelta(days=30)
    
    start_date_str = start_date.strftime("%Y-%m-%d")
    end_date_str = end_date.strftime("%Y-%m-%d")
    
    # Storage for all scraped data
    all_data = {}
    
    # Scrape General Market Endpoints
    all_data['market_open'] = safe_fetch(scraper.is_market_open)
    all_data['market_summary'] = safe_fetch(scraper.get_market_summary)
    all_data['sectorwise_summary'] = safe_fetch(scraper.get_sectorwise_summary)
    all_data['nepse_indices'] = safe_fetch(scraper.get_nepse_index)
    all_data['sectors'] = safe_fetch(scraper.get_sectors)
    all_data['sector_indices'] = safe_fetch(scraper.get_sector_indices)
    all_data['market_cap'] = safe_fetch(scraper.get_market_cap)
    all_data['supply_demand'] = safe_fetch(scraper.get_supply_demand, show_all=True)
    all_data['trading_average'] = safe_fetch(scraper.get_trading_average)
    all_data['notices'] = safe_fetch(scraper.get_notices)
    all_data['info_officers'] = safe_fetch(scraper.get_info_officers)
    all_data['live_trades'] = safe_fetch(scraper.get_live_trades)
    
    # Scrape Top Stock Lists
    all_data['top_gainer'] = safe_fetch(scraper.get_top_stocks, category='top_gainer')
    all_data['top_loser'] = safe_fetch(scraper.get_top_stocks, category='top_loser')
    all_data['top_turnover'] = safe_fetch(scraper.get_top_stocks, category='top_turnover')
    all_data['top_trade'] = safe_fetch(scraper.get_top_stocks, category='top_trade')
    all_data['top_transaction'] = safe_fetch(scraper.get_top_stocks, category='top_transaction')
    all_data['top_trade_qty'] = safe_fetch(scraper.get_top_by_trade_quantity)
    
    # Scrape Ticker-Specific Endpoints
    all_data['ticker_info'] = safe_fetch(scraper.get_ticker_info, ticker)
    all_data['ticker_daily_stat'] = safe_fetch(scraper.get_security_daily_trade_stat, ticker)
    all_data['ticker_contact'] = safe_fetch(scraper.get_ticker_contact, ticker)
    all_data['ticker_history'] = safe_fetch(scraper.get_ticker_price_history, ticker, start_date=start_date_str, end_date=end_date_str)
    
    print("\nScraping complete. Generating dashboard...")
    
    html_content = generate_html(all_data, ticker)
    
    filename = f"nepse_report_{ticker.upper()}.html"
    try:
        with open(filename, "w", encoding="utf-8") as f:
            f.write(html_content)
        print(f"\n[SUCCESS] Dashboard successfully created: {filename}")
        print(f"Absolute path: {os.path.abspath(filename)}")
    except Exception as e:
        print(f"\n[FAILURE] Failed to write HTML file: {e}")

if __name__ == "__main__":
    main()
