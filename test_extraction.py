import requests
from bs4 import BeautifulSoup
import re

TEST_URLS = [
    "https://bibliometro.cl/libros/100-artistas-sin-los-que-no-podria-vivir/",
    "https://bibliometro.cl/libros/1984-10/",
    "https://bibliometro.cl/libros/1q84-libro-3/",
    "https://bibliometro.cl/libros/a-traves-de-mis-pequenos-ojos-be-you/", # Hypothetical valid URL based on pattern
    "https://bibliometro.cl/libros/abecedario-astronomico/",
    "https://bibliometro.cl/libros/after/",
    "https://bibliometro.cl/libros/al-faro/",
    "https://bibliometro.cl/libros/alas-de-sangre/",
    "https://bibliometro.cl/libros/aleph/", # Common book
    "https://bibliometro.cl/libros/cien-anos-de-soledad/" # Common book
]

headers = {"User-Agent": "Mozilla/5.0"}

print(f"🧪 Testing extraction on {len(TEST_URLS)} URLs...\n")

for url in TEST_URLS:
    try:
        print(f"Processing: {url}")
        resp = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(resp.content, "html.parser")
        
        title_tag = soup.find('h1')
        title = title_tag.get_text(strip=True) if title_tag else "NO TITLE"
        
        # --- AUTHOR ---
        author = "Desconocido"
        h4s = soup.find_all('h4')
        for h4 in h4s:
            txt = h4.get_text(strip=True)
            if "ubicación" in txt.lower() or "comentarios" in txt.lower():
                continue
            if txt:
                author = txt
                break

        if author == "Desconocido":
            # Fallback
            candidates = soup.find_all(['strong', 'b', 'span'])
            for tag in candidates:
                if "autor" in tag.get_text(strip=True).lower():
                    if ":" in tag.get_text():
                         parts = tag.get_text().split(":", 1)
                         if len(parts) > 1 and parts[1].strip():
                             author = parts[1].strip()
                    elif tag.next_sibling and isinstance(tag.next_sibling, str):
                         author = tag.next_sibling.strip()
        
        # --- PAGES ---
        pages = None
        strongs = soup.find_all('strong')
        for s in strongs:
            if "páginas" in s.get_text(strip=True).lower():
                sib = s.next_sibling
                if sib and isinstance(sib, str):
                    match = re.search(r'(\d+)', sib)
                    if match:
                        pages = match.group(1)

        print(f"   📘 Title: {title}")
        print(f"   ✍️  Author: {author}")
        print(f"   📄 Pages: {pages}")
        print("-" * 40)

    except Exception as e:
        print(f"   ❌ Failed: {e}")
        print("-" * 40)
