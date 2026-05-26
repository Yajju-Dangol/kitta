import json
import urllib.request
import urllib.error

def fetch_nepse_data(symbol):
    symbol = symbol.strip().upper()
    
    # Corrected static JSON path from the active github-pages cache mirror
    url = "https://shubhamnpk.github.io/yonepse/data/nepse_data.json"
    
    print(f"\nFetching data context for {symbol}...")
    
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        
        with urllib.request.urlopen(req, timeout=5) as response:
            all_stocks = json.loads(response.read().decode())
            
            stock_data = None
            
            # 1. Handle if the payload is a plain list of items
            if isinstance(all_stocks, list):
                stock_data = next((item for item in all_stocks if str(item.get('symbol', '')).upper() == symbol), None)
            
            # 2. Handle if the payload is a dictionary structure
            elif isinstance(all_stocks, dict):
                # Check top-level keys or typical 'data' wrapper targets
                stock_data = all_stocks.get(symbol) or all_stocks.get('data', {}).get(symbol)
                
                # If it's still not found, search deeply through dictionary categories (like keys mapped to nested arrays)
                if not stock_data:
                    for key, val in all_stocks.items():
                        if isinstance(val, list):
                            stock_data = next((item for item in val if str(item.get('symbol', '')).upper() == symbol), None)
                            if stock_data:
                                break

            # Output results safely
            if stock_data:
                print_market_data(symbol, stock_data)
            else:
                print(f"❌ Symbol '{symbol}' not found in the current static cache registry.")
                
    except (urllib.error.URLError, json.JSONDecodeError) as e:
        print(f"\n⚠️ [GATEWAY ERROR]: Cache registry stream unreachable.")
        
    except Exception as e:
        print(f"\n⚠️ Unexpected extraction error: {e}")

def print_market_data(symbol, data):
    print("=" * 45)
    print(f" MARKET DATA FOR: {symbol} (Last Tracked State)")
    print("=" * 45)
    
    # Maps properties across structure keys safely
    current = data.get('lastPrice') or data.get('ltp') or data.get('close') or data.get('price', 'N/A')
    previous = data.get('previousClose') or data.get('prevClose') or data.get('previous_close') or 'N/A'
    change = data.get('change') or data.get('pointChange') or '0.0'
    pct_change = data.get('percentChange') or data.get('percentageChange') or '0.0'
    volume = data.get('volume') or data.get('totalTradedQuantity') or 'N/A'
    
    print(f"Current Price : Rs. {current}")
    print(f"Previous Close: Rs. {previous}")
    print(f"Point Change  : {change}")
    print(f"% Change      : {pct_change}%")
    print(f"Volume        : {volume}")
    print(f"Status        : Market Closed / Weekend Sync")
    print("=" * 45)

if __name__ == "__main__":
    print("NEPSE Static Context Terminal Viewer")
    print("Type 'exit' or 'quit' to close the app.")
    
    while True:
        user_input = input("\nEnter Company Symbol (e.g., NICA, UPPER): ")
        if user_input.lower() in ['exit', 'quit']:
            print("Exiting console application. Goodbye!")
            break
        if not user_input.strip():
            continue
            
        fetch_nepse_data(user_input)