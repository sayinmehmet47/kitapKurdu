// @ts-check
import { test, expect } from '@playwright/test';

test.only('should show the books that searched', async ({ request, page }) => {
  await page.goto('/');
  // go to the search bar and type in the search term
  const searchInput = await page.getByTestId('search-input');
  await searchInput.fill('George Orwell');
  const submitButton = await page.getByText('Submit');
  await submitButton.click();
  const tableRow = await page.getByTestId('table-row').nth(0);
  await expect(tableRow).toContainText('George Orwell - Aspidistra', {
    timeout: 5000,
  });
});
