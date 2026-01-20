import { CohereClient } from "cohere-ai";

const COHERE_API_KEY = process.env.COHERE_API_KEY || "";
let cohere = null;

/**
 * Obtiene recomendaciones usando Cohere AI
 * @param {Object} profile - Perfil del usuario
 * @param {Array} books - Lista de libros disponibles
 * @returns {Promise<Array>} Lista de recomendaciones
 */
export async function getAIRecommendations(profile, books) {
    // Lazy initialization to ensure env vars are loaded
    if (!cohere && process.env.COHERE_API_KEY) {
        cohere = new CohereClient({
            token: process.env.COHERE_API_KEY,
        });
    }

    if (!cohere) {
        console.warn("Cohere API Key missing");
        return { error: "Falta la API Key de Cohere en el servidor." };
    }

    try {
        const prompt = `Eres un experto en recomendaciones de libros. Basándote en el siguiente perfil de lector, recomienda los mejores 10 libros de la lista proporcionada.

PERFIL DEL LECTOR:
- Edad: ${profile.age} años
- Objetivo: ${profile.goal}
- Preferencia de longitud: ${profile.prefersShort ? "libros cortos" : "cualquier longitud"}
- Dificultad máxima: ${profile.difficultyMax}/5
- Gustos (tags): ${profile.tags.join(", ")}

LISTA DE LIBROS DISPONIBLES:
${books.sort(() => 0.5 - Math.random()).slice(0, 35).map((b, i) => `${i + 1}. ID: "${b.id}" - "${b.title}" por ${b.author} - ${b.pages} páginas, dificultad ${b.difficulty}/5, tags: ${b.tags.join(", ")}`).join("\n")}

IMPORTANTE: Responde SOLO con un JSON array válido.
NO escribas introducciones.
NO uses bloques de código markdown (\`\`\`json).
Solo el array crudo.

EJEMPLO DE RESPUESTA EXACTA:
[
  {
    "id": "libro-123",
    "why": "Este título encaja perfecto con tu gusto por la aventura.",
    "score": 95
  },
  {
    "id": "libro-456",
    "why": "Es corto y emocionante, ideal para tu edad.",
    "score": 88
  }
]

GENERAR RESPUESTA AHORA:`;

        const response = await cohere.chat({
            model: "command-r-plus",
            message: prompt,
            temperature: 0.1, // Temperatura baja = más obediencia
            connectors: [],
        });

        const text = response.text;

        const parsed = parseCohereResponse(text, books);
        if (!parsed) {
            console.log("⚠️ Cohere parsing failed (returned null)");
            console.log("RAW RESPONSE:", text); // Log raw text for debugging
        } else {
            console.log(`✅ Cohere returned ${parsed.length} recs`);
        }

        return parsed;

    } catch (error) {
        console.error("❌ Error CRÍTICO con Cohere AI:", error);
        return null;
    }
}

function parseCohereResponse(text, books) {
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
        console.warn("Error parsing Cohere JSON:", e.message);
        return null;
    }
}
