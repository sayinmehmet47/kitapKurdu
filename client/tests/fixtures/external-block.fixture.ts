import type { Page } from '@playwright/test';

const BLOCKED_PATTERNS: RegExp[] = [
  /google-analytics\.com/,
  /googletagmanager\.com/,
  /kitapkurdu\.onrender\.com/,
  /images\.pexels\.com/,
  /unpkg\.com/,
  /example\.com/,
  /\/sw\.js(\?|$|#)/,
];

/**
 * Abort requests to external services that are not needed for smoke tests.
 * Uses route.fallback() so more specific API route handlers (registered
 * earlier) take precedence under Playwright's reverse registration order.
 */
export async function blockExternalRequests(page: Page) {
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (BLOCKED_PATTERNS.some((p) => p.test(url))) {
      return route.abort();
    }
    return route.fallback();
  });
}
