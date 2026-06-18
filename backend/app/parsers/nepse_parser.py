from nepse_scraper import NepseScraper
from typing import Dict, Any, List

class NepseParser:
    """
    A robust parser and wrapper for the NEPSE API using the nepse-scraper package.
    Automatically handles SSL bypass and normalizes responses.
    """
    def __init__(self):
        # Initialize scraper with verify_ssl=False as required for NEPSE's server
        self.scraper = NepseScraper(verify_ssl=False)

    def get_live_market_summary(self) -> Dict[str, Any]:
        """Fetch the live market summary and return structured data."""
        try:
            return self.scraper.get_market_summary()
        except Exception as e:
            raise ValueError(f"Failed to fetch NEPSE market summary: {str(e)}")

    def get_top_gainers(self) -> List[Dict[str, Any]]:
        """Fetch top gainers."""
        try:
            return self.scraper.get_top_stocks('top_gainer')
        except Exception as e:
            raise ValueError(f"Failed to fetch NEPSE top gainers: {str(e)}")

    def get_top_losers(self) -> List[Dict[str, Any]]:
        """Fetch top losers."""
        try:
            return self.scraper.get_top_stocks('top_loser')
        except Exception as e:
            raise ValueError(f"Failed to fetch NEPSE top losers: {str(e)}")

    def get_live_trades(self) -> List[Dict[str, Any]]:
        """Fetch live trading data."""
        try:
            return self.scraper.get_live_trades()
        except Exception as e:
            raise ValueError(f"Failed to fetch NEPSE live trades: {str(e)}")

    def get_company_disclosures(self) -> List[Dict[str, Any]]:
        """Fetch latest company disclosures."""
        try:
            return self.scraper.get_company_disclosures()
        except Exception as e:
            raise ValueError(f"Failed to fetch NEPSE disclosures: {str(e)}")
