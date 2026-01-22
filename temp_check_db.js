import sequelize from './src/config/database.js';
import Book from './src/models/Book.js';

async function check() {
    try {
        const count = await Book.count();
        console.log('TOTAL_BOOKS:', count);
        const sample = await Book.findAll({ limit: 5 });
        console.log('SAMPLE:', JSON.stringify(sample, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
