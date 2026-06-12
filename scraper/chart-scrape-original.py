import cloudscraper
import pandas as pd
from datetime import datetime
import time

def fetch_nepsealpha_chart_data(symbol, resolution, start_date, end_date):
    """
    Fetches historical chart data directly from NepseAlpha's hidden API using Cloudscraper to bypass 403 blocks.
    """
    # 1. Convert human-readable dates to UNIX timestamps
    dt_format = "%Y-%m-%d"
    try:
        start_ts = int(time.mktime(datetime.strptime(start_date, dt_format).timetuple()))
        end_ts = int(time.mktime(datetime.strptime(end_date, dt_format).timetuple()))
    except ValueError:
        print("Date format error. Please use YYYY-MM-DD.")
        return None

    # 2. The NepseAlpha XHR endpoint
    url = "https://nepsealpha.com/trading/1/history"
    
    # 3. Build the query payload
    params = {
        "symbol": symbol,
        "resolution": resolution,
        "from": start_ts,
        "to": end_ts,
        "currencyCode": "NRS"
    }
    
    # 4. Initialize Cloudscraper to bypass anti-bot protections (Cloudflare/WAF)
    # This perfectly mimics a standard Windows Chrome browser
    scraper = cloudscraper.create_scraper(
        browser={
            'browser': 'chrome',
            'platform': 'windows',
            'desktop': True
        }
    )
    
    # Headers required by the specific endpoint
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Referer": "https://nepsealpha.com/nepse-chart",
        "Origin": "https://nepsealpha.com"
    }
    
    try:
        # Fetch the data using the scraper instead of standard requests
        response = scraper.get(url, params=params, headers=headers)
        
        # If still failing, print the exact reason
        if response.status_code == 403:
            print("Error 403: Still getting blocked. The site might have increased its security level.")
            return None
            
        response.raise_for_status() 
        data = response.json()
        
        # Check if the API returned a valid 'ok' status
        if data.get('s') != 'ok':
            print(f"No data found for {symbol}. API Status: {data.get('s')}")
            return None
            
        # 5. Extract arrays and map them to a tabular DataFrame
        df = pd.DataFrame({
            'Timestamp': data['t'],  # Time
            'Open': data['o'],       # Open
            'High': data['h'],       # High
            'Low': data['l'],        # Low
            'Close': data['c'],      # Close
            'Volume': data['v']      # Volume
        })
        
        # Convert the raw UNIX timestamps into readable dates
        df['Date'] = pd.to_datetime(df['Timestamp'], unit='s')
        
        # Clean up and reorder columns
        df = df[['Date', 'Open', 'High', 'Low', 'Close', 'Volume']]
        
        return df

    except Exception as e:
        print(f"An error occurred: {e}")
        return None

# ==========================================
# Execution Setup
# ==========================================
if __name__ == "__main__":
    target_symbol = "NEPSE"         
    target_timeframe = "1D"         
    start_date = "2020-01-01"       
    end_date = datetime.today().strftime('%Y-%m-%d')
    
    print(f"Fetching {target_timeframe} chart data for {target_symbol}...")
    
    df = fetch_nepsealpha_chart_data(target_symbol, target_timeframe, start_date, end_date)
    
    if df is not None:
        print("\nData fetched successfully! Preview:")
        print(df.tail()) 
        
        filename = f"{target_symbol}_historical_data.csv"
        df.to_csv(filename, index=False)
        print(f"\n✅ Full dataset saved to: {filename}")