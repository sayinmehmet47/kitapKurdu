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
          duplicateOf: null,
        },
        {
          bookId: 'b2',
          name: 'Küçük Prens, "Ciltli"',
          size: 150,
          author: '=SUM(A1)',
          isbn: '9780000000000',
          language: 'turkish',
          duplicateOf: null,
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
  let markPayloads: Array<{ canonicalId: string; duplicateIds: string[] }> = [];
  let unmarkPayloads: Array<{ duplicateIds: string[] }> = [];
  // bookId -> canonicalId for books soft-hidden by the mock mark route.
  const marked: Record<string, string> = {};

  const currentReport = () => ({
    ...MOCK_AUDIT_REPORT,
    groups: MOCK_AUDIT_REPORT.groups.map((group) => ({
      ...group,
      books: group.books.map((book) => ({
        ...book,
        duplicateOf: marked[book.bookId] ?? null,
      })),
    })),
  });

  test.beforeEach(async ({ page }) => {
    auditRequestCount = 0;
    markPayloads = [];
    unmarkPayloads = [];
    for (const key of Object.keys(marked)) {
      delete marked[key];
    }

    // Register API mocks BEFORE the global external block so they take
    // priority under Playwright's reverse registration order. The generic
    // audit route is registered before the mark/unmark routes, so the more
    // specific mutation routes win for their paths.
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
        body: JSON.stringify(currentReport()),
      });
    });

    await page.route('**/api/duplicate-audit/mark', async (route) => {
      const body = route.request().postDataJSON() as {
        canonicalId: string;
        duplicateIds: string[];
      };
      markPayloads.push(body);
      for (const duplicateId of body.duplicateIds) {
        marked[duplicateId] = body.canonicalId;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          canonicalId: body.canonicalId,
          duplicateIds: body.duplicateIds,
          updatedCount: body.duplicateIds.length,
        }),
      });
    });

    await page.route('**/api/duplicate-audit/unmark', async (route) => {
      const body = route.request().postDataJSON() as { duplicateIds: string[] };
      unmarkPayloads.push(body);
      for (const duplicateId of body.duplicateIds) {
        delete marked[duplicateId];
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          duplicateIds: body.duplicateIds,
          updatedCount: body.duplicateIds.length,
        }),
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
    await expect(table.getByRole('columnheader', { name: 'Canonical' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Duplicate' })).toBeVisible();
    await expect(table.getByText('Alpha')).toBeVisible();
    await expect(table.getByText('Küçük Prens, "Ciltli"')).toBeVisible();

    // The audit report must not leak raw http/uploader/email text into main.
    const main = page.locator('main#main-content');
    await expect(main).not.toContainText('http');
    await expect(main).not.toContainText('uploader');
    await expect(main).not.toContainText('email');
  });

  test('admin marks a duplicate and undoes it through the real page', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());

    await page.goto('/admin/duplicate-audit');
    await page.getByRole('button', { name: 'Run Audit' }).click();

    // The canonical defaults to the first unmarked book and cannot be a
    // selected duplicate itself.
    await expect(page.getByRole('radio', { name: 'Set Alpha as canonical' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'Select Alpha as duplicate' })).toBeDisabled();

    await page.getByRole('checkbox', { name: 'Select Küçük Prens, "Ciltli" as duplicate' }).check();
    await page.getByRole('button', { name: 'Mark duplicates' }).click();

    expect(markPayloads).toEqual([{ canonicalId: 'b1', duplicateIds: ['b2'] }]);

    // The refetched report marks b2 under b1 with an undo action.
    await expect(page.getByTestId('marked-b2')).toContainText('Duplicate of b1');
    await expect(
      page.getByRole('button', { name: 'Undo mark for Küçük Prens, "Ciltli"' })
    ).toBeVisible();

    await page.getByRole('button', { name: 'Undo mark for Küçük Prens, "Ciltli"' }).click();

    expect(unmarkPayloads).toEqual([{ duplicateIds: ['b2'] }]);
    await expect(page.getByTestId('marked-b2')).toHaveCount(0);
  });
});
