import type { Page } from '@playwright/test';

/**
 * Intercept the auth check endpoint and return 401 so the app renders
 * in an unauthenticated state without reaching a real backend.
 */
export async function interceptUnauthenticatedAuth(page: Page) {
  await page.route('**/api/user/auth', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Unauthorized' }),
    });
  });
}
