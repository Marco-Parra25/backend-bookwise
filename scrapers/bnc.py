import requests
from bs4 import BeautifulSoup
import os
import hashlib
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

API_URL = "http://localhost:3001/api/books/batch"
API_SECRET = os.getenv('API_SECRET')
BNC_PORTAL_URL = "https://www.bibliotecanacional.gob.cl"

def generate_id(source, title):
    raw_id = f"{source}-{title}".lower().replace(' ', '-')
    return hashlib.md5(raw_id.encode()).hexdigest()[:12]

def scrape_bnc():
    print("🕷️  Starting BNC Scraper (API Mode)...")
    
    if not API_SECRET:
        print("❌ API_SECRET not found in .env")
        return

    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(BNC_PORTAL_URL, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        items_found = []
        links = soup.find_all('a', href=True)
        
        for link in links:
            href = link['href']
            title = link.get_text(strip=True)
            
            if not title or len(title) < 5: continue
                
            if '/noticias/' in href or '/cartelera/' in href or '/colecciones-digitales/' in href:
                full_url = href if href.startswith('http') else f"{BNC_PORTAL_URL}{href}"
                
                tag = "noticia"
                if "cartelera" in href: tag = "cultura"
                
                # Check image
                img = link.find('img')
                image_url = None
                if img and img.get('src'):
                     src = img['src']
                     image_url = src if src.startswith('http') else f"{BNC_PORTAL_URL}{src}"

                items_found.append({
                    "id": f"bnc_{generate_id('bnc', title)}",
                    "title": title[:255],
                    "author": "Biblioteca Nacional",
                    "source": "biblioteca_nacional",
                    "url": full_url,
                    "tags": ["bnc", tag, "chile"],
                    "imageUrl": image_url,
                    "locations": [] # No physical locations for news
                })

        # Unique
        unique_items = {v['id']: v for v in items_found}.values()
        books_list = list(unique_items)
        
        print(f"📦 Sending {len(books_list)} items to Backend API...")
        
        api_headers = {
            "Content-Type": "application/json",
            "x-api-secret": API_SECRET
        }
        
        api_response = requests.post(API_URL, json=books_list, headers=api_headers)
        
        if api_response.status_code == 200:
            print(f"✅ API Success: {api_response.json().get('message')}")
        else:
            print(f"❌ API Error {api_response.status_code}: {api_response.text}")
        
    except Exception as e:
        print(f"❌ Error in BNC scraper: {e}")

if __name__ == "__main__":
    scrape_bnc()
