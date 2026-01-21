import requests
import re

url = "https://bibliometro.cl/libros/1984-10/"
print(f"Fetching {url}...")
headers = {"User-Agent": "Mozilla/5.0"}
try:
    resp = requests.get(url, headers=headers, timeout=10)
    html = resp.text
    
    print(f"Total HTML length: {len(html)}")
    
    # Search for "Orwell" to see where the author name lives
    matches_author = [m.start() for m in re.finditer(r'orwell', html, re.IGNORECASE)]
    
    # Search for "Páginas"
    matches_pages = [m.start() for m in re.finditer(r'páginas', html, re.IGNORECASE)]
    
    with open("debug_output.txt", "w", encoding="utf-8") as f:
        f.write("--- SEARCH: 'orwell' ---\n")
        if not matches_author:
            f.write("KEYWORD 'orwell' NOT FOUND\n")
        else:
            for i, start_pos in enumerate(matches_author):
                start_ctx = max(0, start_pos - 100)
                end_ctx = min(len(html), start_pos + 400)
                snippet = html[start_ctx:end_ctx]
                f.write(f"\n[Match {i+1}]: ...{snippet.replace(chr(10), ' ')}...\n")
                
        f.write("\n\n--- SEARCH: 'pages/páginas' ---\n")
        if not matches_pages:
             f.write("KEYWORD 'páginas' NOT FOUND\n")
        else:
             for i, start_pos in enumerate(matches_pages):
                start_ctx = max(0, start_pos - 100)
                end_ctx = min(len(html), start_pos + 400)
                snippet = html[start_ctx:end_ctx]
                f.write(f"\n[Match {i+1}]: ...{snippet.replace(chr(10), ' ')}...\n")

    print("Search results written to debug_output.txt")

except Exception as e:
    print(f"Error: {e}")
