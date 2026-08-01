import {
  type BaseQueryFn,
  createApi,
  type FetchArgs,
  type FetchBaseQueryError,
  fetchBaseQuery,
} from '@reduxjs/toolkit/dist/query/react';
import { handleAuthExpiredOnce, refreshAccessToken } from './tokenRefresh';

// In production, hit backend domain directly so backend cookies are sent (Chrome),
// while we also attach Bearer from sessionStorage for Safari fallback
const prodApi = (import.meta.env.VITE_PROD_API as string | undefined) || '/api';
export const apiBaseUrl = import.meta.env.PROD ? prodApi : '/api';

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

/**
 * Wraps a raw base query with single-flight token refresh. On the first 401 the
 * shared refresh runs; on success the original request is retried exactly once.
 * A second 401 or a confirmed refresh failure clears tokens and dispatches logout
 * once; a network refresh failure keeps the session intact.
 */
export const createBaseQueryWithReauth =
  (
    rawBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>
  ): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> =>
  async (args, api, extraOptions) => {
    const first = await rawBaseQuery(args, api, extraOptions);

    if (first.error?.status !== 401) {
      return first;
    }

    const refreshResult = await refreshAccessToken(apiBaseUrl);

    if (refreshResult.status === 'success') {
      // New access token is already persisted; retry the original request once.
      const retry = await rawBaseQuery(args, api, extraOptions);
      if (retry.error?.status === 401) {
        // Still unauthorized with a fresh token: confirmed auth expiry.
        handleAuthExpiredOnce(api.dispatch);
      }
      return retry;
    }

    if (refreshResult.status === 'auth-expired') {
      handleAuthExpiredOnce(api.dispatch);
    }

    // network-error: keep tokens/session and return the original error.
    return first;
  };

export const commonApi = createApi({
  reducerPath: 'api',
  baseQuery: createBaseQueryWithReauth(baseQuery),
  tagTypes: ['Book', 'Messages', 'Audit'],
  endpoints: (_) => ({}),
});
