# 📚 Bookwise Backend API

Backend API independiente para el sistema de recomendaciones de libros Bookwise.

## 🚀 Características

- ✅ API REST con Express.js
- ✅ Recomendaciones inteligentes con Gemini AI
- ✅ Integración preparada para catálogo de Bibliometro
- ✅ Sistema de búsqueda de bibliotecas en Santiago
- ✅ CORS configurado para frontend
- ✅ Completamente independiente y desplegable

## 📋 Requisitos

- Node.js v18 o superior
- npm o yarn

## 🔧 Instalación

```bash
# Clonar el repositorio
git clone <tu-repositorio>
cd bookwise-backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones
```

## ⚙️ Configuración

Crea un archivo `.env` en la raíz del proyecto:

```env
# Puerto del servidor
PORT=3001

# URL del frontend (para CORS)
FRONTEND_URL=http://localhost:5173

# Gemini AI API Key (opcional - para recomendaciones con IA)
# Obtén tu API key gratis en: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=tu_api_key_aqui

# Firebase Catalog (opcional - para usar catálogo completo de Bibliometro)
USE_FIREBASE_CATALOG=false
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
# O usar variable de entorno JSON:
# FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Scraping de Bibliometro
MAX_PAGES=100  # Máximo de páginas a scrapear (por defecto 100)

# URL de API de Bibliometro (cuando esté disponible)
# Contactar: contacto@programabibliometro.gob.cl
BIBLIOMETRO_API_URL=
```

## 🏃 Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

El servidor estará disponible en `http://localhost:3001`

## 📡 Endpoints

### Health Check
```
GET /health
```
Verifica el estado del servidor.

**Respuesta:**
```json
{
  "status": "ok",
  "message": "Bookwise API is running"
}
```

### Recomendaciones
```
POST /api/recommendations
```
Genera recomendaciones personalizadas de libros.

**Body:**
```json
{
  "age": 25,
  "goal": "entretener",
  "prefersShort": false,
  "difficultyMax": 4,
  "tags": ["fantasía", "aventura", "misterio"]
}
```

**Respuesta:**
```json
{
  "recommendations": [
    {
      "id": "book-id",
      "title": "Título del libro",
      "author": "Autor",
      "pages": 300,
      "difficulty": 3,
      "tags": ["fantasía", "aventura"],
      "why": "Explicación personalizada...",
      "score": 85,
      "libraries": [
        {
          "name": "Bibliometro Estación Central",
          "address": "Estación Central, Santiago",
          "available": true,
          "distance": "2.5 km"
        }
      ]
    }
  ],
  "count": 10,
  "xpGained": 25
}
```

### Catálogo de Libros
```
GET /api/books?page=1&limit=50&search=query
```
Obtiene el catálogo de libros con paginación.

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Resultados por página (default: 50)
- `search` (opcional): Término de búsqueda

### Buscar Libros
```
GET /api/books/search?q=query
```
Busca libros en el catálogo.

### Detalles de Libro
```
GET /api/books/:id
```
Obtiene información detallada de un libro específico.

## 🔌 Integración con Bibliometro

El sistema puede usar el catálogo completo de Bibliometro mediante scraping y almacenamiento en Firebase.

### Opción 1: Usar Firebase (Recomendado)

1. **Scrapear el catálogo de Bibliometro**:
   ```bash
   node scripts/scrape-bibliometro-improved.js
   ```
   Esto generará `bibliometro-catalog.json` con todos los libros encontrados.

2. **Subir a Firebase**:
   ```bash
   node scripts/upload-to-firebase.js
   ```

3. **Configurar Firebase en `.env`**:
   ```env
   USE_FIREBASE_CATALOG=true
   FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
   # O usar variable de entorno:
   # FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
   ```

4. **Verificar estado**:
   ```bash
   curl http://localhost:3001/api/firebase/status
   ```

### Opción 2: API Directa (Cuando esté disponible)

1. **Contactar Bibliometro**: contacto@programabibliometro.gob.cl
2. **Configurar API URL**: Agregar `BIBLIOMETRO_API_URL` en `.env`
3. **Listo**: El sistema se actualizará automáticamente

### Scripts de Scraping Disponibles

- `scrape-bibliometro-improved.js`: Script mejorado con Puppeteer (recomendado)
- `scrape-bibliometro-puppeteer.js`: Versión anterior con Puppeteer
- `scrape-bibliometro.js`: Versión con Cheerio (más rápido pero menos robusto)
- `scrape-bibliometro-api.js`: Intenta usar WordPress REST API
- `inspect-bibliometro.js`: Inspecciona la estructura HTML del sitio

### Configuración de Scraping

Puedes configurar el número máximo de páginas a scrapear:
```env
MAX_PAGES=100  # Por defecto 100, ajusta según necesites
```

El servicio está en `src/services/bibliometro.js` y maneja:
- Búsqueda de libros en catálogo local y Bibliometro
- Obtención de catálogo completo con paginación
- Búsqueda de bibliotecas con disponibilidad real
- Detalles de libros específicos
- Integración automática con recomendaciones de Gemini

## 🤖 Gemini AI

Para usar recomendaciones con IA:

1. Obtén tu API key gratis: https://makersuite.google.com/app/apikey
2. Agrega `GEMINI_API_KEY` en `.env`
3. Sin API key, el sistema usa recomendaciones tradicionales (fallback automático)

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── routes/              # Rutas de la API
│   │   ├── recommendations.js
│   │   └── books.js
│   ├── services/            # Servicios externos
│   │   ├── bibliometro.js   # Servicio de Bibliometro
│   │   ├── firebase-catalog.js  # Servicio de Firebase
│   │   └── gemini.js        # Servicio de Gemini AI
│   ├── utils/               # Utilidades
│   │   └── recommendations.js
│   ├── data.json            # Catálogo local (temporal)
│   └── server.js            # Servidor principal
├── scripts/                 # Scripts de utilidad
│   ├── scrape-bibliometro-improved.js  # Scraping mejorado
│   ├── scrape-bibliometro-puppeteer.js
│   ├── scrape-bibliometro.js
│   ├── scrape-bibliometro-api.js
│   ├── inspect-bibliometro.js
│   └── upload-to-firebase.js
├── bibliometro-catalog.json # Catálogo scrapeado (generado)
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🚢 Despliegue

El backend puede desplegarse en cualquier plataforma que soporte Node.js:

- **Railway**: https://railway.app
- **Render**: https://render.com
- **Heroku**: https://heroku.com
- **Vercel**: https://vercel.com (con serverless functions)
- **DigitalOcean**: https://digitalocean.com
- **AWS/Google Cloud/Azure**: Cualquier servicio de Node.js

### Variables de Entorno en Producción

Asegúrate de configurar:
- `PORT`: Puerto del servidor
- `FRONTEND_URL`: URL de tu frontend (para CORS)
- `GEMINI_API_KEY`: (opcional) Para recomendaciones con IA
- `BIBLIOMETRO_API_URL`: (opcional) Cuando esté disponible

## 📝 Licencia

ISC

## 👤 Autor

Tu nombre aquí

## 🔗 Frontend

El frontend de Bookwise está en un repositorio separado.

