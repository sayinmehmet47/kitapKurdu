import express from 'express';
import { body } from 'express-validator';
import { auth } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate-request';
import {
  createOrUpdateRatingController,
  getBookRatingsSummaryController,
  getBookReviewsController,
} from '../../controllers';

const router = express.Router();

router.post(
  '/',
  auth,
  [
    body('bookId').notEmpty().withMessage('bookId is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('rating must be 1-5'),
    body('review').optional().isString().isLength({ max: 1000 }),
  ],
  validateRequest,
  createOrUpdateRatingController
);

router.get('/summary/:bookId', getBookRatingsSummaryController);
router.get('/reviews/:bookId', getBookReviewsController);

export { router as ratingsRouter };
