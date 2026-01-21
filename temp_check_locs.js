import sequelize from './src/config/database.js';
import Book from './src/models/Book.js';

async function check() {
    try {
        const book = await Book.findOne({
            where: sequelize.literal("locations IS NOT NULL AND jsonb_array_length(locations) > 0")
        });
        if (book) {
            console.log('LOCATIONS_STRUCTURE:');
            console.log(JSON.stringify(book.locations, null, 2));
        } else {
            console.log('NO_LOCATIONS_FOUND');
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
