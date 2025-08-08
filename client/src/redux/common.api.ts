import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/dist/query/react';

// In production, ALWAYS hit the backend domain directly so cookies are sent
const prodApi =
  (process.env.REACT_APP_PROD_API as string | undefined) ||
  'https://kitapkurdu.onrender.com/api';

export const apiBaseUrl =
  process.env.NODE_ENV === 'production' ? prodApi : '/api';

export const commonApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: apiBaseUrl,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json;charset=UTF-8');
      return headers;
    },
    credentials: 'include',
  }),
  tagTypes: ['Book', 'Messages'],
  endpoints: (_) => ({}),
});
