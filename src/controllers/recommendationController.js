import Book from '../models/Book.js';
import { getAIRecommendations } from '../services/cohere.js';

import { toTagArray } from '../utils/recommendations.js';
import { Sequelize } from 'sequelize';

export const getRecommendations = async (req, res) => {
    try {
        const profile = req.body ?? {};
        const pTags = toTagArray(profile.tags);

        if (pTags.length === 0) {
            return res.status(400).json({ error: "Profile must include at least 1 tag." });
        }

        // Obtener muestra de libros de la DB (Random 100)
        // Sequelize random is db-specific. For Postgres: EXPECT RANDOM()
        const allBooks = await Book.findAll({
            order: [Sequelize.fn('RANDOM')],
            limit: 100
        });

        // Convert Sequelize instances to plain objects
        const plainBooks = allBooks.map(b => b.toJSON());

        if (plainBooks.length === 0) {
            console.log("⚠️ DB vacía, no hay libros para recomendar.");
            // Podríamos cargar fallback data.json si quisiéramos, pero por ahora estricto DB.
        }

        // Intentar usar Cohere AI (MODO ESTRICTO: Solo IA)
        let recommendations = await getAIRecommendations(profile, plainBooks);

        // --- SISTEMA DE RESILIENCIA (FALLBACK) ---
        if (!recommendations || recommendations.length === 0) {
            console.log("⚠️ AI Fallback activado: Generando recomendaciones por heurística de tags.");
            recommendations = plainBooks
                .map(book => {
                    const matchCount = (book.tags || []).filter(t => pTags.includes(t.toLowerCase())).length;
                    return { ...book, score: 70 + (matchCount * 5), why: "Recomendado basado en tus etiquetas preferidas." };
                })
                .sort((a, b) => b.score - a.score)
                .slice(0, 10);
        }

        // Pasamos directo las recomendaciones y restauramos bibliotecas desde el campo 'locations'
        const recommendationsWithLibraries = recommendations.map(b => ({
            ...b,
            libraries: (b.locations || []).map(loc => ({
                name: `Bibliometro ${loc.branch}`,
                address: `Estación de Metro ${loc.branch}, Santiago`,
                available: loc.stock > 0
            }))
        }));

        // XP ganado
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
                source: b.source || 'db',
                url: b.url || null,
                imageUrl: b.imageUrl || null,
            })),
            count: recommendationsWithLibraries.length,
            xpGained,
            catalogInfo: {
                totalBooks: plainBooks.length,
                bibliometroEnabled: true,
            }
        };

        res.status(200).json(response);

    } catch (error) {
        console.error("Error en recomendaciones:", error);
        res.status(500).json({ error: "Error al generar recomendaciones" });
    }
};
