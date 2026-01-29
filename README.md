# 📚 Bookwise Backend - Motor de Inteligencia y Datos

Backend oficial para la plataforma **Bookwise**, encargado de la orquestación de datos, generación de recomendaciones mediante IA y recolección automatizada de catálogo (scraping).

## 🚀 Arquitectura Pro

El sistema utiliza una arquitectura desacoplada basada en **ES Modules (Node.js)** y **Python 3.10+**, optimizando la recolección de datos y la entrega de recomendaciones en tiempo real.

### Stack Tecnológico
- **Core API**: Node.js + Express 5 (Puerto 3001)
- **Base de Datos**: PostgreSQL (Infraestructura gestionada en Supabase)
- **ORM**: Sequelize 6 para modelado de datos robusto
- **IA Engine**: Cohere AI / Gemini (Generación de contexto de lectura)
- **Scraping Engine**: Python v3 (Arquitectura Master/Worker para evitar bloqueos)
- **Automatización**: node-cron para tareas programadas de mantenimiento de base de datos

---

## 🏗️ Estructura del Proyecto

```
backend-bookwise/
├── src/
│   ├── config/         # Configuración de base de datos (PostgreSQL/Supabase)
│   ├── controllers/    # Lógica de endpoints (Búsqueda y Recomendaciones)
│   ├── models/         # Definición de esquemas de datos (Sequelize)
│   ├── routes/         # Capa de enrutamiento REST
│   └── services/       # Integraciones externas (IA, Cron Jobs)
├── scrapers/           # 🕸️ Motor de Scraping en Python
│   ├── bibliometro_urls.py    # Recolección de índices
│   └── bibliometro_details.py # Extracción profunda de datos
└── server.js           # Punto de entrada principal
```

---

## ⚙️ Instalación y Configuración

### 1. Variables de Entorno (`.env`)
Configura las credenciales esenciales en la raíz del proyecto. 

> [!WARNING]
> **SEGURIDAD**: Nunca compartas ni subas tu archivo `.env` real al repositorio. Las llaves a continuación son **ejemplos** y deben ser reemplazadas por tus propias credenciales privadas.

Crea un archivo llamado `.env` y añade lo siguiente:

```env
PORT=3001
API_SECRET=tu_secreto_seguro_aqui
DATABASE_URL=postgresql://usuario:password@host:puerto/dbname
COHERE_API_KEY=tu_token_de_ia_privado
```

### 2. Despliegue de Dependencias

**Entorno Node.js:**
```bash
npm install
```

**Entorno Python (Scrapers):**
```bash
python -m venv .venv
# Activar según OS y luego:
pip install -r scrapers/requirements.txt
```

---

## 📡 API Endpoints (REST)

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/books` | Catálogo completo (paginado) |
| `GET` | `/api/books/search?q=...` | Búsqueda semántica por título/autor |
| `POST` | `/api/recommendations` | Generación de perfil de lectura mediante IA |
| `POST` | `/api/books/batch` | Carga masiva (uso restringido para scrapers) |

---

## 🕷️ Sistema de Automatización (Cron Jobs)

El backend gestiona la actualización del catálogo de forma transparente:
1.  **Sincronización de URLs**: Cada madrugada se recolectan nuevos enlaces de Bibliometro.
2.  **Extracción de Stock**: Los workers de Python actualizan la disponibilidad por sucursal.
3.  **Inyección de Datos**: Los datos procesados se integran automáticamente en Supabase vía API interna protegida.

---

## 🛠️ Comandos de Desarrollo

- `npm run dev`: Inicia servidor con auto-recarga.
- `npm start`: Servidor optimizado para producción.

## 📝 Licencia

ISC
