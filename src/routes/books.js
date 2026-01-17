import express from 'express';
import { getBooks, searchBooksController, getBookById, batchCreateBooks } from '../controllers/bookController.js';

const router = express.Router();

// Define routes mapped to controller methods
router.get('/', getBooks);
router.get('/search', searchBooksController);
router.post('/batch', batchCreateBooks); // New endpoint for scrapers
router.get('/:id', getBookById);

export default router;
