# NEPSE Scraper API Reference

A robust and feature-complete Python client for the Nepal Stock Exchange (NEPSE) API.

## Installation

Install the package directly from PyPI:
```bash
pip install nepse-scraper
```

## Quick Start & SSL/TLS Verification Warning

The official NEPSE server has a known issue where it does not provide a complete SSL/TLS certificate chain. This will cause `SSLCertVerificationError` connection errors in most standard Python environments.

> [!IMPORTANT]
> It is highly recommended to initialize the client with `verify_ssl=False` to ensure a successful connection:
> ```python
> from nepse_scraper import NepseScraper
> 
> scraper = NepseScraper(verify_ssl=False)
> ```

## Class Reference

This section lists all methods provided by the `NepseScraper` class in the `nepse-scraper` library.


## `call_endpoint(name: str, params: Dict | None = None, payload: Dict | None = None, which_payload: str | None = None) -> Any`
Calls a registered endpoint by its name.

This is a generic method to interact with both built-in and
user-registered endpoints.

Args:
    name: The name of the endpoint to call.
    params: A dictionary of query string parameters for the request.
    payload: A dictionary for the JSON request body.
    which_payload (str, optional): The type of dynamic payload to generate ('stock-live' or 'sector-live').

Returns:
    The JSON response from the API.
    
Raises:
    ValueError: If the endpoint name is not found or the method is unsupported.

---
## `get_all_securities() -> List[Dict[str, Any]]`
Retrieve a list of all listed securities on the NEPSE.

Returns:
    List[Dict[str, Any]]: A list of dictionaries, each with details of a security.

---
## `get_brokers(**kwargs) -> List[Dict[str, Any]]`
Fetches a list of all registered brokers from NEPSE with optional filters.

---
## `get_company_disclosures() -> List[Dict[str, Any]]`
Retrieve the latest news and announcements (disclosures) from NEPSE.

Returns:
    List[Dict[str, Any]]: A list of news and announcements.

---
## `get_indices_history(index_id: int, start_date: str, end_date: str) -> List[Dict[str, Any]]`
Fetches the historical data for a given index ID within a date range.

Args:
    index_id (int): The ID of the index to fetch (e.g., 58 for NEPSE Index).
    start_date (str): The start date in "YYYY-MM-DD" format.
    end_date (str): The end date in "YYYY-MM-DD" format.

Returns:
    List[Dict[str, Any]]: A list of historical data points for the index.

---
## `get_info_officers() -> List[Dict[str, Any]]`
Retrieves a list of information officers from NEPSE.

Returns:
    List[Dict[str, Any]]: A list of dictionaries, each representing an information officer.

---
## `get_live_indices(index_id: int = 58) -> List[Dict[str, Any]]`
Retrieve live indices data. If the market is closed, it retrieves the last trading day's index data.

Args:
    index_id (int): The ID for the index. Defaults to 58 (NEPSE Index).
                    Refer to NEPSE documentation for a full list of valid index IDs.

Returns:
    List[Dict[str, Any]]: A list containing time-series data for the index.
    
Raises:
    ValueError: If the provided index ID is not within a valid range.

---
## `get_live_trades() -> List[Dict[str, Any]]`
Fetches the live market trades if the market is open.

Returns:
    List[Dict[str, Any]]: A list of live trade data, or an empty list if the market is closed.

---
## `get_market_cap() -> List[Dict[str, Any]]`
Retrieve market capitalization data from the Nepal Stock Exchange (NEPSE).

Returns:
    List[Dict[str, Any]]: A list containing market capitalization data.

---
## `get_market_summary() -> Dict[str, Any]`
Retrieve today's market summary from the Nepal Stock Exchange (NEPSE).

Returns:
    Dict[str, Any]: A dictionary containing the current market summary.

---
## `get_market_summary_history() -> List[Dict[str, Any]]`
Retrieve the market summary history from the Nepal Stock Exchange (NEPSE).

Returns:
    List[Dict[str, Any]]: A JSON response containing the historical market summary.

---
## `get_nepse_index() -> List[Dict[str, Any]]`
Retrieves the NEPSE index and sub-indices data.

Returns:
    List[Dict[str, Any]]: A list of dictionaries, each representing an index.

---
## `get_notices() -> List[Dict[str, Any]]`
Retrieves general notices from NEPSE.

Returns:
    List[Dict[str, Any]]: A list of dictionaries, each representing a notice.

---
## `get_sector_indices() -> List[Dict[str, Any]]`
Retrieve index information for all sectors listed in the NEPSE.

Returns:
    List[Dict[str, Any]]: A list of dictionaries containing sector index data.

---
## `get_sectors() -> List[Dict[str, Any]]`
Retrieve details of all sectors listed in the NEPSE.

Returns:
    List[Dict[str, Any]]: A list of dictionaries, each containing sector details.

---
## `get_sectorwise_summary() -> List[Dict[str, Any]]`
Retrieve the sector-wise summary from the Nepal Stock Exchange (NEPSE).

Returns:
    List[Dict[str, Any]]: A JSON response from the NEPSE API containing the sector-wise summary.

