import sequelize from '../src/config/database.js';
import Book from '../src/models/Book.js';
import { Op } from 'sequelize';

const checkLocations = async () => {
    try {
        await sequelize.authenticate();

        // Find books where locations is not empty array
        // Note: JSONB query for not empty array
        const books = await Book.findAll({
            where: {
                source: 'bibliometro',
                // Simple check: get all and filter in memory for quick debug
            },
            limit: 50
        });

        const booksWithLocs = books.filter(b => b.locations && b.locations.length > 0);

        console.log(`🔎 Found ${booksWithLocs.length} books with locations out of ${books.length} checked.`);

        booksWithLocs.slice(0, 3).forEach(b => {
            console.log(`\n📖 ${b.title}`);
            console.log(`   📍 Locations: ${JSON.stringify(b.locations)}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error checking locations:', error);
        process.exit(1);
    }
};

checkLocations();
