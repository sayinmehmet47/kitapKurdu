import { expect, test } from '@playwright/test';
import { blockExternalRequests } from './fixtures/external-block.fixture';

const MOCK_AUDIT_REPORT = {
  type: 'url',
  summary: { url: 1, isbn: 0, 'name-size': 0, 'title-author-language': 0 },
  groups: [
    {
      key: 'a1b2c3d4e5f60718',
      type: 'url',
      confidence: 'exact',
      count: 2,
      books: [
        {
          bookId: 'b1',
          name: 'Alpha',
          size: 100,
          author: null,
          isbn: null,
          language: 'turkish',
        },
        {
          bookId: 'b2',
          name: 'Küçük Prens, "Ciltli"',
          size: 150,
          author: '=SUM(A1)',
          isbn: '9780000000000',
          language: 'turkish',
        },
      ],
    },
  ],
  totalGroups: 1,
  page: 1,
  limit: 20,
  scannedBooks: 3,
  totalBooks: 3,
  isTruncated: false,
  durationMs: 5,
};

test.describe('Duplicate audit', () => {
  let auditRequestCount = 0;

  test.beforeEach(async ({ page }) => {
    auditRequestCount = 0;

    // Register API mocks BEFORE the global external block so they take
    // priority under Playwright's reverse registration order.
    await page.route('**/api/user/auth', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'admin-1',
            username: 'admin',
            email: 'admin@kitapkurdu.test',
            isAdmin: true,
          },
        }),
      });
    });

    await page.route('**/api/duplicate-audit**', async (route) => {
      auditRequestCount += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_AUDIT_REPORT),
      });
    });

    await blockExternalRequests(page);
  });

  test('admin runs a duplicate audit and sees summary, table, and book names', async ({ page }) => {
    await page.goto('/admin/duplicate-audit');

    await expect(page.getByRole('heading', { name: 'Duplicate Audit' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Run Audit' })).toBeVisible();
    await expect(page.getByText(/No request is sent until you click Run/)).toBeVisible();
    expect(auditRequestCount).toBe(0);

    await page.getByRole('button', { name: 'Run Audit' }).click();

    // Summary cards render only after the audit request completes.
    await expect(page.getByTestId('summary-url')).toContainText('1');
    await expect(page.getByTestId('summary-isbn')).toContainText('0');
    await expect(page.getByTestId('summary-name-size')).toContainText('0');
    await expect(page.getByTestId('summary-title-author-language')).toContainText('0');
    await expect(page.getByTestId('summary-scanned')).toContainText('3');
    await expect(page.getByTestId('summary-total-groups')).toContainText('1');

    expect(auditRequestCount).toBe(1);

    const table = page.getByRole('table');
    await expect(table).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Group Key' })).toBeVisible();
    await expect(table.getByText('Alpha')).toBeVisible();
    await expect(table.getByText('Küçük Prens, "Ciltli"')).toBeVisible();

    // The audit report must not leak raw http/uploader/email text into main.
    const main = page.locator('main#main-content');
    await expect(main).not.toContainText('http');
    await expect(main).not.toContainText('uploader');
    await expect(main).not.toContainText('email');
  });
});
