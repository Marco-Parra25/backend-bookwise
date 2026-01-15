import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

console.log(`Testing Gemini Key: ${API_KEY ? 'Present' : 'Missing'} (${API_KEY?.substring(0, 10)}...)`);

async function testGemini() {
    if (!API_KEY) {
        console.error("❌ No API Key found");
        return;
    }

    const genAI = new GoogleGenerativeAI(API_KEY);

    // Lista de modelos a probar
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];

    console.log("Starting model connectivity test...");

    for (const modelName of modelsToTry) {
        console.log(`\n🔎 Testing model: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello, just say 'OK'.");
            const response = await result.response;
            console.log(`✅ SUCCESS with ${modelName}!`);
            console.log(`Response: ${response.text().trim()}`);
            return; // Stop after first success
        } catch (e) {
            console.log(`❌ Failed with ${modelName}:`);
            // Extract specific error message
            const msg = e.message.split('\n')[0];
            console.log(`   Error: ${msg}`);
        }
    }

    console.log("\n❌ All models failed. Please check your API Key and Project permissions.");
}

testGemini();
