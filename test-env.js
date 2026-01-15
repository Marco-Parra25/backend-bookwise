import dotenv from 'dotenv';
dotenv.config();

console.log('Keys in process.env:');
Object.keys(process.env).forEach(key => {
    if (key.includes('GEMINI')) {
        console.log(`"${key}": "${process.env[key] ? 'PRESENTE' : 'FALTANTE'}"`);
    }
});

console.log('Direct check of GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Loaded' : 'Missing');
