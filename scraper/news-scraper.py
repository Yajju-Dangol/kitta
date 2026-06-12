import requests
from urllib.parse import urlencode
from bs4 import BeautifulSoup
import json
import time
import re

def get_article_content_with_retry(api_token, url, retries=3):
    """
    Fetches the actual text body from the inner article cleanly and quickly.
    """
    print(f" -> Fetching inner content for: {url}")
    
    # Keeping blockResources default to keep it lightweight and rapid
    params = {
        "token": api_token,
        "url": url,
        "render": "true",
        "customWait": "1500" 
    }
    
    scrape_do_url = f"https://api.scrape.do/?{urlencode(params)}"
    
    for attempt in range(1, retries + 1):
        try:
            response = requests.get(scrape_do_url, timeout=60)
            if response.status_code == 200:
                sub_soup = BeautifulSoup(response.text, 'html.parser')
                
                content_container = sub_soup.find('div', id='postDescriptions') or \
                                    sub_soup.find('div', class_=lambda x: x and 'post_content' in x) or \
                                    sub_soup.find('article')
                
                if content_container:
                    paragraphs = content_container.find_all('p')
                    if paragraphs:
                        full_text = "\n".join([p.text.strip() for p in paragraphs if p.text.strip()])
                        if full_text.strip():
                            return full_text
                    
                    fallback_text = "\n".join(list(content_container.stripped_strings)[2:])
                    if fallback_text.strip():
                        return fallback_text
                        
            print(f"    [Attempt {attempt}/{retries}] Status code: {response.status_code}. Retrying...")
        except Exception:
            print(f"    [Attempt {attempt}/{retries}] Network delay occurred.")
            
        if attempt < retries:
            time.sleep(2)

    return "Content paragraph elements could not be resolved from DOM structure."

def scrape_latest_page_one():
    API_TOKEN = "f2c682d8d34947ed8f029d65d2195cdd08325715904"
    TARGET_URL = "https://nepsealpha.com/all-news?cid=1"
    
    print(f"Initiating clean front-page sequence for: {TARGET_URL}")
    
    params = {
        "token": API_TOKEN,
        "url": TARGET_URL,
        "render": "true",
        "customWait": "4000",
        "blockResources": "false"
    }
    
    scrape_do_url = f"https://api.scrape.do/?{urlencode(params)}"
    
    try:
        response = requests.get(scrape_do_url, timeout=90)
        if response.status_code != 200:
            print(f"Failed to access main list. Code: {response.status_code}")
            return
            
        soup = BeautifulSoup(response.text, 'html.parser')
        initial_list = []
        
        # FIX: Find the main news feed container column and explicitly ignore the sidebar columns
        main_column = soup.find('div', class_=lambda x: x and ('col-md-8' in x or 'left' in x or 'main' in x))
        
        # If the container wrapper element shifts, fallback to the full soup body
        search_scope = main_column if main_column else soup
        
        # Harvest news elements ONLY within the primary content body
        post_elements = search_scope.find_all(['li', 'div'], class_=lambda x: x and 'post' in x)
        
        for element in post_elements:
            # Skip any element that accidentally leaked in from a sidebar wrapper
            parent_classes = "".join(element.find_parents().get('class', []))
            if 'sidebar' in parent_classes or 'right' in parent_classes:
                continue
                
            title = ""
            link = ""
            date_text = ""
            
            heading_tag = element.find(['h1', 'h2', 'h3', 'h4', 'a'])
            if heading_tag:
                title = heading_tag.text.strip()
            
            element_id = element.get('id', '')
            if element_id and '-' in element_id:
                raw_num = re.findall(r'\d+', element_id)
                if raw_num:
                    link = f"https://nepsealpha.com/post/detail/{raw_num[0]}"
            else:
                link_tag = element.find('a', href=True)
                if link_tag:
                    href = link_tag['href']
                    if href.startswith('http'):
                        link = href
                    else:
                        link = f"https://nepsealpha.com{href if href.startswith('/') else '/' + href}"
            
            for string in element.stripped_strings:
                if "202" in string or "," in string or "ago" in string:
                    date_text = string.strip("- ").strip()
                    break
            
            # Clean validation block
            if title and len(title) > 6 and not any(d['Title'] == title for d in initial_list):
                initial_list.append({
                    "Title": title,
                    "Link": link if link else "https://nepsealpha.com/all-news?cid=1",
                    "Date": date_text if date_text else "Latest"
                })
        
        if not initial_list:
            print("❌ No news articles found in the main front-page container layout.")
            return

        print(f"Isolated {len(initial_list)} fresh front-page articles. Starting inner details harvest...\n")
        
        final_enriched_data = []
        for index, item in enumerate(initial_list, 1):
            print(f"[{index}/{len(initial_list)}] Processing: {item['Title']}")
            
            if item["Link"] and "detail" in item["Link"]:
                inner_content = get_article_content_with_retry(API_TOKEN, item["Link"])
                item["Content"] = inner_content
            else:
                item["Content"] = "No unique detail route available."
                
            final_enriched_data.append(item)
            time.sleep(1) # Clear spacing delay
            
        print("\n=== Extraction Phase Finalized ===")
        print(json.dumps(final_enriched_data, indent=4, ensure_ascii=False))
        
        output_filename = 'nepse_news_page1_fresh.json'
        with open(output_filename, 'w', encoding='utf-8') as f:
            json.dump(final_enriched_data, f, indent=4, ensure_ascii=False)
            
        print(f"\n✅ Fresh first-page articles completely mapped to '{output_filename}'!")
            
    except requests.exceptions.RequestException as e:
        print(f"Error executing scraper execution layout: {e}")

if __name__ == "__main__":
    scrape_latest_page_one()