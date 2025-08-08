import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Books',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: { type: Number, min: 1, max: 5, required: true },
    review: { type: String, default: '' },
  },
  { timestamps: true }
);

ratingSchema.index({ bookId: 1, userId: 1 }, { unique: true });

export interface IRating extends mongoose.Document {
  bookId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  rating: number;
  review?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const Rating = mongoose.model<IRating>('Rating', ratingSchema);
