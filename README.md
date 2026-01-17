# 📚 Bookwise Backend

Backend oficial para la plataforma **Bookwise**, un sistema inteligente de recomendación y disponibilidad de libros en bibliotecas públicas de Chile.

## 🚀 Arquitectura

El sistema utiliza una arquitectura moderna basada en **Node.js** y **Python**, desacoplando la lógica de negocio de la recolección de datos (scraping).

### Stack Tecnológico
- **Core API**: Node.js + Express (Puerto 3001)
- **Base de Datos**: PostgreSQL (vía Supabase Connection Pooler)
- **ORM**: Sequelize
- **IA**: Cohere AI (Generación de recomendaciones)
- **Scraping**: Python 3.x (Master/Worker Pattern)

---

## 🏗️ Estructura del Proyecto

```
backend/
├── src/
│   ├── config/         # Configuración de BD (Sequelize)
│   ├── controllers/    # Lógica de endpoints (Books, Recommendations)
│   ├── models/         # Modelos de datos (Book.js)
│   ├── routes/         # Definición de rutas API
│   └── services/       # Servicios externos (Cohere, Cron Manager)
├── scrapers/
│   ├── bibliometro_urls.py    # [Master] Recolector de URLs
│   ├── bibliometro_details.py # [Worker] Extractor de detalles
│   └── requirements.txt       # Dependencias de Python
└── server.js           # Punto de entrada
```

---

## ⚙️ Configuración e Instalación

### 1. Requisitos Previos
- Node.js v18+
- Python 3.10+
- PostgreSQL (Supabase)

### 2. Variables de Entorno (`.env`)
Crear un archivo `.env` en la raíz con:

```env
# Servidor
PORT=3001
API_SECRET=tu_secreto_para_scrapers

# Base de Datos (Supabase Transaction Pooler)
DATABASE_URL=postgresql://user:pass@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# IA Provider
COHERE_API_KEY=tu_api_key_cohere
```

### 3. Instalación de Dependencias

**Node.js (Backend):**
```bash
npm install
```

**Python (Scrapers):**
Se recomienda crear un entorno virtual:
```bash
python -m venv .venv
source .venv/bin/activate  # Mac/Linux
.\.venv\Scripts\Activate   # Windows
pip install -r scrapers/requirements.txt
```

---

## 🕷️ Sistema de Scraping (Dos Fases)

Para evitar bloqueos y optimizar recursos, el scraping se divide en dos procesos secuenciales gestionados por **Cron Jobs**:

1.  **Fase 1: Master (`bibliometro_urls.py`)** - *03:00 AM*
    *   Escanea sitemaps y categorías de Bibliometro.
    *   Genera un archivo `bibliometro_final_urls.txt` con todos los enlaces a libros.
    *   *No conecta a la BD.*

2.  **Fase 2: Worker (`bibliometro_details.py`)** - *04:00 AM*
    *   Lee el archivo de texto generado.
    *   Visita cada link para extraer: Título, Autor, Portada y **Disponibilidad por Sucursal**.
    *   Envía los datos a la API (`POST /api/books/batch`) usando el `API_SECRET`.

---

## 📡 API Endpoints Principales

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/books` | Lista libros paginados. |
| `GET` | `/api/books/search` | Búsqueda por título o autor. |
| `POST` | `/api/recommendations` | Genera recomendación con IA. |
| `POST` | `/api/books/batch` | **(Interno)** Carga masiva de libros desde scrapers. |

---

## 🧪 Comandos Útiles

```bash
# Iniciar servidor en desarrollo
npm run dev

# Ejecutar scraper manualmente (Fase 1)
python scrapers/bibliometro_urls.py

# Ejecutar scraper manualmente (Fase 2)
python scrapers/bibliometro_details.py
```
