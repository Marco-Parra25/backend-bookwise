import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
console.log(`Key: ${API_KEY?.substring(0, 5)}...`);

async function run() {
    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        await model.generateContent("Hi");
        console.log("SUCCESS");
    } catch (e) {
        console.log("ERROR:", e.message);
    }
}
run();
