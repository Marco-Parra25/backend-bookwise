import requests
from bs4 import BeautifulSoup
import psycopg2
import os
import hashlib
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

DATABASE_URL = os.getenv('DATABASE_URL')
BNC_PORTAL_URL = "https://www.bibliotecanacional.gob.cl"

def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

def generate_id(source, title):
    raw_id = f"{source}-{title}".lower().replace(' ', '-')
    return hashlib.md5(raw_id.encode()).hexdigest()[:12]

def scrape_bnc():
    print("🕷️  Starting Biblioteca Nacional Scraper (Real Portal)...")
    
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(BNC_PORTAL_URL, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Scrape "Noticias" or relevant sections which often contain book launches or cultural items
        # Targeting generic article links
        # Looking for 'article' tags or links inside main content
        
        items_found = []
        
        # Strategy: Find links that look like content /noticias/ or /cartelera/
        links = soup.find_all('a', href=True)
        
        for link in links:
            href = link['href']
            title = link.get_text(strip=True)
            
            if not title or len(title) < 5:
                continue
                
            # Filter for content-like URLs
            if '/noticias/' in href or '/cartelera/' in href or '/colecciones-digitales/' in href:
                full_url = href if href.startswith('http') else f"{BNC_PORTAL_URL}{href}"
                
                # Basic categorization
                tag = "noticia"
                if "cartelera" in href: tag = "cultura"
                if "colecciones" in href: tag = "coleccion"
                
                item_data = {
                    "id": f"bnc_{generate_id('bnc', title)}",
                    "title": title[:255],
                    "author": "Biblioteca Nacional", # Default
                    "source": "biblioteca_nacional",
                    "url": full_url,
                    "tags": ["bnc", tag, "chile"],
                    "imageUrl": None
                }
                
                # Try to find an image nearby
                # (Simple heuristic: look for img child)
                img = link.find('img')
                if img and img.get('src'):
                     src = img['src']
                     item_data['imageUrl'] = src if src.startswith('http') else f"{BNC_PORTAL_URL}{src}"
                     
                items_found.append(item_data)

        unique_items = {v['id']: v for v in items_found}.values()
        print(f"🔎 Found {len(unique_items)} unique items from BNC Portal.")
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        inserted_count = 0
        for item in unique_items:
            try:
                cur.execute("""
                    INSERT INTO books (id, title, author, source, url, tags, "imageUrl", "createdAt", "updatedAt")
                    VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    ON CONFLICT (id) DO UPDATE SET
                        title = EXCLUDED.title,
                        url = EXCLUDED.url,
                        "imageUrl" = EXCLUDED."imageUrl",
                        "updatedAt" = NOW();
                """, (item['id'], item['title'], item['author'], item['source'], item['url'], item['tags'], item['imageUrl']))
                inserted_count += 1
            except Exception as e:
                # print(f"⚠️  Skip: {e}") # Quiet error
                conn.rollback()

        conn.commit()
        cur.close()
        conn.close()
        print(f"✅ Successfully processed {inserted_count} items from Biblioteca Nacional.")
        
    except Exception as e:
        print(f"❌ Error in BNC scraper: {e}")

if __name__ == "__main__":
    scrape_bnc()
