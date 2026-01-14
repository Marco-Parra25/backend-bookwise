import express from 'express';
import { searchBooks, getCatalog, getBookDetails } from '../services/bibliometro.js';
import books from '../data.json' with { type: 'json' };

const router = express.Router();

// Obtener catálogo completo (con paginación)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search;

    // Si hay búsqueda, usar servicio de Bibliometro
    if (search) {
      const result = await searchBooks(search);
      return res.json(result);
    }

    // Por ahora retornar datos locales (hasta que Bibliometro tenga API)
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedBooks = books.slice(start, end);

    res.json({
      success: true,
      books: paginatedBooks,
      pagination: {
        page,
        limit,
        total: books.length,
        totalPages: Math.ceil(books.length / limit),
      },
      note: 'Usando catálogo local. Para catálogo completo de Bibliometro, contactar: contacto@programabibliometro.gob.cl'
    });
  } catch (error) {
    console.error('Error obteniendo catálogo:', error);
    res.status(500).json({ error: 'Error al obtener catálogo' });
  }
});

// Buscar libros
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q || req.query.query || '';

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const result = await searchBooks(query);
    res.json(result);
  } catch (error) {
    console.error('Error buscando libros:', error);
    res.status(500).json({ error: 'Error al buscar libros' });
  }
});

// Obtener detalles de un libro específico
router.get('/:id', async (req, res) => {
  try {
    const bookId = req.params.id;

    // Buscar en catálogo local primero
    const localBook = books.find(b => b.id === bookId);
    if (localBook) {
      return res.json({
        success: true,
        book: localBook,
        source: 'local'
      });
    }

    // Si no está local, buscar en Bibliometro
    const bibliometroResult = await getBookDetails(bookId);
    res.json(bibliometroResult);
  } catch (error) {
    console.error('Error obteniendo libro:', error);
    res.status(500).json({ error: 'Error al obtener libro' });
  }
});

export default router;

