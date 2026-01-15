import { CohereClient } from "cohere-ai";

const API_KEY = "0HKUeqRgtJWF0By1WSKNS8FEJf6K6ddPpWh6njE8";
const cohere = new CohereClient({ token: API_KEY });

// Generate 30 dummy books to mimic the app
const books = Array.from({ length: 30 }, (_, i) => ({
    id: `book-${i}`,
    title: `Book Title ${i}`,
    author: `Author ${i}`,
    pages: 200 + i,
    difficulty: 3,
    tags: ["fiction", "adventure"]
}));

const profile = {
    age: 25,
    goal: "entertainment",
    prefersShort: false,
    difficultyMax: 5,
    tags: ["adventure"]
};

async function run() {
    try {
        const prompt = `Eres un experto... Recomienda...
PERFIL: ${JSON.stringify(profile)}
LIBROS: ${books.map(b => `- ${b.title}`).join("\n")}
JSON ONLY.`;

        console.log("Sending payload with 30 books...");
        const start = Date.now();

        const response = await cohere.chat({
            model: "command-nightly",
            message: prompt,
            temperature: 0.7,
            connectors: [],
        });

        console.log(`Time: ${(Date.now() - start) / 1000}s`);
        console.log("SUCCESS:", response.text.substring(0, 100) + "...");
    } catch (e) {
        console.log("FAILED:", e);
        if (e.body) console.log("Body:", e.body);
    }
}
run();
