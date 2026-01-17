import requests
from bs4 import BeautifulSoup
import xml.etree.ElementTree as ET
import logging
import sys
import time
from urllib.parse import urljoin
import os

# --- Configuración de Logs ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("scraper_master.log")
    ]
)
logger = logging.getLogger()

class BibliometroMasterScraper:
    def __init__(self):
        self.base_url = "https://bibliometro.cl"
        self.found_books = set()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        # Save output in same directory
        self.output_file = os.path.join(os.path.dirname(__file__), "bibliometro_final_urls.txt")

    def get_sitemap_urls(self):
        """Intenta extraer URLs directamente del mapa del sitio de WordPress"""
        logger.info("--- ESTRATEGIA 1: INFILTRACIÓN VÍA SITEMAP ---")
        
        sitemaps = [
            "https://bibliometro.cl/sitemap_index.xml",
            "https://bibliometro.cl/wp-sitemap.xml", # Common in recent WP
            "https://bibliometro.cl/post-sitemap.xml",
            "https://bibliometro.cl/page-sitemap.xml"
        ]

        for sitemap_url in sitemaps:
            logger.info(f"Probando sitemap: {sitemap_url}")
            try:
                response = self.session.get(sitemap_url, timeout=10)
                if response.status_code == 200:
                    try:
                        root = ET.fromstring(response.content)
                        count = 0
                        # Try to handle namespaces loosely by checking tag string endings
                        for elem in root.iter():
                            if elem.tag.endswith('loc'):
                                url = elem.text
                                if url and '/libros/' in url:
                                    self.found_books.add(url)
                                    count += 1
                                    
                        logger.info(f"   -> ¡ÉXITO! Extraídas {count} URLs de libros de {sitemap_url}")
                    except ET.ParseError:
                        logger.warning(f"   -> {sitemap_url} no es un XML válido o legible.")
            except Exception as e:
                logger.warning(f"   -> Fallo al leer {sitemap_url}: {e}")

    def crawl_categories(self):
        """Recorre las categorías estáticas como fallback"""
        logger.info("\n--- ESTRATEGIA 2: BARRIDO DE CATEGORÍAS ---")
        
        categorias = [
            "Literatura", "Arte", "Autoayuda", "Biografías", "Ciencias sociales", 
            "Cocina", "Cómics", "Ecología", "Esoterismo", "Filosofía", 
            "Género", "Historia", "Literatura infantil", "Literatura juvenil",
            "Manualidades", "Periodismo", "Poesía", "Pueblos Originarios", 
            "Sagas", "Salud física y mental"
        ]

        for cat in categorias:
            page = 1
            empty_streak = 0
            
            while True:
                # Limit scan depth for demo purposes - REMOVE LIMIT FOR PROD
                if page > 5: break 

                if page == 1:
                    url = f"https://bibliometro.cl/catalogo/?categoria={cat}"
                else:
                    url = f"https://bibliometro.cl/catalogo/page/{page}/?categoria={cat}"

                logger.info(f"Escaneando '{cat}' - Pág {page}...")
                
                try:
                    response = self.session.get(url, timeout=15)
                    if response.status_code != 200:
                        break
                    
                    soup = BeautifulSoup(response.text, 'html.parser')
                    links = soup.find_all('a', href=True)
                    
                    new_books_page = 0
                    
                    for link in links:
                        href = link['href']
                        if '/libros/' in href:
                            full_url = urljoin(self.base_url, href).split('#')[0]
                            if full_url not in self.found_books:
                                self.found_books.add(full_url)
                                new_books_page += 1
                                # print(f"   + {full_url}")

                    if new_books_page == 0:
                        empty_streak += 1
                    else:
                        empty_streak = 0

                    if empty_streak >= 2:
                        logger.info(f"   -> Fin de '{cat}'.")
                        break
                        
                    page += 1
                    time.sleep(0.5)

                except Exception as e:
                    logger.error(f"Error en {url}: {e}")
                    break

    def save(self):
        logger.info(f"\n--- GUARDANDO {len(self.found_books)} LIBROS ---")
        try:
            with open(self.output_file, "w", encoding="utf-8") as f:
                for url in sorted(self.found_books):
                    f.write(url + "\n")
            logger.info(f"✅ Archivo guardado en: {self.output_file}")
        except Exception as e:
            logger.error(f"❌ Error al guardar archivo: {e}")

if __name__ == "__main__":
    scraper = BibliometroMasterScraper()
    scraper.get_sitemap_urls()
    scraper.crawl_categories()
    scraper.save()
