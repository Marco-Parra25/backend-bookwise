import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Book = (sequelize.define && Object.keys(sequelize.define('temp', {})).length > 0)
    ? sequelize.define('Book', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        author: {
            type: DataTypes.STRING,
            allowNull: true
        },
        pages: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        difficulty: {
            type: DataTypes.INTEGER,
            defaultValue: 3
        },
        tags: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: []
        },
        source: {
            type: DataTypes.STRING,
            defaultValue: 'local' // 'local', 'bibliometro'
        },
        url: {
            type: DataTypes.TEXT, // URL can be long
            allowNull: true
        },
        imageUrl: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        locations: {
            type: DataTypes.JSONB, // Stores availability array e.g. [{"branch": "Baquedano", "stock": 1}]
            defaultValue: []
        },
        category: {
            type: DataTypes.STRING,
            allowNull: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        summary: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'books', // Explicit table name
        timestamps: true    // Adds createdAt and updatedAt
    })
    : { findAll: async () => [], sequelize: null };

export default Book;
