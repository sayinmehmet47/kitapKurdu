import { Request, Response } from 'express';
import { Rating } from '../models/Rating';

export const createOrUpdateRatingController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req.user as any)?._id;
    const { bookId, rating, review } = req.body as {
      bookId: string;
      rating: number;
      review?: string;
    };

    const doc = await Rating.findOneAndUpdate(
      { bookId, userId },
      { $set: { rating, review } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, data: doc });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getBookRatingsSummaryController = async (
  req: Request,
  res: Response
) => {
  try {
    const { bookId } = req.params as { bookId: string };
    const [summary] = await Rating.aggregate([
      { $match: { bookId: new (require('mongoose').Types.ObjectId)(bookId) } },
      {
        $group: {
          _id: '$bookId',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    res
      .status(200)
      .json({ success: true, data: summary || { avgRating: 0, count: 0 } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getBookReviewsController = async (req: Request, res: Response) => {
  try {
    const { bookId } = req.params as { bookId: string };
    const reviews = await Rating.find({ bookId })
      .sort({ updatedAt: -1 })
      .limit(50)
      .populate('userId', 'username');
    res.status(200).json({ success: true, data: reviews });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
