import sequelize from '../src/config/database.js';
import Book from '../src/models/Book.js';

const debugDb = async () => {
    try {
        await sequelize.authenticate();

        const books = await Book.findAll({
            where: { source: 'bibliometro' },
            limit: 10,
            attributes: ['id', 'title', 'url', 'locations']
        });

        console.log(`🔎 Dumping first 10 books:`);
        books.forEach(b => {
            console.log(`\n📚 ${b.title}`);
            console.log(`   🔗 ${b.url}`);
            console.log(`   📍 Locations (${b.locations?.length || 0}): ${JSON.stringify(b.locations)}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

debugDb();
