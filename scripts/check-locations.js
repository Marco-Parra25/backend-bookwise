import sequelize from '../src/config/database.js';
import Book from '../src/models/Book.js';

const checkLocations = async () => {
    try {
        await sequelize.authenticate();

        const books = await Book.findAll({
            where: { source: 'bibliometro' },
            limit: 5,
            attributes: ['title', 'locations']
        });

        console.log('🔍 Checking first 5 Bibliometro books for locations:');
        books.forEach(b => {
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
