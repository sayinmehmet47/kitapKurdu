import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/dist/query/react';

// In production, hit backend domain directly so backend cookies are sent (Chrome),
// while we also attach Bearer from sessionStorage for Safari fallback
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
      try {
        const at = sessionStorage.getItem('auth_at');
        if (at) headers.set('Authorization', `Bearer ${at}`);
      } catch {}
      return headers;
    },
    credentials: 'include',
  }),
  tagTypes: ['Book', 'Messages'],
  endpoints: (_) => ({}),
});
