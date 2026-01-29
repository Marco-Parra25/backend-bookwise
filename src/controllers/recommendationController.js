import Book from '../models/Book.js';
import { getAIRecommendations } from '../services/cohere.js';

import { toTagArray } from '../utils/recommendations.js';
import { Sequelize } from 'sequelize';

export const getRecommendations = async (req, res) => {
    try {
        const profile = req.body ?? {};
        const pTags = toTagArray(profile.tags);

        // --- MODO DEMO / FALLBACK DATA ---
        const MOCK_BOOKS = [
            { id: 101, title: "Cien años de soledad", author: "Gabriel García Márquez", category: "Realismo Mágico", tags: ["clásico", "latinoamericano", "épico"], description: "La historia de la familia Buendía en el pueblo ficticio de Macondo.", pages: 471, difficulty: 3, locations: [{ branch: "Baquedano", stock: 5 }, { branch: "Los Héroes", stock: 2 }] },
            { id: 102, title: "1984", author: "George Orwell", category: "Distopía", tags: ["política", "ciencia ficción", "clásico"], description: "Una visión aterradora de un mundo dominado por el Gran Hermano.", pages: 328, difficulty: 4, locations: [{ branch: "Tobalaba", stock: 0 }, { branch: "La Cisterna", stock: 3 }] },
            { id: 103, title: "El Principito", author: "Antoine de Saint-Exupéry", category: "Fábula", tags: ["infantil", "filosofía", "aventura"], description: "Un niño de un pequeño asteroide visita la Tierra y aprende sobre la vida.", pages: 96, difficulty: 1, locations: [{ branch: "Plaza de Armas", stock: 10 }] },
            { id: 104, title: "Fundación", author: "Isaac Asimov", category: "Ciencia Ficción", tags: ["espacio", "imperio", "futuro"], description: "La psicohistoria intenta salvar el conocimiento de la humanidad ante la caída del imperio galáctico.", pages: 255, difficulty: 4, locations: [{ branch: "Franklin", stock: 4 }] },
            { id: 105, title: "Rayuela", author: "Julio Cortázar", category: "Novela", tags: ["experimental", "clásico", "argentino"], description: "Una obra maestra que puede leerse en diferentes órdenes.", pages: 600, difficulty: 5, locations: [{ branch: "Santa Ana", stock: 1 }] }
        ];

        let plainBooks = [];
        if (Book.sequelize) {
            try {
                // Obtener muestra de libros de la DB (Random 100)
                const allBooks = await Book.findAll({
                    order: [Sequelize.fn('RANDOM')],
                    limit: 100
                });
                plainBooks = allBooks.map(b => b.toJSON());
            } catch (dbErr) {
                console.warn("⚠️ Error al conectar con la DB, usando datos de MODO DEMO.");
            }
        }

        if (plainBooks.length === 0) {
            console.log("ℹ️ Usando MOCK_BOOKS para MODO DEMO.");
            plainBooks = MOCK_BOOKS;
        }

        // Intentar usar Cohere AI (Solo si hay API KEY)
        let recommendations = [];
        if (process.env.COHERE_API_KEY && process.env.COHERE_API_KEY !== 'PONER_AQUI_VALOR_DE_COHERE_API_KEY') {
            try {
                recommendations = await getAIRecommendations(profile, plainBooks);
            } catch (aiErr) {
                console.warn("⚠️ Cohere falló, usando heurística local.");
            }
        }

        // --- SISTEMA DE RESILIENCIA (FALLBACK HYBRID) ---
        if (!recommendations || recommendations.length === 0) {
            console.log("⚠️ Generando recomendaciones por heurística de tags y edad.");
            recommendations = plainBooks
                .map(book => {
                    let score = 70;
                    const textToSearch = `${book.title} ${book.category || ''} ${book.description || ''} ${(book.tags || []).join(' ')}`.toLowerCase();
                    const age = Number(profile.age || 20);

                    // 1. Filtros estrictos de seguridad por edad
                    if (age < 18 && (textToSearch.includes("adulto") || textToSearch.includes("erótico") || textToSearch.includes("gore"))) {
                        score -= 100; // Excluir
                    }
                    if (age < 12 && (textToSearch.includes("filosofía") || book.difficulty > 3)) {
                        score -= 30; // Penalizar complejidad
                    }
                    if (age < 13 && (textToSearch.includes("terror psicológico") || textToSearch.includes("horror"))) {
                        score -= 50;
                    }

                    // 2. Afinidad por tags
                    pTags.forEach(tag => {
                        const t = tag.toLowerCase();
                        if (textToSearch.includes(t)) score += 5;
                        if ((book.tags || []).map(bt => bt.toLowerCase()).includes(t)) score += 10;
                    });

                    // 3. Ajuste por Guía Temática
                    if (age <= 5 && (book.category === "Infantil" || book.pages < 50)) score += 20;
                    if (age > 5 && age <= 13 && (book.category === "Juvenil" || book.category === "Fantasía")) score += 10;

                    if (book.description && book.description.length > 50) score += 2;
                    score = Math.min(99, score);

                    return { ...book, score, why: "Misión secundaria: Lectura apta para tu nivel encontrada por el Oráculo local." };
                })
                .filter(b => b.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 10);
        }

        const recommendationsWithLibraries = recommendations.map(b => ({
            ...b,
            libraries: (b.locations || []).map(loc => ({
                name: `Bibliometro ${loc.branch}`,
                address: `Estación de Metro ${loc.branch}, Santiago`,
                available: loc.stock > 0
            }))
        }));

        const xpGained = 25;

        const response = {
            recommendations: recommendationsWithLibraries.map((b) => ({
                id: b.id,
                title: b.title,
                author: b.author,
                category: b.category,
                description: b.description || b.summary,
                pages: b.pages,
                difficulty: b.difficulty,
                tags: b.tags,
                why: b.why,
                score: Math.round(b.score),
                libraries: b.libraries,
                source: Book.sequelize ? 'db' : 'demo',
                url: b.url || null,
                imageUrl: b.imageUrl || null,
            })),
            count: recommendationsWithLibraries.length,
            xpGained,
            catalogInfo: {
                totalBooks: plainBooks.length,
                mode: Book.sequelize ? 'production' : 'demo'
            }
        };

        res.status(200).json(response);

    } catch (error) {
        console.error("Error en recomendaciones:", error);
        res.status(500).json({ error: "Error al generar recomendaciones" });
    }
};
