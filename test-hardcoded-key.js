import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyDU_8uhArC-sv-wPhydBPL8hsHaz2b3nv0";
console.log("Testing Key:", API_KEY.substring(0, 10));

async function run() {
    const genAI = new GoogleGenerativeAI(API_KEY);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        await model.generateContent("Hello");
        console.log("SUCCESS FLASH");
    } catch (e) {
        console.log("---------------- ERROR ----------------");
        console.log(e.toString());
        console.log("---------------------------------------");
    }
}
run();
