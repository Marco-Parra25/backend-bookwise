import sequelize from '../src/config/database.js';
import Book from '../src/models/Book.js';

async function countBooks() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        const count = await Book.count();
        console.log(`\n📊 Total books in DB: ${count}`);

        // Loop every 5 seconds to watch it grow
        setInterval(async () => {
            const newCount = await Book.count();
            const diff = newCount - count;
            console.log(`📊 Current count: ${newCount} (+${diff} since start)`);
        }, 5000);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

countBooks();
