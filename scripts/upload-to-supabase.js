import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATALOG_path = path.join(__dirname, '..', 'bibliometro-catalog.json');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Supabase credentials missing in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function uploadCatalog() {
    try {
        if (!fs.existsSync(CATALOG_path)) {
            console.error('❌ Catalog file not found:', CATALOG_path);
            console.log('💡 Run "node scripts/scrape-bibliometro-improved.js" first');
            process.exit(1);
        }

        const catalog = JSON.parse(fs.readFileSync(CATALOG_path, 'utf-8'));
        const books = catalog.books;

        console.log(`🚀 Uploading ${books.length} books to Supabase...`);

        // Upload in batches
        const BATCH_SIZE = 100;
        for (let i = 0; i < books.length; i += BATCH_SIZE) {
            const batch = books.slice(i, i + BATCH_SIZE).map(b => ({
                id: b.id,
                title: b.title,
                author: b.author,
                source: 'bibliometro',
                url: b.url
                // imageUrl: b.imageUrl // Column likely missing or case-mismatch
            }));

            const { error } = await supabase
                .from('books')
                .upsert(batch, { onConflict: 'id' });

            if (error) {
                console.error(`❌ Error uploading batch ${i}:`, error.message);
                console.error('Full Error:', JSON.stringify(error, null, 2));
            } else {
                console.log(`✅ Batch ${Math.ceil((i + 1) / BATCH_SIZE)}/${Math.ceil(books.length / BATCH_SIZE)} uploaded`);
            }
        }

        // Update metadata if you have a metadata table, or just finish
        console.log('🎉 Upload complete!');

    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
    }
}

uploadCatalog();
