import requests
from bs4 import BeautifulSoup

url = "https://bibliometro.cl/libros/1-2-3-me-lo-cuentas-otra-vez-2/"
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}

print(f"Fetching {url}...")
try:
    resp = requests.get(url, headers=headers, timeout=10)
    print(f"Status Code: {resp.status_code}")
    
    if resp.status_code == 200:
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        print("\n--- PAGE TITLE ---")
        if soup.title: print(soup.title.string)
        
        print("\n--- H1 TAGS ---")
        for h1 in soup.find_all('h1'):
            print(f"Text: {h1.get_text(strip=True)} | Class: {h1.get('class')}")

        print("\n--- H2 TAGS ---")
        for h2 in soup.find_all('h2'):
            print(f"Text: {h2.get_text(strip=True)} | Class: {h2.get('class')}")
            
        print("\n--- H3 TAGS ---")
        for h3 in soup.find_all('h3'):
            print(f"Text: {h3.get_text(strip=True)} | Class: {h3.get('class')}")

        entry_title = soup.find(class_='entry-title')
        print(f"\n--- CLASS 'entry-title' ---")
        if entry_title:
            print(f"Tag: {entry_title.name} | Text: {entry_title.get_text(strip=True)}")
        else:
            print("Not found")

except Exception as e:
    print(f"Error: {e}")
