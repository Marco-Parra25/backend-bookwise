import Book from '../models/Book.js';
import { Op } from 'sequelize';

export const getBooks = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        const search = req.query.search;

        const whereClause = {};
        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.iLike]: `%${search}%` } },
                { author: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const { count, rows } = await Book.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [['title', 'ASC']]
        });

        res.json({
            success: true,
            books: rows,
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        console.error('Error in getBooks:', error);
        res.status(500).json({ error: 'Error al obtener libros' });
    }
};

export const searchBooksController = async (req, res) => {
    try {
        const query = req.query.q || req.query.query || '';
        if (!query) {
            return res.status(400).json({ error: 'Query parameter is required' });
        }

        const books = await Book.findAll({
            where: {
                [Op.or]: [
                    { title: { [Op.iLike]: `%${query}%` } },
                    { author: { [Op.iLike]: `%${query}%` } }
                ]
            },
            limit: 50
        });

        res.json({
            success: true,
            books: books
        });

    } catch (error) {
        console.error('Error in searchBooks:', error);
        res.status(500).json({ error: 'Error al buscar libros' });
    }
};

export const getBookById = async (req, res) => {
    try {
        const { id } = req.params;
        const book = await Book.findByPk(id);

        if (!book) {
            return res.status(404).json({ success: false, message: 'Libro no encontrado' });
        }

        res.json({
            success: true,
            book,
            source: book.source || 'db'
        });

    } catch (error) {
        console.error('Error in getBookById:', error);
        res.status(500).json({ error: 'Error al obtener libro' });
    }
};
