import requests
from bs4 import BeautifulSoup

def get_availability(book_url):
    print(f"Testing URL: {book_url}")
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get(book_url, headers=headers)
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Debug: Print headers found
    headers_found = soup.find_all(['h3', 'h4', 'h5'])
    print("Headers found in page:")
    for h in headers_found:
        print(f" - {h.name}: {h.get_text(strip=True)}")

    # Original Logic
    print("\nTrying original logic...")
    header = soup.find(lambda tag: tag.name in ['h4', 'h5', 'h3'] and "ubicación" in tag.get_text(strip=True).lower())
    if header:
        print(f"✅ Found header: {header.get_text(strip=True)}")
        ul = header.find_next('ul')
        if ul:
            print("✅ Found UL following header.")
            lis = ul.find_all('li')
            for li in lis:
                print(f"   - LI: {li.get_text(strip=True)}")
        else:
            print("❌ No UL found after header.")
    else:
        print("❌ 'Ubicación' header NOT found.")

get_availability("https://bibliometro.cl/libros/la-casa-maldita/")
