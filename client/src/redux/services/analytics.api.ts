import { commonApi } from '../common.api';

export interface SearchAnalyticsResult {
  searchTerm: string;
  count: number;
}

export interface TopSearchesResponse {
  code: number;
  status: string;
  message: string;
  data: {
    period: string;
    periodStart: string | null;
    periodEnd: string | null;
    results: SearchAnalyticsResult[];
  };
}

export const analyticsApi = commonApi.injectEndpoints({
  endpoints: (build) => ({
    getTopSearches: build.query<
      TopSearchesResponse,
      { period?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'; limit?: number }
    >({
      query: ({ period = 'weekly', limit = 20 }) => ({
        url: `/analytics/top-searches`,
        params: { period, limit },
      }),
    }),
  }),
});

export const { useGetTopSearchesQuery } = analyticsApi;
