# Registro de Cambios - Backend (Versión 2.0)

Este documento detalla todas las modificaciones realizadas al backend original para alcanzar la versión actual, estable y optimizada.

## 1. Arquitectura y Base de Datos
- **ORM Sequelize**: Se implementó Sequelize como ORM para reemplazar consultas SQL crudas o dependencias de `supabase-js`, mejorando la seguridad y mantenibilidad.
- **Conexión Robusta**: Solución al problema de conexión IPv6 mediante el uso del **Supabase Connection Pooler** (Puerto 6543) y configuración estándar en `src/config/database.js`.
- **Modelo de Datos (`Book`)**: Se actualizó el modelo para incluir:
    - `locations` (JSONB): Para almacenar disponibilidad real por sucursal.
    - Soporte para claves primarias generadas (IDs deterministas).

## 2. Scraping y Obtención de Datos
- **Python Scrapers**: Se migró la lógica de scraping de Node.js a Python para mayor robustez (`backend/scrapers/`).
    - `bibliometro.py`: Extrae títulos, autores y **disponibilidad real** (sucursal y stock) navegando al detalle de cada libro.
    - `bnc.py`: Conecta al portal de la Biblioteca Nacional para extraer noticias y publicaciones recientes.
- **Manejo de Errores**: Parseo robusto con Expresiones Regulares para capturar datos sucios de la web (ej: "Baquedano 1").

## 3. Automatización (Cron Jobs)
- **Cron Manager (`src/services/cron.js`)**: Servicio dedicado que ejecuta los scripts de Python automáticamente todos los días a las 03:00 AM.
- **Integración**: Iniciación automática al arrancar el servidor `server.js`.

## 4. API y Reducción de Deuda Técnica
- **Limpieza de Dependencias**: 
    - Eliminado: `puppeteer` (pesado/inestable en serverless), `firebase-admin`, `bibliometro.js` (legacy), scripts de prueba temporales.
- **Controlador de Recomendaciones**: Se optimizó `recommendationController.js` para usar la base de datos local rápida en lugar de hacer scraping en tiempo real por cada petición (lo cual era lento).

## 5. Estado Actual
- **Servidor**: Express corriendo en puerto 3001.
- **Base de Datos**: PostgreSQL (Supabase) sincronizada.
- **IA**: Integración con Cohere AI funcional.
