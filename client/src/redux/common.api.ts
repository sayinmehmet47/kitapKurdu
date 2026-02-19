import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/dist/query/react';

// In production, hit backend domain directly so backend cookies are sent (Chrome),
// while we also attach Bearer from sessionStorage for Safari fallback
const prodApi =
  (process.env.REACT_APP_PROD_API as string | undefined) ||
  'https://kitapkurdu.onrender.com/api';
export const apiBaseUrl =
  process.env.NODE_ENV === 'production' ? prodApi : '/api';

const baseQuery = fetchBaseQuery({
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
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await baseQuery(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    // Try to refresh token
    const rt = sessionStorage.getItem('auth_rt');
    const refreshUrl = rt 
      ? `${apiBaseUrl}/user/refresh-token?rt=${encodeURIComponent(rt)}`
      : `${apiBaseUrl}/user/refresh-token`;
    
    const refreshResult = await baseQuery(
      { url: refreshUrl.replace(apiBaseUrl, ''), method: 'POST' },
      api,
      extraOptions
    );
    
    if (refreshResult.data) {
      // Refresh successful, retry original request
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Refresh failed, clear tokens and redirect to login
      sessionStorage.removeItem('auth_at');
      sessionStorage.removeItem('auth_rt');
      window.location.href = '/login';
    }
  }
  
  return result;
};

export const commonApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Book', 'Messages'],
  endpoints: (_) => ({}),
});
