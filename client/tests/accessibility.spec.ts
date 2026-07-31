import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { interceptUnauthenticatedAuth } from './fixtures/auth.fixture';
import {
  MOCK_BOOK_ID,
  MOCK_BOOK_TITLE,
  mockBook,
  mockRatingSummary,
  mockReviews,
} from './fixtures/book.fixture';
import { blockExternalRequests } from './fixtures/external-block.fixture';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function expectNoSeriousOrCriticalViolations(page: Page, pageName: string) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const violations = results.violations.filter(
    ({ impact }) => impact === 'serious' || impact === 'critical'
  );
  const failureDetails = violations
    .flatMap((violation) =>
      violation.nodes.map(
        (node) => `${violation.id} (${violation.impact}): ${node.target.join(', ')}`
      )
    )
    .join('\n');

  expect(violations, `${pageName} accessibility violations:\n${failureDetails}`).toEqual([]);
}

test.describe('Accessibility', () => {
  test('homepage has no serious or critical WCAG violations', async ({ page }) => {
    await interceptUnauthenticatedAuth(page);
    await blockExternalRequests(page);

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Search Books' })).toBeVisible();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#main-content')).toBeFocused();

    await expectNoSeriousOrCriticalViolations(page, 'Homepage');
  });

  test('login has no serious or critical WCAG violations', async ({ page }) => {
    await interceptUnauthenticatedAuth(page);
    await blockExternalRequests(page);

    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();

    await expectNoSeriousOrCriticalViolations(page, 'Login');
  });

  test('mocked book detail has no serious or critical WCAG violations', async ({ page }) => {
    await interceptUnauthenticatedAuth(page);

    // Register specific API routes before the global external block.
    await page.route(`**/api/books/getBookById/${MOCK_BOOK_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockBook),
      });
    });
    await page.route(`**/api/ratings/summary/${MOCK_BOOK_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRatingSummary),
      });
    });
    await page.route(`**/api/ratings/reviews/${MOCK_BOOK_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockReviews),
      });
    });
    await blockExternalRequests(page);

    await page.goto(`/book/${MOCK_BOOK_ID}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: MOCK_BOOK_TITLE })).toBeVisible();

    await expectNoSeriousOrCriticalViolations(page, 'Mocked book detail');
  });
});
