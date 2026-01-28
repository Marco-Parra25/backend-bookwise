
import 'dotenv/config';
import { Sequelize, DataTypes, Op } from 'sequelize';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

const Book = sequelize.define('Book', {
    id: { type: DataTypes.STRING, primaryKey: true },
    title: DataTypes.STRING,
    author: DataTypes.STRING,
    pages: DataTypes.INTEGER,
    difficulty: DataTypes.INTEGER,
    tags: DataTypes.ARRAY(DataTypes.STRING),
    source: DataTypes.STRING,
    url: DataTypes.STRING,
    imageUrl: DataTypes.STRING,
    locations: DataTypes.JSONB,
    category: { type: DataTypes.STRING, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true }
}, {
    tableName: 'books',
    timestamps: true
});

async function checkDB() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to DB.');

        const total = await Book.count();
        console.log(`📚 Total Books: ${total}`);

        const withCategory = await Book.count({
            where: {
                category: { [Op.ne]: null }
            }
        });
        console.log(`🏷️ Books with Category: ${withCategory}`);

        const withDescription = await Book.count({
            where: {
                description: { [Op.ne]: null }
            }
        });
        console.log(`📝 Books with Description: ${withDescription}`);

        // Show a sample
        const sample = await Book.findOne({
            where: {
                title: { [Op.iLike]: '%Aniquilación%' }
            }
        });

        if (sample) {
            console.log('\n🔎 Sample Updated Book:');
            console.log(`   Title: ${sample.title}`);
            console.log(`   Category: ${sample.category}`);
            console.log(`   Description (len): ${sample.description ? sample.description.length : 0}`);
        } else {
            console.log('\n⚠️ No books with new data found yet.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkDB();
