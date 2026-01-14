import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import recommendationsRoutes from './routes/recommendations.js';
import booksRoutes from './routes/books.js';
import { supabase } from './services/supabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Bookwise API is running' });
});

// Supabase status check
app.get('/api/supabase/status', async (req, res) => {
  try {
    const hasCredentials = !!(process.env.SUPABASE_URL && process.env.SUPABASE_KEY);

    if (!hasCredentials) {
      return res.json({
        enabled: false,
        message: 'Supabase no configurado - faltan credenciales',
        connected: false
      });
    }

    // Check connection by counting books
    const { count, error } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return res.json({
      enabled: true,
      connected: true,
      message: 'Supabase conectado correctamente',
      metadata: {
        totalBooks: count
      }
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
  console.log(`📚 Bookwise API ready!`);

  // Verificar Gemini
  if (process.env.GEMINI_API_KEY) {
    const keyPreview = process.env.GEMINI_API_KEY.substring(0, 8) + '...';
    console.log(`✅ Gemini AI configurado correctamente (API Key: ${keyPreview})`);
    console.log(`🤖 Recomendaciones con IA habilitadas`);
  } else {
    console.log(`⚠️  GEMINI_API_KEY not set - using fallback recommendations`);
  }

  // Verificar Supabase
  if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    console.log(`✅ Supabase configurado`);
  } else {
    console.log(`⚠️  Supabase Credenciales faltantes en .env`);
  }

  console.log(`\n🔍 Verifica el estado en: http://localhost:${PORT}/api/supabase/status`);
});

