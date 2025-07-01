import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/dist/query/react';

export const apiBaseUrl = '/api';

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
