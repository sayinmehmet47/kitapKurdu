import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  handleAuthExpiredOnce,
  markAuthSessionActive,
  refreshAccessToken,
  resetTokenRefreshStateForTests,
} from '../tokenRefresh';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
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

describe('refreshAccessToken', () => {
  it('shares one refresh across 100 concurrent callers and all succeed', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ tokens: { accessToken: 'shared' } }));

    const results = await Promise.all(
      Array.from({ length: 100 }, () => refreshAccessToken('/api'))
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(100);
    expect(results.every((r) => r.status === 'success')).toBe(true);
    expect(sessionStorage.getItem('auth_at')).toBe('shared');
  });

  it('stores the new access token before resolving success', async () => {
    const gate = deferred<Response>();
    mockFetch.mockReturnValue(gate.promise);

    const refreshPromise = refreshAccessToken('/api');
    expect(sessionStorage.getItem('auth_at')).toBeNull();

    gate.resolve(jsonResponse({ tokens: { accessToken: 'new-token' } }));
    const result = await refreshPromise;

    expect(result).toEqual({ status: 'success' });
    expect(sessionStorage.getItem('auth_at')).toBe('new-token');
  });

  it('maps a non-OK refresh response to auth-expired without storing a token', async () => {
    mockFetch.mockResolvedValue(new Response('Unauthorized', { status: 401 }));

    const result = await refreshAccessToken('/api');

    expect(result).toEqual({ status: 'auth-expired' });
    expect(sessionStorage.getItem('auth_at')).toBeNull();
  });

  it('maps a 500 refresh response to network-error, preserving the session', async () => {
    sessionStorage.setItem('auth_at', 'at');
    sessionStorage.setItem('auth_rt', 'rt');
    mockFetch.mockResolvedValue(new Response('Server Error', { status: 500 }));

    const result = await refreshAccessToken('/api');

    expect(result).toEqual({ status: 'network-error' });
    expect(sessionStorage.getItem('auth_at')).toBe('at');
    expect(sessionStorage.getItem('auth_rt')).toBe('rt');
  });

  it('maps a rejected fetch to network-error', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

    const result = await refreshAccessToken('/api');

    expect(result).toEqual({ status: 'network-error' });
  });

  it('starts a fresh request after the in-flight one settles', async () => {
    // Return a fresh Response per call so each body can be consumed once.
    mockFetch.mockImplementation(() =>
      Promise.resolve(jsonResponse({ tokens: { accessToken: 't1' } }))
    );

    expect(await refreshAccessToken('/api')).toEqual({ status: 'success' });
    expect(await refreshAccessToken('/api')).toEqual({ status: 'success' });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('posts with credentials and the encoded refresh token query fallback', async () => {
    sessionStorage.setItem('auth_rt', 'a b&c=/');
    mockFetch.mockResolvedValue(jsonResponse({ tokens: { accessToken: 't' } }));

    await refreshAccessToken('/api');

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(`/api/user/refresh-token?rt=${encodeURIComponent('a b&c=/')}`);
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
  });
});

describe('handleAuthExpiredOnce', () => {
  it('clears both storage keys and dispatches logout once across repeated callers', () => {
    sessionStorage.setItem('auth_at', 'at');
    sessionStorage.setItem('auth_rt', 'rt');
    const dispatch = vi.fn();

    handleAuthExpiredOnce(dispatch);
    handleAuthExpiredOnce(dispatch);
    handleAuthExpiredOnce(dispatch);

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'loginSlice/logout' });
    expect(sessionStorage.getItem('auth_at')).toBeNull();
    expect(sessionStorage.getItem('auth_rt')).toBeNull();
  });

  it('re-arms the one-shot guard after a successful refresh', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ tokens: { accessToken: 'fresh' } }));
    const dispatch = vi.fn();

    handleAuthExpiredOnce(dispatch);
    expect(dispatch).toHaveBeenCalledTimes(1);

    await refreshAccessToken('/api');

    handleAuthExpiredOnce(dispatch);
    expect(dispatch).toHaveBeenCalledTimes(2);
  });

  it('re-arms the one-shot guard via markAuthSessionActive (same-tab re-login)', () => {
    sessionStorage.setItem('auth_at', 'at');
    sessionStorage.setItem('auth_rt', 'rt');
    const dispatch = vi.fn();

    handleAuthExpiredOnce(dispatch);
    expect(dispatch).toHaveBeenCalledTimes(1);

    markAuthSessionActive();

    handleAuthExpiredOnce(dispatch);
    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(sessionStorage.getItem('auth_at')).toBeNull();
    expect(sessionStorage.getItem('auth_rt')).toBeNull();
  });
});
