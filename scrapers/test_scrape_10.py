import requests
from bs4 import BeautifulSoup
import os
import hashlib
import time
import random
import re
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Configuration
API_URL = "http://localhost:3001/api/books/batch"
API_SECRET = os.getenv('API_SECRET')
URLS_FILE = os.path.join(os.path.dirname(__file__), "bibliometro_final_urls.txt")

def generate_id(source, title):
    raw_id = f"{source}-{title}".lower().replace(' ', '-')
    return hashlib.md5(raw_id.encode()).hexdigest()[:12]

def get_availability(soup):
    locations = []
    header = soup.find(lambda tag: tag.name in ['h4', 'h5', 'h3'] and "ubicación" in tag.get_text(strip=True).lower())
    if header:
        ul = header.find_next('ul')
        if ul:
            lis = ul.find_all('li')
            for li in lis:
                text_content = li.get_text(strip=True)
                text_content = text_content.replace('\xa0', ' ').strip()
                match = re.search(r'^(.*?)\s*(\d+)$', text_content)
                if match:
                    branch_name = match.group(1).strip()
                    stock = int(match.group(2))
                    if stock > 0:
                        locations.append({"branch": branch_name, "stock": stock})
    return locations

def get_category(soup):
    category = None
    li = soup.find('li', class_='d-none d-sm-block', string=re.compile("Tema - Materia:"))
    if not li:
        # Try finding by looking for the strong tag inside
        strong = soup.find('strong', string=re.compile("Tema - Materia:"))
        if strong:
            li = strong.parent
    
    if li:
        text = li.get_text(strip=True)
        if "Tema - Materia:" in text:
            category = text.replace("Tema - Materia:", "").strip()
    return category

def get_description(soup):
    description = None
    h3 = soup.find('h3', class_='tit-h3', string=re.compile("Resumen de libro"))
    if h3:
        p = h3.find_next_sibling('p')
        if p:
            description = p.get_text(strip=True)
    return description

def scrape_test_10():
    print("👷 Starting Bibliometro TEST Scraper (10 Books)...")
    
    if not API_SECRET:
        print("❌ API_SECRET not found in .env")
        return

    if not os.path.exists(URLS_FILE):
        print(f"❌ URL list not found: {URLS_FILE}")
        return

    with open(URLS_FILE, 'r', encoding='utf-8') as f:
        urls = [line.strip() for line in f if line.strip()]

    # Limit to 10 for testing
    urls = urls[:10]
    print(f"📄 Loaded {len(urls)} URLs for testing.")
    
    session = requests.Session()
    headers = {'User-Agent': 'Mozilla/5.0'}
    batch = []
    
    for i, url in enumerate(urls):
        try:
            time.sleep(random.uniform(0.5, 1.0))
            print(f"   [{i+1}/{len(urls)}] Processing: {url}")
            
            response = session.get(url, headers=headers, timeout=30)
            if response.status_code != 200:
                print(f"      ⚠️ Failed to load page ({response.status_code})")
                continue
                
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract basic info
            title_tag = soup.find('h1', class_='entry-title') or soup.find('h1')
            if not title_tag:
                print("      ⚠️ No title found, skipping.")
                continue
            title = title_tag.get_text(strip=True)
            
            # Extract Image
            image_url = None
            img_tag = soup.find('img', class_='attachment-post-thumbnail')
            if img_tag:
                image_url = img_tag.get('src')

            locations = get_availability(soup)
            category = get_category(soup)
            description = get_description(soup)
            
            # Extract Author
            author = "Desconocido"
            h4s = soup.find_all('h4')
            for h4 in h4s:
                txt = h4.get_text(strip=True)
                if "ubicación" in txt.lower() or "comentarios" in txt.lower():
                    continue
                if txt:
                    author = txt
                    break
            
            # Extract Pages
            pages = None
            strongs = soup.find_all('strong')
            for s in strongs:
                if "páginas" in s.get_text(strip=True).lower():
                    sib = s.next_sibling
                    if sib and isinstance(sib, str):
                        match = re.search(r'(\d+)', sib)
                        if match: pages = int(match.group(1))

            book_data = {
                "id": f"bib_{generate_id('bibliometro', title)}",
                "title": title[:255],
                "author": author[:255], 
                "pages": pages,
                "difficulty": 3,
                "source": "bibliometro",
                "url": url,
                "tags": ["bibliometro"],
                "imageUrl": image_url,
                "locations": locations,
                "category": category,
                "description": description,
                "summary": description # Mapping both for safety
            }
            
            batch.append(book_data)
            print(f"      ✅ Extracted category: {category}")
                
        except Exception as e:
            print(f"      ❌ Error processing {url}: {e}")

    if batch:
        upload_batch(batch)

def upload_batch(books):
    api_headers = {
        "Content-Type": "application/json",
        "x-api-secret": API_SECRET
    }
    try:
        resp = requests.post(API_URL, json=books, headers=api_headers, timeout=30)
        if resp.status_code == 200:
            print(f"   🚀 Successfully uploaded {len(books)} books with new details.")
        else:
            print(f"   ❌ API Upload failed ({resp.status_code}): {resp.text}")
    except Exception as e:
        print(f"   ❌ API Connection failed: {e}")

if __name__ == "__main__":
    scrape_test_10()
