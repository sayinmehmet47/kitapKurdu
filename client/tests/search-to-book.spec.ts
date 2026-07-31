import { expect, test } from '@playwright/test';
import { interceptUnauthenticatedAuth } from './fixtures/auth.fixture';
import {
  MOCK_BOOK_ID,
  MOCK_BOOK_TITLE,
  mockBook,
  mockRatingSummary,
  mockReviews,
  mockSearchResponse,
} from './fixtures/book.fixture';
import { blockExternalRequests } from './fixtures/external-block.fixture';

test.describe('Search to book detail flow', () => {
  test.beforeEach(async ({ page }) => {
    // Auth check always returns 401 so the app renders unauthenticated.
    await interceptUnauthenticatedAuth(page);

    // Specific API routes must be registered BEFORE the global external-block
    // catch-all so they take priority.
    await page.route('**/api/books/search**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSearchResponse),
      });
    });

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

    // Global external block LAST so it does not shadow the API routes above.
    await blockExternalRequests(page);
  });

  test('searches for a book and navigates to its detail page', async ({ page }) => {
    await page.goto('/');

    // Fill the search form and submit
    await page.getByPlaceholder('Search for a book, author, or keyword...').fill('Test');
    await page.getByRole('button', { name: 'Search' }).click();

    // Verify search results
    await expect(page.getByText('Search Results')).toBeVisible();
    await expect(page.getByText('1 books found')).toBeVisible();
    await expect(page.getByText(MOCK_BOOK_TITLE)).toBeVisible();
    const searchResultRow = page.getByRole('row').filter({ hasText: MOCK_BOOK_TITLE });
    await expect(searchResultRow.getByRole('cell').nth(1)).toContainText('Test Author');
    await expect(page.getByText('Publisher: Test Publisher')).toBeVisible();
    await expect(page.getByText('ISBN: 978-1-23456-789-0')).toBeVisible();

    // Click View to navigate to book detail
    await page.getByRole('link', { name: 'View' }).click();

    // Verify book detail page
    await expect(page).toHaveURL(`/book/${MOCK_BOOK_ID}`);
    await expect(page.getByRole('heading', { name: MOCK_BOOK_TITLE })).toBeVisible();

    // Uploader username from the fixture
    await expect(page.getByText('test-uploader')).toBeVisible();

    // Description
    await expect(page.getByText('A test book for smoke testing.')).toBeVisible();

    await expect(page.getByText('Author', { exact: true })).toBeVisible();
    await expect(page.getByText('Test Author')).toBeVisible();
    await expect(page.getByText('Publisher', { exact: true })).toBeVisible();
    await expect(page.getByText('Test Publisher')).toBeVisible();
    await expect(page.getByText('ISBN')).toBeVisible();
    await expect(page.getByText('978-1-23456-789-0')).toBeVisible();

    // Core detail and review sections
    await expect(page.getByText('Book Details')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Reviews' })).toBeVisible();

    const ratingSummary = page.getByRole('region', { name: 'Book rating summary' });
    await expect(ratingSummary).toHaveCount(1);
    await expect(
      ratingSummary.getByRole('img', {
        name: `Average rating: ${mockRatingSummary.data.avgRating} out of 5 stars`,
        exact: true,
      })
    ).toHaveCount(1);
    await expect(ratingSummary.getByRole('radiogroup')).toHaveCount(0);
  });

  test('searches books by a partial author value', async ({ page }) => {
    await page.goto('/');

    const searchRequestPromise = page.waitForRequest((request) => {
      const url = new URL(request.url());
      return (
        url.pathname.endsWith('/api/books/search') && url.searchParams.get('author') === 'Author'
      );
    });

    await page.getByLabel('Author').fill('Author');
    await page.getByRole('button', { name: 'Search' }).click();

    const searchRequest = await searchRequestPromise;
    expect(new URL(searchRequest.url()).searchParams.get('author')).toBe('Author');
    await expect(page.getByText('Search Results')).toBeVisible();
    await expect(page.getByText(MOCK_BOOK_TITLE)).toBeVisible();
    const searchResultRow = page.getByRole('row').filter({ hasText: MOCK_BOOK_TITLE });
    await expect(searchResultRow.getByRole('cell').nth(1)).toContainText('Test Author');
  });
});
