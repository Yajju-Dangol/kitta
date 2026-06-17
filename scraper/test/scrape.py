import os
import time
from playwright.sync_api import sync_playwright

def capture_nepse_chart(symbol):
    symbol = symbol.strip().upper()
    url = f"https://nepsealpha.com/nepse-chart?symbol={symbol}"
    
    download_folder = r"C:\Users\LENOVO\Downloads"
    output_filename = f"NEPSE_{symbol}_{int(time.time())}.png"
    output_path = os.path.join(download_folder, output_filename)
    
    print(f"\nLaunching background engine to view {symbol}...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # Adding an explicit user agent strings fixes many site load hangs
        page = browser.new_page(
            viewport={"width": 1920, "height": 1080},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        
        print(f"Connecting to data network stream for chart rendering...")
        
        # FIX 1: Change wait_until condition to "domcontentloaded" (Don't wait for infinite networks/ads)
        # FIX 2: Set an explicit navigation timeout (20 seconds) so it won't hang indefinitely
        page.goto(url, wait_until="domcontentloaded", timeout=20000)
        
        print("Waiting for chart container element to render...")
        
        # FIX 3: Target a specific DOM selector layout component instead of guessing
        try:
            # This selector targets NepseAlpha's main center chart layout section
            page.wait_for_selector(".chart-main, #tv_chart_container, canvas", timeout=10000)
        except Exception:
            print("⚠️ Chart wrapper element took longer to respond. Proceeding with safety delay...")
            
        print("Buffering dynamic canvas elements...")
        # A simple, reliable raw delay to let the TradingView candlesticks catch up and draw
        time.sleep(6) 
        
        # Take the screenshot and dump it to your folder location
        page.screenshot(path=output_path, full_page=False)
        
        print("=" * 55)
        print(f"✅ SUCCESS: Snapshot stored for symbol '{symbol}'")
        print(f"📂 Location: {output_path}")
        print("=" * 55)
        
        browser.close()

if __name__ == "__main__":
    print("NEPSE Chart Terminal Snapshot Tool (Robust Mode)")
    print("Type 'exit' to close.")
    
    while True:
        stock_input = input("\nEnter Stock Symbol (e.g., BHL, NICA, UPPER): ").strip()
        if stock_input.lower() == 'exit':
            print("Closing application layer.")
            break
        if not stock_input:
            continue
            
        try:
            capture_nepse_chart(stock_input)
        except Exception as e:
            print(f"❌ Automation interface failure: {e}")