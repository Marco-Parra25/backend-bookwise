# Estructura del Proyecto Backend

Este proyecto gestiona la lógica del lado del servidor para BookWise, integrando scraping de datos, base de datos Supabase, e IA generativa.

## 📂 Directorios y Archivos Clave

### 🚀 Ejecución Principal
*   **`src/server.js`**: El corazón del backend. Inicia el servidor Express, configura los endpoints API (como `/api/books/search`) y conecta los servicios.
*   **`.env`**: Archivo de configuración confidencial. Guarda tus claves de Supabase, Google Gemini API, y configuración de scraping.
*   **`bibliometro-catalog.json`**: Archivo temporal donde se guarda el resultado del scraping antes de subirlo a la base de datos.

### 🛠️ Scripts (Carpeta `/scripts`)
Herramientas para mantener y actualizar los datos:

*   **`scrape-catalog.js`**: (Antes `scrape-bibliometro-puppeteer.js`). Navega automáticamente por el sitio de Bibliometro, extrae títulos, autores y URLs, y los guarda en el archivo JSON.
    *   *Uso:* `node scripts/scrape-catalog.js`
*   **`upload-to-supabase.js`**: Lee el `bibliometro-catalog.json` y sube los libros a tu base de datos en Supabase. Evita duplicados automáticamente.
    *   *Uso:* `node scripts/upload-to-supabase.js`
*   **`supabase_schema.sql`**: Código SQL que define la estructura de tu tabla `books` en Supabase. Útil si necesitas recrear la base de datos.
*   **`allow_public_write.sql`**: Script para configurar permisos de escritura (RLS) en Supabase durante el desarrollo.

### 🧠 Servicios y Lógica (`/src`)
*   **`services/supabase.js`**: Cliente de conexión. Permite al backend hablar con tu base de datos para buscar y guardar libros.
*   **`services/bibliometro.js`**: Contiene la lógica de negocio para interactuar con los datos de Bibliometro (buscar en la DB, filtrar, etc.).
*   **`routes/`**: Define las URLs que el Frontend puede llamar (ej: `books.js` maneja las búsquedas, `recommendations.js` maneja la IA).

## 🔄 Flujo de Datos
1.  **Scraping**: `scrape-catalog.js` -> `bibliometro-catalog.json`
2.  **Carga**: `upload-to-supabase.js` -> **Supabase (Nube)**
3.  **Consulta**: Frontend -> `src/server.js` -> `services/bibliometro.js` -> **Supabase** -> Frontend

---
*Documentación generada el 14 de Enero de 2026*
