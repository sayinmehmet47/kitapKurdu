import { test, expect } from '@playwright/test';
import { interceptUnauthenticatedAuth } from './fixtures/auth.fixture';
import { blockExternalRequests } from './fixtures/external-block.fixture';

test.describe('Protected route', () => {
  test.beforeEach(async ({ page }) => {
    await interceptUnauthenticatedAuth(page);
    await blockExternalRequests(page);
  });

  test('redirects unauthenticated user from /profile to /login', async ({
    page,
  }) => {
    await page.goto('/profile');
    await page.waitForURL('**/login');

    await expect(
      page.getByRole('heading', { name: 'Welcome' })
    ).toBeVisible();

    await expect(
      page.getByPlaceholder('Enter your username or email')
    ).toBeVisible();

    await expect(
      page.getByPlaceholder('Enter your password')
    ).toBeVisible();
  });
});
