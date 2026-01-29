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
        const prompt = `Eres un experto en recomendaciones de libros. Tu objetivo es recomendar libros considerando SIEMPRE la edad del lector como una restricción obligatoria.

REGLAS OBLIGATORIAS DE SEGURIDAD Y ADECUACIÓN:
1. La edad define el nivel cognitivo, vocabulario y complejidad temática permitida.
2. NUNCA recomiendes libros cuyo contenido, lenguaje o temas estén sobre el nivel de desarrollo esperado para la edad.
3. Si los gustos del usuario coinciden con contenido no apropiado para su edad, DEBES:
   - Adaptar la recomendación a versiones infantiles o equivalentes.
   - Buscar alternativas del mismo tema pero aptas para su edad.
4. Prioriza seguridad emocional, comprensión lectora y desarrollo educativo acorde a la edad.
5. EVITA RECOMENDAR:
   - Filosofía compleja para menores de 12 años.
   - Terror psicológico para menores de 13 años.
   - Contenido adulto para menores de 18 años.

GUÍA TEMÁTICA POR EDAD:
- 0-5 años: Ilustrados, cuentos cortos, aprendizaje básico, historias simples y positivas.
- 6-9 años: Aventuras simples, fantasía infantil, humor, misterios muy suaves.
- 10-13 años: Fantasía juvenil, ciencia ficción ligera, misterio juvenil, historia adaptada.
- 14-17 años: Novelas juveniles completas, temas emocionales moderados, filosofía introductoria.
- 18+ años: Sin restricciones temáticas (solo según gustos).

PERFIL DEL LECTOR:
- Edad: ${profile.age} años
- Objetivo: ${profile.goal}
- Preferencia de longitud: ${profile.prefersShort ? "libros cortos" : "cualquier longitud"}
- Dificultad máxima: ${profile.difficultyMax}/5
- Gustos (tags): ${profile.tags.join(", ")}

LISTA DE LIBROS DISPONIBLES:
${books.sort(() => 0.5 - Math.random()).slice(0, 35).map((b, i) => `${i + 1}. ID: "${b.id}" - "${b.title}" por ${b.author} - ${b.pages} páginas, dificultad ${b.difficulty}/5, tags: ${b.tags.join(", ")}`).join("\n")}

IMPORTANTE: Responde SOLO con un JSON array válido.
NO escribas introducciones ni explicaciones.
NO uses bloques de código markdown (\`\`\`json).
Solo el array crudo.

EJEMPLO DE RESPUESTA:
[
  {
    "id": "libro-123",
    "why": "Este título es una versión adaptada ideal para tu edad sobre aventuras espaciales.",
    "score": 95
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
        if (!jsonMatch) {
            console.warn("⚠️ No se encontró un JSON array en la respuesta de Cohere.");
            return null;
        }

        const recommendations = JSON.parse(jsonMatch[0]);
        if (!Array.isArray(recommendations)) return null;

        const results = recommendations.map((rec) => {
            // Limpiar ID por si la IA incluyó comillas o espacios extras
            const cleanId = String(rec.id || "").replace(/["']/g, "").trim();
            const book = books.find((b) => b.id === cleanId);

            if (!book) {
                console.log(`🕵️ Hallucination check: AI returned unknown ID "${cleanId}"`);
                return null;
            }

            return {
                ...book,
                why: rec.why || `Elegido por su afinidad con tu perfil.`,
                score: Math.min(100, Math.max(70, rec.score || 80)),
            };
        }).filter(Boolean);

        return results;
    } catch (e) {
        console.warn("❌ Error parseando JSON de Cohere:", e.message);
        return null;
    }
}
