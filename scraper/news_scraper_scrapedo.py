"""NepseAlpha news scraper using the scrape.do anti-bot proxy API.

Setup:
    pip install requests beautifulsoup4
    export SCRAPE_DO_TOKEN="your-token-here"   # never hardcode the token

Run:
    python scraper/news_scraper_scrapedo.py
"""

import json
import os
import re
import sys
import time
from urllib.parse import urlencode

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://nepsealpha.com"
LIST_URL = f"{BASE_URL}/all-news?cid=1"
OUTPUT_FILE = "nepse_news_scrapedo.json"
API_TOKEN = "f2c682d8d34947ed8f029d65d2195cdd08325715904"


# Escalating anti-block profiles, pe scrape.do's "How to Solve Blocking Issues":
# 1. Headless browser with resources unblocked (some sites need CSS/images)
# 2. + super residential proxy with geo targeting (costs more credits)
# 3. + much longer wait and networkidle2 for slow/dynamic pages
PROFILES = [
    {"render": "true", "blockResources": "false", "customWait": "4000"},
    {"render": "true", "blockResources": "false", "customWait": "5000",
     "super": "true", "geoCode": "us"},
    {"render": "true", "blockResources": "false", "customWait": "10000",
     "super": "true", "geoCode": "us", "waitUntil": "networkidle2"},
]


def scrape_do_get(url, wait_selector=None, timeout=150):
    """Fetch a URL through scrape.do, escalating anti-block settings on failure."""
    for level, profile in enumerate(PROFILES, 1):
        params = {"token": API_TOKEN, "url": url, **profile}
        if wait_selector:
            # Wait up to 10s for the element that proves content actually loaded
            params["waitSelector"] = wait_selector
        api_url = f"https://api.scrape.do/?{urlencode(params)}"
        try:
            resp = requests.get(api_url, timeout=timeout)
            if resp.status_code == 200 and resp.text.strip():
                return resp.text
            print(f"  [profile {level}/{len(PROFILES)}] HTTP {resp.status_code}"
                  f" - escalating anti-block settings...")
        except requests.RequestException as exc:
            print(f"  [profile {level}/{len(PROFILES)}] {exc}")
        time.sleep(3)
    return None


def parse_listing(html):
    """Extract article title/link/date pairs from the news listing page."""
    soup = BeautifulSoup(html, "html.parser")
    articles, seen_titles = [], set()

    for element in soup.find_all(["li", "div"], class_=re.compile(r"\bpost")):
        # Skip sidebar/related widgets by checking ancestor classes correctly
        ancestor_classes = " ".join(
            cls for parent in element.find_parents(["div", "aside", "section"])
            for cls in (parent.get("class") or [])
        )
        if "sidebar" in ancestor_classes or "right" in ancestor_classes:
            continue

        heading = element.find(["h1", "h2", "h3", "h4", "a"])
        title = heading.get_text(strip=True) if heading else ""
        if len(title) < 7 or title in seen_titles:
            continue

        link = ""
        post_id = re.findall(r"\d+", element.get("id", ""))
        if post_id:
            link = f"{BASE_URL}/post/detail/{post_id[0]}"
        else:
            anchor = element.find("a", href=True)
            if anchor:
                href = anchor["href"]
                link = href if href.startswith("http") else f"{BASE_URL}/{href.lstrip('/')}"

        date_text = next(
            (s.strip("- ").strip() for s in element.stripped_strings
             if re.search(r"\b20\d\d\b|ago", s)),
            "",
        )

        seen_titles.add(title)
        articles.append({"title": title, "link": link, "date": date_text or "Latest"})

    return articles


def parse_article(html):
    """Extract the article body text from a detail page."""
    soup = BeautifulSoup(html, "html.parser")
    container = (
        soup.find("div", id="postDescriptions")
        or soup.find("div", class_=re.compile("post_content"))
        or soup.find("article")
    )
    if not container:
        return ""
    paragraphs = [p.get_text(strip=True) for p in container.find_all("p")]
    text = "\n".join(p for p in paragraphs if p)
    return text or "\n".join(container.stripped_strings)


def main():
    if not API_TOKEN:
        sys.exit("Set the SCRAPE_DO_TOKEN environment variable first.")

    print(f"Fetching listing: {LIST_URL}")
    listing_html = scrape_do_get(LIST_URL, wait_selector=".post")
    if not listing_html:
        sys.exit("Could not fetch the news listing page.")

    articles = parse_listing(listing_html)
    if not articles:
        sys.exit("No articles found - the page layout may have changed.")
    print(f"Found {len(articles)} articles. Fetching full content...\n")

    for i, article in enumerate(articles, 1):
        print(f"[{i}/{len(articles)}] {article['title']}")
        if "detail" in article["link"]:
            detail_html = scrape_do_get(article["link"], wait_selector="#postDescriptions")
            article["content"] = parse_article(detail_html) if detail_html else ""
        else:
            article["content"] = ""
        time.sleep(1)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(articles, f, indent=4, ensure_ascii=False)
    print(f"\nSaved {len(articles)} articles to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
