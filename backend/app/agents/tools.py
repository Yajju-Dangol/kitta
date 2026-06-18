import urllib.parse
import xml.etree.ElementTree as ET
import requests
from app.services.chart_engine import generate_technical_chart


def free_web_search(symbol: str) -> str:
    """
    Searches the live web for the given query and returns fresh information.
    Use this to scrape real-time news, announcements, and sector movements from the internet.
    """
    symbol = symbol.strip().upper()
    
    # Try to resolve full company name
    full_name = None
    try:
        import os, json
        companies_path = os.path.join(os.path.dirname(__file__), 'companies.json')
        if os.path.exists(companies_path):
            with open(companies_path, 'r', encoding='utf-8') as f:
                companies = json.load(f)
                full_name = companies.get(symbol)
    except Exception:
        pass

    if full_name:
        query = f'"{full_name}" stock Nepal news'
    else:
        query = f"{symbol} stock Nepal news"

    try:
        # Call Jina's search engine with the provided API key
        headers = {
            "Authorization": "Bearer jina_fe7178fc2ebe4d32a102f725990c4ddevB9Nsosq4cWyYNb_ZHUyk_rTSIiP",
            "Accept": "application/json"
        }
        # For Reader/Search we pass Accept: application/json or just normal GET. s.jina.ai usually returns markdown.
        # Let's just use regular headers for Markdown
        headers = {
            "Authorization": "Bearer jina_fe7178fc2ebe4d32a102f725990c4ddevB9Nsosq4cWyYNb_ZHUyk_rTSIiP"
        }
        response = requests.get(f"https://s.jina.ai/{urllib.parse.quote(query)}", headers=headers, timeout=20)
        if response.status_code == 200:
            return response.text[:12000]  # Cap text to save context window tokens
        return f"Search failed with status code: {response.status_code}. Response: {response.text[:200]}"
    except Exception as e:
        return f"Error performing search: {str(e)}"


def search_stock_news(symbol: str) -> str:
    """
    Retrieves the latest news headlines and summaries related to the specified stock symbol in Nepal.

    Args:
        symbol (str): The stock symbol (e.g., NABIL, NICA, NEPSE).

    Returns:
        str: A text compilation of relevant news articles and summaries.
    """
    symbol = symbol.strip().upper()
    
    # Try to resolve full company name
    full_name = None
    try:
        import os, json
        companies_path = os.path.join(os.path.dirname(__file__), 'companies.json')
        if os.path.exists(companies_path):
            with open(companies_path, 'r', encoding='utf-8') as f:
                companies = json.load(f)
                full_name = companies.get(symbol)
    except Exception:
        pass

    if full_name:
        query = f'"{full_name}" news'
    else:
        query = f"{symbol} stock Nepal OR {symbol} NEPSE OR {symbol} news"
        
    encoded_query = urllib.parse.quote(query)

    # Google News RSS feed — free, fast, no API key needed.
    rss_url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-NP&gl=NP&ceid=NP:en"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    try:
        response = requests.get(rss_url, headers=headers, timeout=15)
        if response.status_code != 200:
            return f"Unable to fetch news for {symbol}. Server responded with code: {response.status_code}"

        root = ET.fromstring(response.content)
        items = root.findall('.//item')

        if not items:
            return f"No news found specifically matching {symbol}."

        news_reports = []
        for index, item in enumerate(items[:8], 1):
            title = item.find('title').text
            link = item.find('link').text
            pub_date = item.find('pubDate').text
            source = item.find('source').text if item.find('source') is not None else "Unknown"
            news_reports.append(
                f"[{index}] Title: {title}\n    Source: {source} ({pub_date})\n    Link: {link}"
            )

        return "\n\n".join(news_reports)
    except Exception as e:
        return f"Error occurred while searching news: {str(e)}"


def run_chart_analysis(symbol: str) -> dict:
    """
    Triggers chart scrape and generates full technical chart layout (CSV + PNG visualization).

    Args:
        symbol (str): The stock ticker (e.g., NABIL, NICA, NEPSE).

    Returns:
        dict: A dictionary containing the path to the generated chart and key technical metrics.
    """
    symbol = symbol.strip().upper()
    static_dir = "static/charts"
    return generate_technical_chart(symbol, static_dir=static_dir)
