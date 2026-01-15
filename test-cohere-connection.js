import { CohereClient } from "cohere-ai";
const API_KEY = "0HKUeqRgtJWF0By1WSKNS8FEJf6K6ddPpWh6njE8";
const cohere = new CohereClient({ token: API_KEY });

async function run() {
    const models = ["command-r", "command-light", "command-nightly"];

    for (const model of models) {
        try {
            console.log(`Testing model: ${model}`);
            const response = await cohere.chat({
                model: model,
                message: "Hi",
            });
            console.log(`✅ SUCCESS ${model}:`, response.text);
            return; // Exit on first success
        } catch (e) {
            console.log(`❌ FAIL ${model}:`, e.body ? JSON.stringify(e.body) : e.message);
        }
    }
}
run();
