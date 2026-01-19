import express from 'express';
import { getRecommendations } from '../controllers/recommendationController.js';

const router = express.Router();

// Define routes mapped to controller methods
router.post('/', getRecommendations);

export default router;
