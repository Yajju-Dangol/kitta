from app.models.responses import ScrapedNewsItem
from typing import List, Dict, Any
import datetime

class ScrapedDataParser:
    """
    Parses unstructured scraped data or mock feeds and normalizes them into structured items.
    """
    def __init__(self):
        pass

    def parse_news_feed(self, raw_data: List[Dict[str, Any]]) -> List[ScrapedNewsItem]:
        """
        Takes raw dictionaries from a scraped feed and returns validated Pydantic models.
        """
        parsed_items = []
        for index, item in enumerate(raw_data):
            # Attempt to normalize common fields
            try:
                date = item.get('date', datetime.date.today().strftime('%Y-%m-%d'))
                symbol = item.get('symbol', 'UNKNOWN')
                title = item.get('title', 'No Title')
                bullets = item.get('bullets', [])
                
                # If bullets are empty or missing, try to generate a summary placeholder
                if not bullets and 'summary' in item:
                    bullets = [item['summary']]
                
                parsed_item = ScrapedNewsItem(
                    id=item.get('id', f"news_{index}"),
                    date=date,
                    symbol=symbol,
                    title=title,
                    bullets=bullets
                )
                parsed_items.append(parsed_item)
            except Exception as e:
                # Log parsing error and skip malformed item
                print(f"Failed to parse news item: {e}")
                continue
                
        return parsed_items
