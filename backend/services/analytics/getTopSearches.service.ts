import { Request } from 'express';
import { SearchAnalytics } from '../../models/SearchAnalytics';
import { apiResponse } from '../../utils/apiResponse.utils';

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';

/**
 * Get the start of the current week (Monday)
 */
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get the end of the current week (Sunday)
 */
const getWeekEnd = (date: Date): Date => {
  const weekStart = getWeekStart(date);
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Get the start of the current month
 */
const getMonthStart = (date: Date): Date => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get the end of the current month
 */
const getMonthEnd = (date: Date): Date => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Get the start of the current year
 */
const getYearStart = (date: Date): Date => {
  const d = new Date(date);
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get the end of the current year
 */
const getYearEnd = (date: Date): Date => {
  const d = new Date(date);
  d.setMonth(11, 31);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Get the start of today
 */
const getDayStart = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get the end of today
 */
const getDayEnd = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const getTopSearchesService = async (req: Request) => {
  try {
    const period = (req.query.period as PeriodType) || 'weekly';
    const limit = parseInt(String(req.query.limit)) || 20;
    const now = new Date();

    let periodStart: Date;
    let periodEnd: Date;
    let dbPeriod: 'daily' | 'weekly' | 'monthly' | 'yearly';

    switch (period) {
      case 'daily':
        periodStart = getDayStart(now);
        periodEnd = getDayEnd(now);
        dbPeriod = 'daily';
        break;
      case 'weekly':
        periodStart = getWeekStart(now);
        periodEnd = getWeekEnd(now);
        dbPeriod = 'weekly';
        break;
      case 'monthly':
        periodStart = getMonthStart(now);
        periodEnd = getMonthEnd(now);
        dbPeriod = 'monthly';
        break;
      case 'yearly':
        periodStart = getYearStart(now);
        periodEnd = getYearEnd(now);
        dbPeriod = 'yearly';
        break;
      case 'all':
      default:
        // For 'all', aggregate across all yearly records
        const results = await SearchAnalytics.aggregate([
          { $match: { period: 'yearly' } },
          {
            $group: {
              _id: '$searchTerm',
              totalCount: { $sum: '$count' },
            },
          },
          { $sort: { totalCount: -1 } },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              searchTerm: '$_id',
              count: '$totalCount',
            },
          },
        ]);

        return apiResponse(200, 'success', 'Top searches retrieved', {
          period: 'all',
          periodStart: null,
          periodEnd: null,
          results,
        });
    }

    // Query for specific period
    const results = await SearchAnalytics.find({
      period: dbPeriod,
      periodStart: periodStart,
    })
      .select('searchTerm count -_id')
      .sort({ count: -1 })
      .limit(limit)
      .lean();

    return apiResponse(200, 'success', 'Top searches retrieved', {
      period,
      periodStart: periodStart.toISOString().split('T')[0],
      periodEnd: periodEnd.toISOString().split('T')[0],
      results,
    });
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message);
    } else {
      throw new Error(String(err));
    }
  }
};

export { getTopSearchesService };
