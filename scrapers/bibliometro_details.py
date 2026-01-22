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
    
    from requests.adapters import HTTPAdapter
    from urllib3.util.retry import Retry

    session = requests.Session()
    retry = Retry(connect=3, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    
    headers = {'User-Agent': 'Mozilla/5.0'}
    batch = []
    BATCH_SIZE = 10
    
    for i, url in enumerate(urls):
        try:
            # Random delay to be polite and avoid blocks
            time.sleep(random.uniform(0.1, 0.5))
            
            print(f"   [{i+1}/{len(urls)}] Processing: {url}")
            
            # Scrape Process
            try:
                response = session.get(url, headers=headers, timeout=30)
            except Exception as e:
                print(f"      ⚠️ Failed to load page ({e})")
                continue
                
            if response.status_code != 200:
                print(f"      ⚠️ Failed to load page ({response.status_code})")
                continue
                
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract basic info
            title_tag = soup.find('h1', class_='entry-title') 
            # Fallback if class missing
            if not title_tag: title_tag = soup.find('h1')
            # Fallback for new layout (h3.tit-h3)
            # "Resumen de libro" is often an h3.tit-h3, so we must filter it out
            candidates = soup.find_all(['h1', 'h3'])
            for cand in candidates:
                text = cand.get_text(strip=True)
                if not text: continue
                lower_text = text.lower()
                
                # Filter out known non-title headers
                forbidden = ["resumen de libro", "deja una respuesta", "navegación de entradas", "buscar"]
                if any(bad in lower_text for bad in forbidden):
                    continue
                
                # If we found a candidate, use it.
                # Heuristic: Titles usually appear early, but h1 is preferred. 
                # If we explicitly found an h1 earlier, we wouldn't be here.
                # We overwrite title_tag if it's currently None.
                if not title_tag:
                    title_tag = cand
                elif cand.name == 'h1': 
                    # If we found an h1 now and had an h3 before, upgrade to h1
                    title_tag = cand
                    break # h1 is definitive
            
            if not title_tag:
                 # Last resort: try title tag from head, stripped of site name
                 if soup.title:
                     raw_title = soup.title.get_text(strip=True)
                     # usually "Name of Book - Bibliometro"
                     if " - Bibliometro" in raw_title:
                         title_text = raw_title.replace(" - Bibliometro", "").strip()
                         # We don't have a tag, so we mock one
                         class MockTag:
                            def get_text(self, strip=True): return title_text
                         title_tag = MockTag()

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
            
            # Extract Author and Pages
            author = "Desconocido"
            pages = None
            
            # Extract Author and Pages
            author = "Desconocido"
            pages = None
            
            # --- AUTHOR STRATEGY: Look for <h4> tags ---
            # Debug analysis showed: <li><h4>George Orwell</h4></li>
            # There is also <h4>Ubicación de este libro</h4> which we must ignore.
            h4s = soup.find_all('h4')
            for h4 in h4s:
                txt = h4.get_text(strip=True)
                # Filter out known UI headers
                if "ubicación" in txt.lower() or "comentarios" in txt.lower():
                    continue
                # If it's a valid looking name (not empty), take it.
                if txt:
                    author = txt
                    break # First valid h4 is usually the author

            # Fallback: if still unknown, try the old "Autor:" search just in case
            if author == "Desconocido":
                candidates = soup.find_all(['strong', 'b', 'span'])
                for tag in candidates:
                    if "autor" in tag.get_text(strip=True).lower():
                        if ":" in tag.get_text():
                             parts = tag.get_text().split(":", 1)
                             if len(parts) > 1 and parts[1].strip():
                                 author = parts[1].strip()
                        elif tag.next_sibling and isinstance(tag.next_sibling, str):
                             author = tag.next_sibling.strip()
            
            # --- PAGES STRATEGY ---
            # <li><strong>Páginas:</strong> 353 páginas ;18 cm.-</li>
            strongs = soup.find_all('strong')
            for s in strongs:
                if "páginas" in s.get_text(strip=True).lower():
                    # Check next sibling text node
                    sib = s.next_sibling
                    if sib and isinstance(sib, str):
                        # Regex to find the first number
                        import re
                        match = re.search(r'(\d+)', sib)
                        if match:
                            try:
                                pages = int(match.group(1))
                            except: pass

            book_data = {
                "id": f"bib_{generate_id('bibliometro', title)}",
                "title": title[:255],
                "author": author[:255], 
                "pages": pages,
                "difficulty": 3, # Default
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
        # Deduplicate books by ID within the batch
        unique_books = {}
        for book in books:
            bid = book['id']
            if bid not in unique_books:
                unique_books[bid] = book
            else:
                # Merge locations if duplicate found
                existing = unique_books[bid]
                existing_locs = {l['branch']: l for l in existing.get('locations', [])}
                new_locs = book.get('locations', [])
                for loc in new_locs:
                    if loc['branch'] not in existing_locs:
                        existing['locations'].append(loc)
        
        final_batch = list(unique_books.values())
        
        api_headers = {
            "Content-Type": "application/json",
            "x-api-secret": API_SECRET
        }
        
        # Use the global session if available, or create one with retries
        # Since 'session' is defined in 'scrape_details', we should ideally pass it.
        # But for quick fix, we can instantiate a new session here or rely on global scope if we move it.
        # Better: Restart logic inside the function for robustness.
        
        from requests.adapters import HTTPAdapter
        from urllib3.util.retry import Retry
        
        s = requests.Session()
        retry = Retry(connect=3, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
        adapter = HTTPAdapter(max_retries=retry)
        s.mount('http://', adapter)
        
        resp = s.post(API_URL, json=final_batch, headers=api_headers, timeout=30)
        
        if resp.status_code == 200:
            print(f"   ✅ Uploaded batch of {len(books)} books.")
        else:
            print(f"   ❌ API Upload failed ({resp.status_code}): {resp.text}")
            import json
            print("   🔍 FAILED BATCH PAYLOAD:")
            print(json.dumps(final_batch, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"   ❌ API Connection failed: {e}")

if __name__ == "__main__":
    scrape_details()
