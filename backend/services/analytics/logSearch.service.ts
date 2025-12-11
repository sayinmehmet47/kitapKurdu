import { SearchAnalytics } from '../../models/SearchAnalytics';

/**
 * Get the start of the current week (Monday)
 */
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
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
 * Get the start of the current year
 */
const getYearStart = (date: Date): Date => {
  const d = new Date(date);
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get the start of the current day
 */
const getDayStart = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Log a search term to analytics.
 * This is fire-and-forget - errors are logged but don't block the search response.
 */
export const logSearchAnalytics = (searchTerm: string): void => {
  if (!searchTerm || searchTerm.trim().length < 2) {
    return;
  }

  const normalizedTerm = searchTerm.trim().toLowerCase();
  const now = new Date();

  const periods: Array<{
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    periodStart: Date;
  }> = [
    { period: 'daily', periodStart: getDayStart(now) },
    { period: 'weekly', periodStart: getWeekStart(now) },
    { period: 'monthly', periodStart: getMonthStart(now) },
    { period: 'yearly', periodStart: getYearStart(now) },
  ];

  // Fire-and-forget: don't await, just execute
  Promise.all(
    periods.map((p) =>
      SearchAnalytics.updateOne(
        {
          searchTerm: normalizedTerm,
          period: p.period,
          periodStart: p.periodStart,
        },
        {
          $inc: { count: 1 },
          $setOnInsert: {
            searchTerm: normalizedTerm,
            period: p.period,
            periodStart: p.periodStart,
          },
        },
        { upsert: true }
      )
    )
  ).catch((err) => {
    console.error('Failed to log search analytics:', err);
  });
};
