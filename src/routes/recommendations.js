import express from 'express';
import { getAIRecommendations } from '../services/gemini.js';
import { getSimpleRecommendations, toTagArray } from '../utils/recommendations.js';
import { findLibraries, getCatalog } from '../services/bibliometro.js';
import books from '../data.json' with { type: 'json' };

const router = express.Router();

/**
 * Combina libros del catálogo local con libros de Bibliometro
 */
async function combineCatalogs() {
  const combinedBooks = [...books];

  try {
    // Obtener libros de Bibliometro (Supabase o API)
    // Pedimos 100 libros para mezclar con los locales
    const bibliometroResult = await getCatalog(1, 100);

    if (bibliometroResult.success && bibliometroResult.books.length > 0) {
      // Agregar libros de Bibliometro al catálogo combinado
      bibliometroResult.books.forEach(bibliometroBook => {
        // Verificar si el libro ya existe (por título y autor)
        const exists = combinedBooks.some(book =>
          book.title?.toLowerCase() === bibliometroBook.title?.toLowerCase() &&
          book.author?.toLowerCase() === bibliometroBook.author?.toLowerCase()
        );

        if (!exists) {
          // Normalizar libro de Bibliometro al formato esperado
          const normalizedBook = {
            id: bibliometroBook.id || `bibliometro-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: bibliometroBook.title,
            author: bibliometroBook.author,
            pages: bibliometroBook.pages || null,
            difficulty: bibliometroBook.difficulty || 3,
            tags: bibliometroBook.tags || ['bibliometro'],
            source: 'bibliometro',
            url: bibliometroBook.url || bibliometroBook.link || null,
            imageUrl: bibliometroBook.imageUrl || null,
          };
          combinedBooks.push(normalizedBook);
        }
      });

      console.log(`[Recomendaciones] Catálogo combinado: ${books.length} locales + ${bibliometroResult.books.length} Bibliometro = ${combinedBooks.length} total`);
    } else {
      console.log(`[Recomendaciones] No se obtuvieron libros de Bibliometro (Success: ${bibliometroResult.success})`);
    }
  } catch (error) {
    console.warn('[Recomendaciones] Error obteniendo catálogo de Bibliometro:', error.message);
    console.log('[Recomendaciones] Usando solo catálogo local');
  }

  return combinedBooks;
}

router.post('/', async (req, res) => {
  try {
    const profile = req.body ?? {};
    const pTags = toTagArray(profile.tags);

    if (pTags.length === 0) {
      return res.status(400).json({ error: "Profile must include at least 1 tag." });
    }

    // Combinar catálogos local y Bibliometro
    const allBooks = await combineCatalogs();

    // Intentar usar Gemini AI primero
    let recommendations = await getAIRecommendations(profile, allBooks);

    // Si Gemini no está disponible, usar sistema tradicional
    if (!recommendations) {
      recommendations = getSimpleRecommendations(profile, allBooks);
    }

    // Buscar bibliotecas para cada libro recomendado
    const recommendationsWithLibraries = await Promise.all(
      recommendations.map(async (book) => {
        const libraries = await findLibraries(book.title, book.author);
        return {
          ...book,
          libraries,
        };
      })
    );

    // XP ganado por generar recomendaciones (solo la primera vez)
    const xpGained = 25;

    const response = {
      recommendations: recommendationsWithLibraries.map((b) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        pages: b.pages,
        difficulty: b.difficulty,
        tags: b.tags,
        why: b.why,
        score: Math.round(b.score),
        libraries: b.libraries,
        source: b.source || 'local',
        url: b.url || null,
        imageUrl: b.imageUrl || null,
      })),
      count: recommendationsWithLibraries.length,
      xpGained,
      catalogInfo: {
        totalBooks: allBooks.length,
        bibliometroEnabled: !!(process.env.SUPABASE_URL && process.env.SUPABASE_KEY),
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error en recomendaciones:", error);
    res.status(500).json({ error: "Error al generar recomendaciones" });
  }
});

export default router;

