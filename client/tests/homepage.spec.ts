import { test, expect } from '@playwright/test';
import { interceptUnauthenticatedAuth } from './fixtures/auth.fixture';
import { blockExternalRequests } from './fixtures/external-block.fixture';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await interceptUnauthenticatedAuth(page);
    await blockExternalRequests(page);
  });

  test('renders search page with expected elements', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.ok()).toBeTruthy();

    await expect(
      page.getByRole('heading', { name: 'Search Books' })
    ).toBeVisible();

    await expect(
      page.getByPlaceholder('Search for a book, author, or keyword...')
    ).toBeVisible();

    await expect(
      page.getByRole('button', { name: 'Search' })
    ).toBeVisible();

    await expect(page.getByText('Start Your Search')).toBeVisible();
  });
});
