"""NepseAlpha news scraper WITHOUT any paid API.

Beats common anti-bot checks (Cloudflare) by impersonating a real Chrome
browser at the TLS-fingerprint level via curl_cffi, with cloudscraper as a
fallback. Also uses realistic headers, session/cookie reuse, randomized
delays, and exponential backoff on 403/429/503 responses.

Setup (pick at least one engine):
    pip install beautifulsoup4 curl_cffi      # recommended
    pip install beautifulsoup4 cloudscraper   # fallback

Run:
    python scraper/news_scraper_direct.py
"""

import json
import random
import re
import sys
import time

from bs4 import BeautifulSoup

BASE_URL = "https://nepsealpha.com"
LIST_URL = f"{BASE_URL}/all-news?cid=1"
OUTPUT_FILE = "nepse_news_direct.json"

HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,"
              "image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": f"{BASE_URL}/",
    "Upgrade-Insecure-Requests": "1",
}


def build_session():
    """Prefer curl_cffi (real Chrome TLS fingerprint), else cloudscraper."""
    try:
        from curl_cffi import requests as curl_requests
        print("Engine: curl_cffi (Chrome TLS impersonation)")
        return curl_requests.Session(impersonate="chrome")
    except ImportError:
        pass
    try:
        import cloudscraper
        print("Engine: cloudscraper")
        return cloudscraper.create_scraper(
            browser={"browser": "chrome", "platform": "windows", "mobile": False}
        )
    except ImportError:
        sys.exit("Install an engine first: pip install curl_cffi  (or cloudscraper)")


def fetch(session, url, retries=4, timeout=30):
    """GET with anti-bot-aware retries and exponential backoff + jitter."""
    for attempt in range(1, retries + 1):
        try:
            resp = session.get(url, headers=HEADERS, timeout=timeout)
            if resp.status_code == 200:
                return resp.text
            if resp.status_code in (403, 429, 503):
                wait = 2 ** attempt + random.uniform(0, 2)
                print(f"  [attempt {attempt}/{retries}] HTTP {resp.status_code} "
                      f"(anti-bot) - backing off {wait:.1f}s")
                time.sleep(wait)
                continue
            print(f"  [attempt {attempt}/{retries}] HTTP {resp.status_code}")
        except Exception as exc:
            print(f"  [attempt {attempt}/{retries}] {exc}")
        time.sleep(2)
    return None


def parse_listing(html):
    """Extract article title/link/date pairs from the news listing page."""
    soup = BeautifulSoup(html, "html.parser")
    articles, seen_titles = [], set()

    for element in soup.find_all(["li", "div"], class_=re.compile(r"\bpost")):
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
    session = build_session()

    # Warm up the session: hit the homepage first so cookies (incl. any
    # Cloudflare clearance) are set before the real request - looks human.
    print("Warming up session...")
    fetch(session, BASE_URL)
    time.sleep(random.uniform(1.0, 2.0))

    print(f"Fetching listing: {LIST_URL}")
    listing_html = fetch(session, LIST_URL)
    if not listing_html:
        sys.exit("Could not fetch the news listing page (still blocked?). "
                 "Try the scrape.do version or run from a residential IP.")

    articles = parse_listing(listing_html)
    if not articles:
        sys.exit("No articles found - the page layout may have changed.")
    print(f"Found {len(articles)} articles. Fetching full content...\n")

    for i, article in enumerate(articles, 1):
        print(f"[{i}/{len(articles)}] {article['title']}")
        if "detail" in article["link"]:
            detail_html = fetch(session, article["link"])
            article["content"] = parse_article(detail_html) if detail_html else ""
        else:
            article["content"] = ""
        # Randomized, human-like delay between requests
        time.sleep(random.uniform(1.5, 3.5))

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(articles, f, indent=4, ensure_ascii=False)
    print(f"\nSaved {len(articles)} articles to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
