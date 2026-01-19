import requests
from bs4 import BeautifulSoup
import os
import hashlib
import time
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
    # Search for headers like "Ubicación de este libro"
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

def scrape_details():
    print("👷 Starting Bibliometro WORKER Scraper (Detail Extraction)...")
    
    if not API_SECRET:
        print("❌ API_SECRET not found in .env")
        return

    if not os.path.exists(URLS_FILE):
        print(f"❌ URL list not found: {URLS_FILE}")
        print("   -> Run 'bibliometro_urls.py' first!")
        return

    with open(URLS_FILE, 'r', encoding='utf-8') as f:
        urls = [line.strip() for line in f if line.strip()]

    print(f"📄 Loaded {len(urls)} URLs to process.")
    
    headers = {'User-Agent': 'Mozilla/5.0'}
    batch = []
    BATCH_SIZE = 20
    
    for i, url in enumerate(urls):
        try:
            time.sleep(0.5) # Courtesy delay
            print(f"   [{i+1}/{len(urls)}] Processing: {url}")
            
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code != 200:
                print(f"      ⚠️ Failed to load page ({response.status_code})")
                continue
                
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract basic info
            title_tag = soup.find('h1', class_='entry-title') 
            # Fallback if class missing
            if not title_tag: title_tag = soup.find('h1')

            if not title_tag:
                print("      ⚠️ No title found, skipping.")
                continue

            title = title_tag.get_text(strip=True)
            
            # Extract Image
            image_url = None
            img_tag = soup.find('div', class_='book-cover') # Example class
            if not img_tag: img_tag = soup.find('img', class_='attachment-post-thumbnail')
            
            if img_tag:
                if img_tag.name == 'div':
                     real_img = img_tag.find('img')
                     if real_img: image_url = real_img.get('src')
                else:
                     image_url = img_tag.get('src')

            locations = get_availability(soup)
            
            book_data = {
                "id": f"bib_{generate_id('bibliometro', title)}",
                "title": title[:255],
                "author": "Desconocido", # Bibliometro structure is hard for author, keep default
                "source": "bibliometro",
                "url": url,
                "tags": ["bibliometro"],
                "imageUrl": image_url,
                "locations": locations
            }
            
            batch.append(book_data)
            
            # Upload batch
            if len(batch) >= BATCH_SIZE:
                upload_batch(batch)
                batch = []
                
        except Exception as e:
            print(f"      ❌ Error processing {url}: {e}")

    # Final batch
    if batch:
        upload_batch(batch)

def upload_batch(books):
    try:
        api_headers = {
            "Content-Type": "application/json",
            "x-api-secret": API_SECRET
        }
        resp = requests.post(API_URL, json=books, headers=api_headers)
        if resp.status_code == 200:
            print(f"   ✅ Uploaded batch of {len(books)} books.")
        else:
            print(f"   ❌ API Upload failed ({resp.status_code}): {resp.text}")
    except Exception as e:
        print(f"   ❌ API Connection failed: {e}")

if __name__ == "__main__":
    scrape_details()
