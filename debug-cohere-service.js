import { CohereClient } from "cohere-ai";
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.COHERE_API_KEY;
console.log(`Testing with Key: ${API_KEY ? API_KEY.substring(0, 5) + '...' : 'None'}`);

const cohere = new CohereClient({ token: API_KEY });

const mockProfile = {
    age: 25,
    goal: "entretener",
    prefersShort: false,
    difficultyMax: 5,
    tags: ["ciencia ficción", "aventura", "fantasía"]
};

// Mock simple books
const mockBooks = [
    { id: "1", title: "Dune", author: "Frank Herbert", pages: 600, difficulty: 4, tags: ["ciencia ficción", "política"] },
    { id: "2", title: "El Hobbit", author: "J.R.R. Tolkien", pages: 300, difficulty: 3, tags: ["fantasía", "aventura"] },
    { id: "3", title: "1984", author: "George Orwell", pages: 350, difficulty: 3, tags: ["ficción", "política"] }
];

async function run() {
    try {
        const prompt = `Eres un experto en recomendaciones de libros. Basándote en el siguiente perfil de lector, recomienda los mejores 2 libros de la lista proporcionada.

PERFIL DEL LECTOR:
- Edad: ${mockProfile.age}
- Gustos: ${mockProfile.tags.join(", ")}

LISTA DE LIBROS:
${mockBooks.map(b => `- ID: "${b.id}" - ${b.title}`).join("\n")}

IMPORTANTE: Responde SOLO con un JSON array válido. Estructura: [{"id": "...", "why": "...", "score": 90}]`;

        console.log("Sending prompt to Cohere (command-nightly)...");

        const response = await cohere.chat({
            model: "command-nightly",
            message: prompt,
            temperature: 0.7,
            connectors: [],
        });

        console.log("---------------- RAW RESPONSE ----------------");
        console.log(response.text);
        console.log("----------------------------------------------");

        // Test Parsing
        let cleaned = response.text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
        const jsonMatch = cleaned.match(/\[[\s\S]*\]/);

        if (jsonMatch) {
            console.log("✅ JSON Found and Parsed:");
            console.log(JSON.parse(jsonMatch[0]));
        } else {
            console.log("❌ JSON NOT FOUND in response.");
        }

    } catch (e) {
        console.log("❌ ERROR:", e);
    }
}
run();
