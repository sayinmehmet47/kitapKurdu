export type RefreshResult =
  | { status: 'success' }
  | { status: 'auth-expired' }
  | { status: 'network-error' };

const AT_KEY = 'auth_at';
const RT_KEY = 'auth_rt';

// Module-scope in-flight promise: every caller in the tab awaits exactly the
// same refresh request until it settles, then a fresh one can be started.
let inFlightRefresh: Promise<RefreshResult> | null = null;

// One-shot guard: a confirmed auth expiry clears tokens and dispatches logout
// at most once per failed session. A successful refresh (or an explicit login /
// successful load-user) re-arms it so a later expiry can log out again.
let authExpiredHandled = false;

function getRefreshToken(): string | null {
  try {
    return sessionStorage.getItem(RT_KEY);
  } catch {
    return null;
  }
}

function setAccessToken(token: string): void {
  try {
    sessionStorage.setItem(AT_KEY, token);
  } catch {
    // Storage unavailable (e.g. private mode); cookie fallback still applies.
  }
}

export function clearAuthTokens(): void {
  try {
    sessionStorage.removeItem(AT_KEY);
    sessionStorage.removeItem(RT_KEY);
  } catch {
    // Storage unavailable; nothing to clear.
  }
}

/**
 * Re-arms the one-shot auth-expiry guard. Called after a successful token
 * refresh, a successful login, and a successful load-user so a later confirmed
 * expiry can dispatch logout again (e.g. same-tab re-login or OAuth/cookie
 * sessions where no access token is persisted).
 */
export function markAuthSessionActive(): void {
  authExpiredHandled = false;
}

/**
 * Clears stored tokens and dispatches loginSlice/logout exactly once per
 * failed session. Repeated callers before the next successful refresh are
 * no-ops so concurrent 401 handling cannot double-dispatch.
 */
export function handleAuthExpiredOnce(dispatch: (action: { type: string }) => void): void {
  if (authExpiredHandled) return;
  authExpiredHandled = true;
  clearAuthTokens();
  dispatch({ type: 'loginSlice/logout' });
}

/**
 * Single-flight access-token refresh. Callers share the in-flight request; a
 * new one is only started after the previous one has settled.
 */
export function refreshAccessToken(apiBaseUrl: string): Promise<RefreshResult> {
  if (!inFlightRefresh) {
    inFlightRefresh = doRefresh(apiBaseUrl).finally(() => {
      inFlightRefresh = null;
    });
  }
  return inFlightRefresh;
}

async function doRefresh(apiBaseUrl: string): Promise<RefreshResult> {
  const rt = getRefreshToken();
  const url = rt
    ? `${apiBaseUrl}/user/refresh-token?rt=${encodeURIComponent(rt)}`
    : `${apiBaseUrl}/user/refresh-token`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    });
  } catch {
    // Network failure: keep the session and tokens; callers may retry later.
    return { status: 'network-error' };
  }

  // Only an explicit auth rejection confirms the session is dead. Any other
  // non-OK status is treated as a transient server error so the existing
  // session and tokens are preserved.
  if (response.status === 401 || response.status === 403) {
    return { status: 'auth-expired' };
  }
  if (!response.ok) {
    return { status: 'network-error' };
  }

  let body: { tokens?: { accessToken?: unknown } } | null = null;
  try {
    body = await response.json();
  } catch {
    // Malformed success body: keep the session; callers may retry later.
    return { status: 'network-error' };
  }

  const accessToken = body?.tokens?.accessToken;
  if (typeof accessToken !== 'string' || accessToken.length === 0) {
    // Missing token in a success body: keep the session; callers may retry.
    return { status: 'network-error' };
  }

  // Persist the new access token before resolving success so retried requests
  // carry it. Never log or return the token value itself.
  setAccessToken(accessToken);
  markAuthSessionActive();
  return { status: 'success' };
}

// Test-only reset so Vitest can isolate module state between suites.
export function resetTokenRefreshStateForTests(): void {
  inFlightRefresh = null;
  authExpiredHandled = false;
}
