import type { BaseQueryApi } from '@reduxjs/toolkit/dist/query/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createBaseQueryWithReauth } from '../common.api';
import { resetTokenRefreshStateForTests } from '../tokenRefresh';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

let mockFetch: ReturnType<typeof vi.fn>;

beforeEach(() => {
  resetTokenRefreshStateForTests();
  sessionStorage.clear();
  mockFetch = vi.fn();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
  resetTokenRefreshStateForTests();
});

const unauthorized = { error: { status: 401, data: 'unauthorized' } };
const okData = { data: { ok: true } };

const makeBaseApi = (dispatch: (action: unknown) => void) =>
  ({ dispatch }) as unknown as BaseQueryApi;

describe('createBaseQueryWithReauth', () => {
  it('passes through non-401 results without refreshing', async () => {
    const fakeBaseQuery = vi.fn(async () => okData);
    const wrapper = createBaseQueryWithReauth(fakeBaseQuery);
    const dispatch = vi.fn();

    const result = await wrapper('/books', makeBaseApi(dispatch), {});

    expect(result).toEqual(okData);
    expect(fakeBaseQuery).toHaveBeenCalledTimes(1);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('runs one refresh for 100 concurrent 401s and retries each request once', async () => {
    sessionStorage.setItem('auth_rt', 'rt');
    mockFetch.mockResolvedValue(jsonResponse({ tokens: { accessToken: 'fresh-token' } }));
    const fakeBaseQuery = vi.fn(async () =>
      fakeBaseQuery.mock.calls.length <= 100 ? unauthorized : okData
    );
    const wrapper = createBaseQueryWithReauth(fakeBaseQuery);
    const dispatch = vi.fn();

    const results = await Promise.all(
      Array.from({ length: 100 }, () => wrapper('/books', makeBaseApi(dispatch), {}))
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(fakeBaseQuery).toHaveBeenCalledTimes(200);
    expect(results.every((r) => r.error === undefined)).toBe(true);
    expect(sessionStorage.getItem('auth_at')).toBe('fresh-token');
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('does not loop on retry 401 and dispatches logout exactly once', async () => {
    sessionStorage.setItem('auth_at', 'old-at');
    sessionStorage.setItem('auth_rt', 'old-rt');
    mockFetch.mockResolvedValue(jsonResponse({ tokens: { accessToken: 'fresh' } }));
    const fakeBaseQuery = vi.fn(async () => unauthorized);
    const wrapper = createBaseQueryWithReauth(fakeBaseQuery);
    const dispatch = vi.fn();

    const results = await Promise.all(
      Array.from({ length: 3 }, () => wrapper('/books', makeBaseApi(dispatch), {}))
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(fakeBaseQuery).toHaveBeenCalledTimes(6); // 3 initial + 3 retries, no loop
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'loginSlice/logout' });
    expect(sessionStorage.getItem('auth_at')).toBeNull();
    expect(sessionStorage.getItem('auth_rt')).toBeNull();
    for (const result of results) {
      expect(result.error?.status).toBe(401);
    }
  });

  it('keeps tokens and session when the refresh network call fails', async () => {
    sessionStorage.setItem('auth_at', 'at');
    sessionStorage.setItem('auth_rt', 'rt');
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));
    const fakeBaseQuery = vi.fn(async () => unauthorized);
    const wrapper = createBaseQueryWithReauth(fakeBaseQuery);
    const dispatch = vi.fn();

    const results = await Promise.all(
      Array.from({ length: 2 }, () => wrapper('/books', makeBaseApi(dispatch), {}))
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(fakeBaseQuery).toHaveBeenCalledTimes(2); // no retry after network refresh failure
    expect(dispatch).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('auth_at')).toBe('at');
    expect(sessionStorage.getItem('auth_rt')).toBe('rt');
    for (const result of results) {
      expect(result.error?.status).toBe(401);
    }
  });
});
