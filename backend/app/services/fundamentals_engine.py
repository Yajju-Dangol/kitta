import cloudscraper
from bs4 import BeautifulSoup
from typing import Dict, Any, Optional

def fetch_all_fundamentals() -> Dict[str, Dict[str, Any]]:
    """
    Fetches fundamental data for all stocks from NepseAlpha's hidden AJAX endpoint.
    Returns a dictionary keyed by stock symbol.
    """
    url = 'https://nepsealpha.com/trading-signals/funda?fsk=xby3OLvK&type=ajax'
    scraper = cloudscraper.create_scraper(
        browser={
            'browser': 'chrome',
            'platform': 'windows',
            'desktop': True
        }
    )
    
    try:
        response = scraper.get(url, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        tbody = soup.find('tbody')
        if not tbody:
            return {}
            
        rows = tbody.find_all('tr')
        fundamentals_map = {}
        
        for row in rows:
            cols = row.find_all('td')
            if len(cols) >= 22:
                symbol = cols[0].text.strip()
                if not symbol:
                    continue
                    
                data = {
                    "financial_strength": cols[1].text.strip(),
                    "sector": cols[3].text.strip(),
                    "pe": cols[6].text.strip(),
                    "pb": cols[7].text.strip(),
                    "roe": cols[8].text.strip(),
                    "roa": cols[9].text.strip(),
                    "peg": cols[10].text.strip(),
                    "graham_discount": cols[11].text.strip(),
                    "pe_vs_sector": cols[12].text.strip(),
                    "pb_vs_sector": cols[13].text.strip(),
                    "peg_vs_sector": cols[14].text.strip(),
                    "dividend_yield_vs_sector": cols[15].text.strip(),
                    "roe_vs_sector": cols[16].text.strip(),
                    "yoy_growth_vs_sector": cols[17].text.strip(),
                    "qoq_growth_vs_sector": cols[18].text.strip(),
                    "roa_vs_sector": cols[19].text.strip(),
                    "dividend_yield": cols[20].text.strip(),
                    "payout_ratio": cols[21].text.strip()
                }
                fundamentals_map[symbol] = data
                
        return fundamentals_map
        
    except Exception as e:
        print(f"Error fetching fundamentals from NepseAlpha: {e}")
        return {}

def get_symbol_fundamentals(symbol: str) -> Optional[Dict[str, Any]]:
    """Convenience method to get fundamentals for a single symbol."""
    symbol = symbol.strip().upper()
    all_funda = fetch_all_fundamentals()
    return all_funda.get(symbol, None)
