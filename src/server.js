import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import recommendationsRoutes from './routes/recommendations.js';
import booksRoutes from './routes/books.js';
import sequelize from './config/database.js';
import './models/Book.js'; // Import models to register them
import { initCronJobs } from './services/cron.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: true, // Permite cualquier origen (reflexivo) para desarrollo local
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Bookwise API is running' });
});

// Database status check
app.get('/api/db/status', async (req, res) => {
  try {
    const hasUrl = !!process.env.DATABASE_URL;

    if (!hasUrl) {
      return res.json({
        enabled: false,
        message: 'Base de datos no configurada - falta DATABASE_URL',
        connected: false
      });
    }

    // Check connection
    await sequelize.authenticate();

    return res.json({
      enabled: true,
      connected: true,
      message: 'Base de datos (Postgres/Sequelize) conectada correctamente',
      dialect: sequelize.getDialect()
    });

  } catch (error) {
    return res.status(500).json({
      enabled: true,
      connected: false,
      error: error.message
    });
  }
});

// Routes
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/books', booksRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, async () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);

  try {
    // Sync Database
    await sequelize.sync({ alter: true }); // Updates schema without deleting data
    console.log(`🗄️  Database synchronized (Sequelize)`);
  } catch (error) {
    console.error(`❌ Error synchronizing database:`, error.message);
  }

  // Initialize Cron Jobs
  initCronJobs();

  console.log(`📚 Bookwise API ready!`);

  // Verificar AI Service (Cohere)
  if (process.env.COHERE_API_KEY) {
    const keyPreview = process.env.COHERE_API_KEY.substring(0, 5) + '...';
    console.log(`✅ Cohere AI configurado correctamente`);
  } else {
    console.log(`⚠️  COHERE_API_KEY not set`);
  }

  console.log(`\n🔍 Verifica el estado DB en: http://localhost:${PORT}/api/db/status`);
});

