# 📚 Bookwise Backend API

Backend API independiente para el sistema de recomendaciones de libros Bookwise.

## 🚀 Características

- ✅ API REST con Express.js
- ✅ **Recomendaciones inteligentes con Cohere AI** (Modelo `command-nightly`).
- ✅ **Modo Estricto de IA:** Garantiza respuestas de alta calidad o reporta errores detallados.
- ✅ **Inicialización Perezosa (Lazy Init):** Conexión robusta que asegura la carga de credenciales.
- ✅ Integración preparada para catálogo de Bibliometro.
- ✅ Sistema de búsqueda de bibliotecas en Santiago.
- ✅ CORS configurado para frontend (puertos dinámicos soportados).

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
# Se admite origen dinámico (true) en desarrollo
FRONTEND_URL=http://localhost:5173

# Cohere AI API Key (Requerido para recomendaciones)
# Obtén tu API key gratis en: https://dashboard.cohere.com/api-keys
COHERE_API_KEY=tu_api_key_aqui

# Firebase Catalog (opcional - para usar catálogo completo de Bibliometro)
USE_FIREBASE_CATALOG=true
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
# O usar variable de entorno JSON:
# FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Supabase (Opcional - Base de datos de libros)
SUPABASE_URL=...
SUPABASE_KEY=...
```

## 🏃 Ejecución

### Desarrollo
```bash
npm run dev
```
*El servidor se iniciará en `http://localhost:3001` y recargará automáticamente los cambios.*

### Producción
```bash
npm start
```

## 📡 Endpoints Principales

### Health Check
`GET /health`
> Verifica el estado del servidor.

### Recomendaciones
`POST /api/recommendations`
> Genera 10 recomendaciones personalizadas basadas en el perfil del usuario.

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

**Respuesta Exitosa:**
```json
{
  "recommendations": [
    {
      "id": "book-id",
      "title": "Dune",
      "author": "Frank Herbert",
      "why": "Un clásico de ciencia ficción que coincide con tus gustos de política y aventura.",
      "score": 95,
      "libraries": [...]
    }
  ],
  "count": 10
}
```

**Respuesta de Error (AI Falló):**
```json
{
  "error": "Error AI: La IA respondió pero no pude entender el formato JSON..."
}
```
*Nota: El frontend debe mostrar este mensaje al usuario.*

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── routes/              # Rutas de la API (recommendations, books)
│   ├── services/            # Servicios externos
│   │   ├── bibliometro.js   # Servicio de Bibliometro
│   │   ├── cohere.js        # Servicio de Cohere AI (Reemplaza a Gemini)
│   │   └── supabase.js      # Conexión a Base de Datos
│   ├── utils/               # Utilidades
│   └── server.js            # Servidor principal
├── scripts/                 # Scripts de utilidad y scraping
├── .env                     # Variables de entorno (NO subir al repo)
├── package.json
└── README.md
```

## 📝 Notas de Desarrollo

- **Cohere AI:** Se utiliza el modelo `command-nightly` a través del endpoint `chat` para asegurar compatibilidad con cuentas gratuitas trial.
- **Hoisting Fix:** El servicio de Cohere implementa *Lazy Initialization* para evitar errores de "API Key missing" durante el arranque del servidor.

## 👤 Autor
Marco Parra
