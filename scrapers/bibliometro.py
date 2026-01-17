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
BIBLIOMETRO_URL = "https://www.bibliometro.cl"

def generate_id(source, title):
    raw_id = f"{source}-{title}".lower().replace(' ', '-')
    return hashlib.md5(raw_id.encode()).hexdigest()[:12]

def get_availability(book_url):
    time.sleep(0.5) 
    try:
        headers = {'User-Agent': 'Bookwise-Student-Project/1.0'}
        response = requests.get(book_url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            return []
            
        soup = BeautifulSoup(response.text, 'html.parser')
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
        
    except Exception as e:
        print(f"⚠️  Error fetching details for {book_url}: {e}")
        return []

def scrape_bibliometro():
    print("🕷️  Starting Bibliometro Scraper (API Mode)...")
    
    if not API_SECRET:
        print("❌ API_SECRET not found in .env")
        return

    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(BIBLIOMETRO_URL, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        book_links = soup.find_all('a', href=True)
        
        books_to_send = []
        count = 0 
        MAX_ITEMS = 20
        seen_titles = set()

        for link in book_links:
            if count >= MAX_ITEMS: break

            href = link['href']
            if '/libros/' in href:
                title = link.get_text(strip=True)
                
                if not title or len(title) < 3 or "ver más" in title.lower(): continue
                if title in seen_titles: continue
                seen_titles.add(title)
                
                full_url = href if href.startswith('http') else f"{BIBLIOMETRO_URL}{href}"
                
                print(f"   ↳ Processing: {title[:30]}...")
                locations = get_availability(full_url)
                
                img = link.find('img')
                image_url = None
                if img and img.get('src'):
                     src = img['src']
                     image_url = src if src.startswith('http') else f"{BIBLIOMETRO_URL}{src}"

                books_to_send.append({
                    "id": f"bib_{generate_id('bibliometro', title)}",
                    "title": title[:255],
                    "author": "Desconocido",
                    "source": "bibliometro",
                    "url": full_url,
                    "tags": ["novedades", "bibliometro"],
                    "imageUrl": image_url,
                    "locations": locations
                })
                count += 1

        print(f"� Sending {len(books_to_send)} items to Backend API...")

        # Send to API
        api_headers = {
            "Content-Type": "application/json",
            "x-api-secret": API_SECRET
        }
        
        api_response = requests.post(API_URL, json=books_to_send, headers=api_headers)
        
        if api_response.status_code == 200:
            print(f"✅ API Success: {api_response.json().get('message')}")
        else:
            print(f"❌ API Error {api_response.status_code}: {api_response.text}")
        
    except Exception as e:
        print(f"❌ Error in Bibliometro scraper: {e}")

if __name__ == "__main__":
    scrape_bibliometro()
