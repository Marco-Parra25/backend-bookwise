import sequelize from '../src/config/database.js';
import Book from '../src/models/Book.js';

const countBooks = async () => {
    try {
        await sequelize.authenticate();

        // Count total
        const total = await Book.count();

        // Count by source
        const bibliometro = await Book.count({ where: { source: 'bibliometro' } });
        const bnc = await Book.count({ where: { source: 'biblioteca_nacional' } });
        const others = total - bibliometro - bnc;

        console.log(`📊 Total Books: ${total}`);
        console.log(`🔹 Bibliometro: ${bibliometro}`);
        console.log(`🔸 Biblioteca Nacional: ${bnc}`);
        if (others > 0) console.log(`▫️ Others: ${others}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error counting:', error);
        process.exit(1);
    }
};

countBooks();