---
## `get_securities_list() -> List[Dict[str, Any]]`
Retrieves a simplified list of all securities.

Returns:
    List[Dict[str, Any]]: A list of dictionaries, each representing a security.

---
## `get_security_daily_trade_stat(ticker: str) -> Dict[str, Any]`
Retrieves daily trade statistics for a specific security.

Args:
    ticker (str): The ticker symbol of the security.

Returns:
    Dict[str, Any]: A dictionary containing the daily trade statistics.

---
## `get_supply_demand(show_all: bool = False) -> List[Dict[str, Any]]`
Retrieves the top supply and demand data.

Args:
    show_all (bool): If True, fetches all supply/demand data, not just the top. Defaults to False.

Returns:
    List[Dict[str, Any]]: A list of supply and demand data.

---
## `get_ticker_contact(ticker: str | List[str]) -> Dict[str, Any] | Dict[str, Dict[str, Any]]`
Retrieve contact information for one or more tickers from Nepse.

Args:
    ticker (Union[str, List[str]]): A single ticker symbol or a list of ticker symbols.

Returns:
    Union[Dict[str, Any], Dict[str, Dict[str, Any]]]: 
        Contact information for a single ticker, or a dictionary of contact information keyed by ticker symbol.

Raises:
    ValueError: If the ticker is not found or no ticker is provided.

---
## `get_ticker_info(ticker: str | List[str]) -> Dict[str, Any] | Dict[str, Dict[str, Any]]`
Retrieve all the information for one or more tickers from Nepse.

Args:
    ticker (Union[str, List[str]]): A single ticker symbol as a string or a list of ticker symbols.

Returns:
    Union[Dict[str, Any], Dict[str, Dict[str, Any]]]: 
        If a single ticker is provided, returns a dictionary with its information.
        If a list of tickers is provided, returns a dictionary with tickers as keys and their info as values.

Raises:
    ValueError: If the provided ticker is not found in NEPSE or if no ticker is provided.

---
## `get_ticker_price_history(ticker: str, start_date: str, end_date: str, page: int = 0, size: int = 500) -> List[Dict[str, Any]]`
Fetches the price history for a given ticker within a date range.

Args:
    ticker (str): The ticker symbol for the security.
    start_date (str): The start date in "YYYY-MM-DD" format.
    end_date (str): The end date in "YYYY-MM-DD" format.
    page (int): The page number for pagination.
    size (int): The number of records per page.

Returns:
    List[Dict[str, Any]]: A list of price history data for the ticker.

---
## `get_today_price(business_date: str | None = None) -> List[Dict[str, Any]]`
Get today's trading data from the Nepal Stock Exchange (NEPSE).

Args:
    business_date (str, optional): The date for which trading data should be retrieved in "YYYY-MM-DD" format. 
                                   Defaults to None, which retrieves data for the latest trading day.

Returns:
    List[Dict[str, Any]]: A list of dictionaries, each representing a security's price data for the day.

---
## `get_top_by_trade_quantity(show_all: bool = False) -> List[Dict[str, Any]]`
Retrieves the top securities ranked by trade quantity.

Args:
    show_all (bool): If True, fetches all data, not just the top ten. Defaults to False.

Returns:
    List[Dict[str, Any]]: A list of securities ranked by trade quantity.

---
## `get_top_stocks(category: str, show_all: bool = False) -> List[Dict[str, Any]]`
Fetches top stocks based on a category (e.g., gainers, losers, turnover).

Args:
    category (str): The category of top stocks to fetch. Valid options are:
                    'top_gainer', 'top_loser', 'top_turnover', 'top_trade', 'top_transaction'.
    show_all (bool): If True, fetches all stocks in the category, not just the top ten. Defaults to False.

Returns:
    List[Dict[str, Any]]: A list of dictionaries representing the top stocks.

Raises:
    ValueError: If an invalid category is provided.

---
## `get_trading_average(n_days: int = 120, business_date: str | None = None) -> List[Dict[str, Any]]`
Retrieve the trading average for a specified number of days.

Args:
    n_days (int): The number of days to include in the trading average calculation (must be between 1 and 180). 
                  Defaults to 120.
    business_date (str, optional): The end date for the calculation in "YYYY-MM-DD" format. 
                                   Defaults to the latest date.

Returns:
    List[Dict[str, Any]]: A list of dictionaries containing the trading average data.
    
Raises:
    ValueError: If n_days is not between 1 and 180.

---
## `is_market_open() -> bool`
Checks if the NEPSE market is currently open.

Returns:
    bool: True if the market is open, False otherwise.

---
## `register_endpoint(name: str, path: str, method: str = 'GET')`
Dynamically registers a new API endpoint.

This allows users to access new or custom NEPSE API endpoints that are
not yet officially supported by the library.

Args:
    name: A unique name for the endpoint (e.g., 'new_market_data').
    path: The API path (e.g., '/api/nots/new-data-point').
    method: The HTTP method, 'GET' or 'POST'. Defaults to 'GET'.

---