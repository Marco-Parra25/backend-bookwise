import cron from 'node-cron';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to python scripts
const SCRAPERS_DIR = path.join(__dirname, '..', '..', 'scrapers');
const PYTHON_CMD = process.platform === 'win32' ? 'python' : 'python3';

const runScraper = (scriptName) => {
    const scriptPath = path.join(SCRAPERS_DIR, scriptName);
    console.log(`⏰ Cron Trigger: Running ${scriptName}...`);

    const pythonProcess = spawn(PYTHON_CMD, [scriptPath]);

    pythonProcess.stdout.on('data', (data) => {
        console.log(`[${scriptName}] ${data.toString().trim()}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`[${scriptName} ERROR] ${data.toString().trim()}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`[${scriptName}] Finished with code ${code}`);
    });
};

export const initCronJobs = () => {
    console.log('🕰️  Initializing Cron Jobs...');

    // Run at 03:00 AM every day
    cron.schedule('0 3 * * *', () => {
        console.log('🌙 Starting Daily Scrapers...');
        runScraper('bibliometro.py');
        runScraper('bnc.py');
    });

    // NOTE: Uncomment next line to run immediately on server start for testing
    // setTimeout(() => { runScraper('bibliometro.py'); }, 5000);

    console.log('✅ Cron Jobs Scheduled: Daily at 03:00 AM');
};
