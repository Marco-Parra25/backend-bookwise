/**
 * Script mejorado para descargar el catálogo completo de Bibliometro
 * Usa Puppeteer para manejar contenido dinámico (JavaScript)
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BIBLIOMETRO_URL = 'https://bibliometro.cl/catalogo';
const MAX_PAGES = parseInt(process.env.MAX_PAGES) || 100; // Limitar por defecto
const DELAY_MS = 2000; // 2 segundos entre páginas
const OUTPUT_FILE = path.join(__dirname, '..', 'bibliometro-catalog.json');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
/**
 * Genera un ID único para el libro
 */
function generateId(title, author) {
  if (!title) return `bibliometro-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const titleSlug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 50);

  const authorSlug = (author || 'unknown')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 30);

  return `bibliometro-${titleSlug}-${authorSlug}`.substring(0, 100);
}

/**
 * Extrae libros de una página usando Puppeteer
 */
async function extractBooksFromPage(page) {
  const books = await page.evaluate(() => {
    const bookElements = document.querySelectorAll('a[href*="/libros/"]');
    const books = [];
    const seenUrls = new Set();

    bookElements.forEach(link => {
      const url = link.href;
      if (seenUrls.has(url)) return;
      seenUrls.add(url);

      const h3 = link.querySelector('h3');
      const h4 = link.querySelector('h4');

      if (h3) {
        const title = h3.textContent.trim();
        const author = h4 ? h4.textContent.trim() : 'Autor desconocido';

        if (title && title.length > 2) {
          books.push({
            title,
            author,
            url
          });
        }
      }
    });

    return books;
  });

  return books.map(book => ({
    id: generateId(book.title, book.author),
    title: book.title,
    author: book.author,
    source: 'bibliometro',
    url: book.url
  }));
}

/**
 * Obtiene el total de resultados de la página
 */
async function getTotalResults(page) {
  try {
    const totalText = await page.evaluate(() => {
      const resultElement = document.querySelector('.txt-result');
      return resultElement ? resultElement.textContent : '';
    });

    const match = totalText.match(/(\d+[\.,]?\d*)\s+resultados?/i);
    if (match) {
      return parseInt(match[1].replace(/[.,]/g, ''));
    }
    return 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Navega a una página específica usando la paginación
 */
async function navigateToPage(browserPage, pageNumber) {
  try {
    // Esperar a que la paginación esté disponible
    await delay(2000);

    // Hacer clic en el número de página
    // Use XPath to find the link containing the text of the page number
    const [link] = await browserPage.$x(`//a[contains(@class, "pagina-numero") and text()="${pageNumber}"]`);

    if (link) {
      await link.click();
      await delay(3000);
      return true;
    }

    // Fallback: finding by direct evaluation
    const clicked = await browserPage.evaluate((pageNum) => {
      const links = Array.from(document.querySelectorAll('.pagina-numero, a'));
      const target = links.find(el => el.textContent.trim() === pageNum.toString());
      if (target) {
        target.click();
        return true;
      }
      return false;
    }, pageNumber);

    if (clicked) {
      await delay(3000);
      return true;
    }

    return false;
  } catch (error) {
    console.log(`   ⚠️  Error navegando a página ${pageNumber}: ${error.message}`);
    return false;
  }
}

/**
 * Función principal de scraping con Puppeteer
 */
async function scrapeWithPuppeteer() {
  console.log('🚀 Iniciando scraping con Puppeteer...\n');
  console.log(`📊 Configuración:`);
  console.log(`   - URL: ${BIBLIOMETRO_URL}`);
  console.log(`   - Máximo de páginas: ${MAX_PAGES}`);
  console.log(`   - Delay entre páginas: ${DELAY_MS}ms\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const allBooks = [];
  const seenIds = new Set();

  try {
    console.log('📡 Cargando página inicial...');
    await page.goto(BIBLIOMETRO_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Obtener total de resultados
    const totalResults = await getTotalResults(page);
    console.log(`📊 Total de resultados encontrados: ${totalResults.toLocaleString()}`);

    if (totalResults === 0) {
      console.log('⚠️  No se pudo detectar el total de resultados');
    }

    // Extraer libros de la primera página
    console.log('\n📖 Extrayendo libros de la página 1...');
    const firstPageBooks = await extractBooksFromPage(page);
    console.log(`✅ Página 1: ${firstPageBooks.length} libros encontrados`);

    firstPageBooks.forEach(book => {
      if (!seenIds.has(book.id)) {
        seenIds.add(book.id);
        allBooks.push(book);
      }
    });

    // Calcular páginas totales
    const booksPerPage = firstPageBooks.length || 24;
    const totalPages = totalResults > 0 ? Math.ceil(totalResults / booksPerPage) : MAX_PAGES;
    const pagesToScrape = Math.min(totalPages, MAX_PAGES);

    console.log(`\n📄 Procesando páginas adicionales (2-${pagesToScrape})...\n`);

    // Procesar páginas adicionales
    for (let pageNum = 2; pageNum <= pagesToScrape; pageNum++) {
      try {
        console.log(`📄 Procesando página ${pageNum}/${pagesToScrape}...`);

        const navigated = await navigateToPage(page, pageNum);
        if (!navigated) {
          console.log(`   ⚠️  No se pudo navegar a la página ${pageNum}, intentando siguiente...`);
          continue;
        }

        const pageBooks = await extractBooksFromPage(page);

        if (pageBooks.length === 0) {
          console.log(`   ⚠️  Página ${pageNum}: No se encontraron libros, posiblemente última página`);
          break;
        }

        let newBooks = 0;
        pageBooks.forEach(book => {
          if (!seenIds.has(book.id)) {
            seenIds.add(book.id);
            allBooks.push(book);
            newBooks++;
          }
        });

        console.log(`   ✅ Página ${pageNum}: ${pageBooks.length} libros encontrados, ${newBooks} nuevos (total: ${allBooks.length})`);

        // Delay entre páginas
        await delay(DELAY_MS);

        // Mostrar progreso cada 10 páginas
        if (pageNum % 10 === 0) {
          console.log(`\n   📊 Progreso: ${pageNum}/${pagesToScrape} páginas, ${allBooks.length} libros únicos\n`);
        }

      } catch (error) {
        console.log(`   ❌ Error en página ${pageNum}: ${error.message}`);
        break;
      }
    }

  } catch (error) {
    console.error('❌ Error durante el scraping:', error.message);
  } finally {
    await browser.close();
  }

  return allBooks;
}

/**
 * Guarda el catálogo en JSON
 */
function saveCatalog(books) {
  const outputPath = path.join(__dirname, '..', 'bibliometro-catalog.json');

  const catalog = {
    source: 'Bibliometro',
    scrapedAt: new Date().toISOString(),
    total: books.length,
    books: books,
  };

  fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2), 'utf-8');
  console.log(`\n✅ Catálogo guardado en: ${outputPath}`);
  console.log(`📚 Total de libros: ${books.length}`);

  return outputPath;
}

/**
 * Función principal
 */
async function main() {
  try {
    const books = await scrapeWithPuppeteer();

    if (books.length > 0) {
      const outputPath = saveCatalog(books);
      console.log(`\n✅ Proceso completado!`);
      console.log(`📁 Archivo: ${outputPath}`);
      console.log(`\n💡 Próximos pasos:`);
      console.log(`1. Revisar el archivo JSON generado`);
      console.log(`2. Ejecutar: node scripts/upload-to-firebase.js bibliometro-catalog.json`);
      console.log(`\n💡 Para obtener más libros, configura MAX_PAGES en .env`);
    } else {
      console.log('\n⚠️  No se encontraron libros.');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

