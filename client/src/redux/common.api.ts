import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/dist/query/react';

export const apiBaseUrl =
  process.env.REACT_APP_ENVIRONMENT === 'production'
    ? process.env.REACT_APP_PROD_API
    : process.env.REACT_APP_ENVIRONMENT === 'development'
    ? process.env.REACT_APP_DEV_API
    : process.env.REACT_APP_LOCAL_API;

export const commonApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: apiBaseUrl,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json;charset=UTF-8');
      const token = localStorage.getItem('jwtToken');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
    credentials: 'include',
  }),
  tagTypes: ['Book', 'Messages'],
  endpoints: (_) => ({}),
});
