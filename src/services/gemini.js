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

  try {
    // 1. Intentar con gemini-1.5-flash
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { maxOutputTokens: 2048 }
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return parseGeminiResponse(response.text(), books);

    } catch (flashError) {
      console.warn(`⚠️ gemini-1.5-flash falló (${flashError.message.split('\n')[0]}), intentando gemini-pro...`);

      // 2. Intentar fallback a gemini-pro
      const modelPro = genAI.getGenerativeModel({ model: "gemini-pro" });
      const resultPro = await modelPro.generateContent(prompt);
      const responsePro = await resultPro.response;
      return parseGeminiResponse(responsePro.text(), books);
    }

  } catch (error) {
    console.error("❌ Fallaron todos los modelos de Gemini:", error.message);
    return null; // Retornar null para usar recomendaciones básicas
  }
}

function parseGeminiResponse(text, books) {
  let cleanedText = text.trim();
  cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

  try {
    const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;

    const recommendations = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(recommendations) || recommendations.length === 0) return null;

    return recommendations.map((rec) => {
      const book = books.find((b) => b.id === rec.id);
      if (!book) return null;
      return {
        ...book,
        why: rec.why || `Recomendado para ti`,
        score: Math.min(100, Math.max(70, rec.score || 80)),
      };
    }).filter(Boolean);
  } catch (e) {
    return null;
  }

  return null;
}

