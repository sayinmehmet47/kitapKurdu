import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/dist/query/react';

// Use absolute API URL in production to ensure auth cookies (onrender.com) are sent by the browser
export const apiBaseUrl =
  (typeof process !== 'undefined' && process.env.REACT_APP_PROD_API) || '/api';

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
