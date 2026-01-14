import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

let genAI = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

/**
 * Obtiene recomendaciones usando Gemini AI
 * @param {Object} profile - Perfil del usuario
 * @param {Array} books - Lista de libros disponibles
 * @returns {Promise<Array>} Lista de recomendaciones
 */
export async function getAIRecommendations(profile, books) {
  if (!genAI) {
    return null; // Retornar null para usar fallback
  }

  try {
    // Usar gemini-1.5-flash (más rápido) o gemini-1.5-pro (más preciso)
    // gemini-pro también funciona pero es una versión anterior
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });

    const prompt = `Eres un experto en recomendaciones de libros. Basándote en el siguiente perfil de lector, recomienda los mejores 10 libros de la lista proporcionada.

PERFIL DEL LECTOR:
- Edad: ${profile.age} años
- Objetivo: ${profile.goal}
- Preferencia de longitud: ${profile.prefersShort ? "libros cortos" : "cualquier longitud"}
- Dificultad máxima: ${profile.difficultyMax}/5
- Gustos (tags): ${profile.tags.join(", ")}

LISTA DE LIBROS DISPONIBLES:
${books.map((b, i) => `${i + 1}. ID: "${b.id}" - "${b.title}" por ${b.author} - ${b.pages} páginas, dificultad ${b.difficulty}/5, tags: ${b.tags.join(", ")}`).join("\n")}

IMPORTANTE: Responde SOLO con un JSON array válido de exactamente 10 objetos. No incluyas texto adicional antes o después del JSON. Usa esta estructura exacta:
[
  {
    "id": "id_del_libro",
    "why": "explicación personalizada de por qué este libro es perfecto para este lector (2-3 oraciones)",
    "score": 85
  },
  ...
]

Ordena los libros del más recomendado (score más alto) al menos recomendado (score más bajo). Los scores deben estar entre 70 y 100.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Limpiar el texto y extraer JSON
    let cleanedText = text.trim();
    
    // Remover markdown code blocks si existen
    cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Buscar el array JSON
    const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const recommendations = JSON.parse(jsonMatch[0]);
      
      // Validar que tenemos recomendaciones
      if (!Array.isArray(recommendations) || recommendations.length === 0) {
        console.warn("Gemini retornó un array vacío o inválido");
        return null;
      }
      
      // Combinar con datos completos de los libros
      const mappedRecommendations = recommendations.map((rec) => {
        const book = books.find((b) => b.id === rec.id);
        if (!book) {
          console.warn(`Libro con ID "${rec.id}" no encontrado en el catálogo`);
          return null;
        }
        
        return {
          ...book,
          why: rec.why || `Recomendado especialmente para ti`,
          score: Math.min(100, Math.max(70, rec.score || 80)), // Asegurar score entre 70-100
        };
      }).filter(Boolean);
      
      // Asegurar que tenemos al menos algunas recomendaciones
      if (mappedRecommendations.length === 0) {
        console.warn("No se pudieron mapear las recomendaciones de Gemini");
        return null;
      }
      
      return mappedRecommendations;
    } else {
      console.warn("No se pudo extraer JSON de la respuesta de Gemini:", text.substring(0, 200));
      return null;
    }
  } catch (error) {
    console.error("Error con Gemini AI:", error.message);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    return null; // Retornar null para usar fallback
  }

  return null;
}

