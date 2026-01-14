import axios from 'axios';
import dotenv from 'dotenv';
import { supabase } from './supabase.js';

// Asegurar que las variables de entorno estén cargadas
dotenv.config();

/**
 * Servicio para consumir el catálogo de Bibliometro
 * 
 * Estrategia:
 * 1. Intenta usar Supabase (si está configurado)
 * 2. Fallback a API directa (si Bibliometro la publica)
 * 3. Fallback a catálogo local vacío con mensaje
 */

const BIBLIOMETRO_CATALOG_URL = process.env.BIBLIOMETRO_API_URL || null;
const HAS_SUPABASE = !!(process.env.SUPABASE_URL && process.env.SUPABASE_KEY);

// Debug: verificar configuración
console.log(`[Bibliometro] HAS_SUPABASE=${HAS_SUPABASE}`);

/**
 * Busca libros en el catálogo de Bibliometro (vía Supabase)
 * @param {string} query - Término de búsqueda (título, autor, etc.)
 * @returns {Promise<Array>} Lista de libros encontrados
 */
export async function searchBooks(query) {
  try {
    // Prioridad 1: Supabase
    if (HAS_SUPABASE) {
      console.log(`[Bibliometro] Búsqueda en Supabase: "${query}"`);

      const { data, error } = await supabase
        .from('books')
        .select('*')
        .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
        .limit(50);

      if (error) throw error;

      console.log(`[Bibliometro] Resultado Supabase:`, { count: data?.length || 0 });
      return {
        success: true,
        books: data || []
      };
    }

    // Prioridad 2: API directa de Bibliometro (si está disponible)
    if (BIBLIOMETRO_CATALOG_URL) {
      const response = await axios.get(`${BIBLIOMETRO_CATALOG_URL}/search`, {
        params: { q: query },
        timeout: 5000,
      });
      return response.data;
    }

    // Fallback: Retornar estructura vacía
    console.log(`[Bibliometro] Búsqueda: "${query}" - Supabase no configurado`);
    return {
      success: true,
      message: 'Catálogo de Bibliometro - Configura Supabase para usar catálogo completo',
      books: [],
      note: 'Para usar catálogo completo: 1) Scrape, 2) Sube a Supabase, 3) Configura credenciales en .env'
    };
  } catch (error) {
    console.error('Error buscando en Bibliometro:', error.message);
    return {
      success: false,
      error: error.message,
      books: []
    };
  }
}

/**
 * Obtiene el catálogo completo de Bibliometro (paginado)
 * @param {number} page - Número de página
 * @param {number} limit - Cantidad de resultados por página
 * @returns {Promise<Object>} Catálogo paginado
 */
export async function getCatalog(page = 1, limit = 50) {
  try {
    // Prioridad 1: Supabase
    if (HAS_SUPABASE) {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, count, error } = await supabase
        .from('books')
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('title', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        books: data,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      };
    }

    // Prioridad 2: API directa
    if (BIBLIOMETRO_CATALOG_URL) {
      const response = await axios.get(`${BIBLIOMETRO_CATALOG_URL}/catalog`, {
        params: { page, limit },
        timeout: 10000,
      });
      return response.data;
    }

    // Fallback
    return {
      success: true,
      books: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0
      },
      note: 'Configura Supabase para usar catálogo completo de Bibliometro'
    };
  } catch (error) {
    console.error('Error obteniendo catálogo:', error.message);
    return {
      success: false,
      error: error.message,
      books: [],
      pagination: { page, limit, total: 0, totalPages: 0 }
    };
  }
}

/**
 * Busca bibliotecas donde está disponible un libro
 * @param {string} bookTitle - Título del libro
 * @param {string} bookAuthor - Autor del libro
 * @returns {Promise<Array>} Lista de bibliotecas con disponibilidad
 */
export async function findLibraries(bookTitle, bookAuthor) {
  try {
    // Primero buscar el libro en el catálogo de Bibliometro
    let bookFound = false;

    if (HAS_SUPABASE) {
      // Buscar en Supabase
      const { data } = await supabase
        .from('books')
        .select('*')
        .ilike('title', `%${bookTitle}%`)
        .ilike('author', `%${bookAuthor}%`)
        .limit(1);

      if (data && data.length > 0) {
        bookFound = true;
        console.log(`[Bibliometro] Libro encontrado en Supabase: "${bookTitle}"`);
      }
    }

    // Lista de bibliotecas Bibliometro en Santiago
    const bibliometroLibraries = [
      {
        name: "Bibliometro Estación Central",
        address: "Estación Central, Santiago",
        available: bookFound, // Disponible si está en el catálogo
        distance: "2.5 km",
        phone: "+56 2 2997 8370",
        type: "bibliometro"
      },
      {
        name: "Bibliometro Baquedano",
        address: "Metro Baquedano, Santiago",
        available: bookFound,
        distance: "3.1 km",
        phone: "+56 2 2997 8367",
        type: "bibliometro"
      },
      {
        name: "Bibliometro Los Leones",
        address: "Metro Los Leones, Santiago",
        available: bookFound,
        distance: "5.0 km",
        phone: "+56 2 2997 8370",
        type: "bibliometro"
      },
      {
        name: "Bibliometro Universidad de Chile",
        address: "Metro Universidad de Chile, Santiago",
        available: bookFound,
        distance: "3.8 km",
        phone: "+56 2 2997 8367",
        type: "bibliometro"
      },
      {
        name: "Bibliometro Tobalaba",
        address: "Metro Tobalaba, Santiago",
        available: bookFound,
        distance: "4.5 km",
        phone: "+56 2 2997 8370",
        type: "bibliometro"
      },
      {
        name: "Biblioteca de Santiago",
        address: "Matucana 151, Santiago",
        available: true, // Biblioteca principal siempre disponible
        distance: "4.2 km",
        phone: "+56 2 328 2000",
        type: "biblioteca"
      },
    ];

    // Si el libro está en el catálogo, retornar bibliotecas Bibliometro disponibles
    // Si no, retornar biblioteca principal y algunas Bibliometro como "puede estar disponible"
    if (bookFound) {
      const available = bibliometroLibraries.filter(lib => lib.available);
      return available.slice(0, 5); // Top 5 disponibles
    } else {
      // Retornar biblioteca principal y algunas Bibliometro con nota
      return [
        bibliometroLibraries.find(lib => lib.type === 'biblioteca'),
        ...bibliometroLibraries.filter(lib => lib.type === 'bibliometro').slice(0, 3)
      ].filter(Boolean).map(lib => ({
        ...lib,
        note: lib.type === 'bibliometro' ? 'Verificar disponibilidad en catálogo' : undefined
      }));
    }
  } catch (error) {
    console.error('Error buscando bibliotecas:', error.message);
    // Retornar bibliotecas por defecto
    return [];
  }
}

/**
 * Obtiene información detallada de un libro específico
 * @param {string} bookId - ID del libro
 * @returns {Promise<Object>} Información del libro
 */
export async function getBookDetails(bookId) {
  try {
    if (HAS_SUPABASE) {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single();

      if (error) throw error;

      return {
        success: true,
        book: data
      };
    }

    // Prioridad 2: API directa
    if (BIBLIOMETRO_CATALOG_URL) {
      const response = await axios.get(`${BIBLIOMETRO_CATALOG_URL}/books/${bookId}`, {
        timeout: 5000,
      });
      return response.data;
    }

    return {
      success: false,
      message: 'Supabase o API de Bibliometro no configurada'
    };
  } catch (error) {
    console.error('Error obteniendo detalles del libro:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

