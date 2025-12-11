import express from 'express';
import { isAdmin } from '../../middleware/auth';
import { getTopSearchesController } from '../../controllers/analytics.controller';

const router = express.Router();

// GET /api/analytics/top-searches?period=weekly&limit=20
// Protected: Admin only
router.get('/top-searches', isAdmin, getTopSearchesController);

export { router as analyticsRouter };
