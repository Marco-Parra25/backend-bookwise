import requests
from bs4 import BeautifulSoup
import psycopg2
import os
import hashlib
import time
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

DATABASE_URL = os.getenv('DATABASE_URL')
BIBLIOMETRO_URL = "https://www.bibliometro.cl"

def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

def generate_id(source, title):
    raw_id = f"{source}-{title}".lower().replace(' ', '-')
    return hashlib.md5(raw_id.encode()).hexdigest()[:12]

def get_availability(book_url):
    """
    Visits the book detail page to scrape availability/locations.
    Returns a list of dicts: [{'branch': 'Baquedano', 'stock': 1}, ...]
    """
    time.sleep(0.5) # Be nice to the server
    try:
        headers = {'User-Agent': 'Bookwise-Student-Project/1.0'}
        response = requests.get(book_url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            return []
            
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Look for "Ubicación de este libro" or related headers
        # Based on user analysis, it's often a list <ul> following a header
        # or inside text. The markdown showed: "#### Ubicación de este libro\n- Baquedano 1..."
        
        # Heuristic: Find text "Ubicación de este libro" and look at next sibling list
        locations = []
        
        # Searching for the specific text
        header = soup.find(lambda tag: tag.name in ['h4', 'h5', 'h3'] and "ubicación" in tag.get_text(strip=True).lower())
        
        if header:
            # The list usually follows the header
            ul = header.find_next('ul')
            if ul:
                lis = ul.find_all('li')
                for li in lis:
                    text_content = li.get_text(strip=True)
                    # Expected format "Baquedano 1" or "Bellavista 0"
                    # We want to extract Name and Number
                    
                    import re
                    # Normalize text to handle non-breaking spaces
                    text_content = text_content.replace('\xa0', ' ').strip()
                    
                    # Robust regex: Allow optional space before number
                    match = re.search(r'^(.*?)\s*(\d+)$', text_content)
                    
                    if match:
                        branch_name = match.group(1).strip()
                        stock = int(match.group(2))
                        
                        if stock > 0:
                            locations.append({
                                "branch": branch_name,
                                "stock": stock
                            })
                    else:
                        print(f"      ⚠️ Failed to parse location: '{text_content}'")
                            
        return locations
        
    except Exception as e:
        print(f"⚠️  Error fetching details for {book_url}: {e}")
        return []

def scrape_bibliometro():
    print("🕷️  Starting Bibliometro Scraper (Deep Scrape)...")
    
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        response = requests.get(BIBLIOMETRO_URL, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        book_links = soup.find_all('a', href=True)
        
        books_to_save = []
        
        # Limit deep scraping to first 20 items to simulate "New Arrivals" efficiently
        count = 0 
        MAX_ITEMS = 20 
        
        seen_titles = set()

        
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
                
                # Fetch availability
                print(f"   ↳ Checking availability for: {title[:30]}...")
                locations = get_availability(full_url)
                if locations:
                    print(f"      📍 FOUND: {locations}")
                else:
                    print(f"      ⚠️ NO LOCATIONS FOUND for {full_url}")
                
                author = "Desconocido" # Improve if possible from detail page logic later
                
                img = link.find('img')
                image_url = None
                if img and img.get('src'):
                     src = img['src']
                     image_url = src if src.startswith('http') else f"{BIBLIOMETRO_URL}{src}"

                book_data = {
                    "id": f"bib_{generate_id('bibliometro', title)}",
                    "title": title[:255],
                    "author": author,
                    "source": "bibliometro",
                    "url": full_url,
                    "tags": ["novedades", "bibliometro"],
                    "imageUrl": image_url,
                    "locations": locations # Valid JSON array
                }
                
                books_to_save.append(book_data)
                count += 1

        print(f"🔎 Found {len(books_to_save)} items. Inserting into DB...")

        conn = get_db_connection()
        cur = conn.cursor()
        
        inserted_count = 0
        for book in books_to_save:
            try:
                # Convert locations list to JSON string for Postgres if needed, 
                # but psycopg2 usually handles lists -> array/json with Json adapter.
                # Here we pass it directly, assuming jsonb mapping works or casting.
                
                from psycopg2.extras import Json
                
                cur.execute("""
                    INSERT INTO books (id, title, author, source, url, tags, "imageUrl", "locations", "createdAt", "updatedAt")
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    ON CONFLICT (id) DO UPDATE SET
                        title = EXCLUDED.title,
                        url = EXCLUDED.url,
                        "imageUrl" = EXCLUDED."imageUrl",
                        "locations" = EXCLUDED."locations",
                        "updatedAt" = NOW();
                """, (
                    book['id'], book['title'], book['author'], book['source'], book['url'], 
                    book['tags'], book['imageUrl'], Json(book['locations'])
                ))
                inserted_count += 1
            except Exception as e:
                print(f"⚠️  Error saving book {book['title']}: {e}")
                conn.rollback()

        conn.commit()
        cur.close()
        conn.close()
        print(f"✅ Successfully processed {inserted_count} books with locations.")
        
    except Exception as e:
        print(f"❌ Error in Bibliometro scraper: {e}")

if __name__ == "__main__":
    scrape_bibliometro()
