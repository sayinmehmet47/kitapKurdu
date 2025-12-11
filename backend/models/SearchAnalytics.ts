import mongoose from 'mongoose';

const searchAnalyticsSchema = new mongoose.Schema(
  {
    searchTerm: {
      type: String,
      required: true,
      index: true,
    },
    count: {
      type: Number,
      default: 1,
    },
    period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: true,
    },
    periodStart: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true, collection: 'search_analytics' }
);

// Compound unique index to allow upsert operations
searchAnalyticsSchema.index(
  { searchTerm: 1, period: 1, periodStart: 1 },
  { unique: true }
);

export interface ISearchAnalytics extends mongoose.Document {
  searchTerm: string;
  count: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  periodStart: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const SearchAnalytics = mongoose.model<ISearchAnalytics>(
  'SearchAnalytics',
  searchAnalyticsSchema
);
