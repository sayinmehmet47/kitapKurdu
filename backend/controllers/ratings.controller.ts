import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { NotFoundError } from '../errors/not-found-error';
import { Books } from '../models/Books';
import { Rating } from '../models/Rating';

/**
 * A soft-hidden duplicate must not expose a rating summary/reviews nor accept
 * new ratings. Both the public read routes and the authenticated write route
 * require the target book to exist and to be public (duplicateOf: null).
 */
const ensurePublicBook = async (bookId: string): Promise<void> => {
  if (!mongoose.isValidObjectId(bookId)) {
    throw new NotFoundError('Book not found');
  }
  const book = await Books.exists({ _id: bookId, duplicateOf: null });
  if (!book) {
    throw new NotFoundError('Book not found');
  }
};

export const createOrUpdateRatingController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req.user as any)?._id;
    const { bookId, rating, review } = req.body as {
      bookId: string;
      rating: number;
      review?: string;
    };

    await ensurePublicBook(bookId);

    const doc = await Rating.findOneAndUpdate(
      { bookId, userId },
      { $set: { rating, review } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

export const getBookRatingsSummaryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { bookId } = req.params as { bookId: string };

    await ensurePublicBook(bookId);

    const [summary] = await Rating.aggregate([
      { $match: { bookId: new mongoose.Types.ObjectId(bookId) } },
      {
        $group: {
          _id: '$bookId',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({ success: true, data: summary || { avgRating: 0, count: 0 } });
  } catch (err) {
    next(err);
  }
};

export const getBookReviewsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookId } = req.params as { bookId: string };

    await ensurePublicBook(bookId);

    const reviews = await Rating.find({ bookId })
      .sort({ updatedAt: -1 })
      .limit(50)
      .populate('userId', 'username');
    res.status(200).json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
};
