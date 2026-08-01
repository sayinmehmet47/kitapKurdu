import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactNode, useState } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdminDuplicateAudit from '@/pages/AdminDuplicateAudit';
import authReducer, { loadUser } from '@/redux/authSlice';
import { commonApi } from '@/redux/common.api';
import type { DuplicateAuditResult } from '@/redux/services/duplicateAudit.api';

// Partial-mock the audit API only: the hooks are stubbed while the real
// commonApi reducer and middleware stay in the test store.
const apiMocks = vi.hoisted(() => {
  const state: {
    data: DuplicateAuditResult | null;
    isFetching: boolean;
    isError: boolean;
    error: unknown;
  } = { data: null, isFetching: false, isError: false, error: undefined };

  // The page only reads isLoading from the mutation hooks, so the stateful
  // stubs track just that flag.
  const markState: { isLoading: boolean } = { isLoading: false };

  const unmarkState: { isLoading: boolean } = { isLoading: false };

  // Optional rejection payload for the unmark mutation.
  const unmarkError: { error: unknown } = { error: undefined };

  return {
    trigger: vi.fn(),
    markFn: vi.fn(),
    unmarkFn: vi.fn(),
    state,
    markState,
    unmarkState,
    unmarkError,
    reset() {
      state.data = null;
      state.isFetching = false;
      state.isError = false;
      state.error = undefined;
      markState.isLoading = false;
      unmarkState.isLoading = false;
      unmarkError.error = undefined;
      apiMocks.trigger.mockClear();
      apiMocks.markFn.mockClear();
      apiMocks.unmarkFn.mockClear();
    },
  };
});

const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock('sonner', () => ({
  toast: { success: toastMocks.success, error: toastMocks.error },
}));

vi.mock('@/redux/services/duplicateAudit.api', () => ({
  // Stateful stub: trigger records its args and snapshots apiMocks.state so a
  // click alone re-renders the page with the latest result (no manual
  // same-element rerender needed).
  useLazyGetDuplicateAuditQuery: () => {
    const [result, setResult] = useState({ ...apiMocks.state });
    const trigger = (args: unknown) => {
      apiMocks.trigger(args);
      setResult({ ...apiMocks.state });
    };
    return [trigger, result];
  },
  // Mutation stubs: record their payload and resolve/reject based on the
  // configured outcome, mirroring the shape of an RTK Query mutation hook.
  useMarkDuplicateMutation: () => {
    const [result] = useState({ ...apiMocks.markState });
    const run = (args: unknown) => {
      apiMocks.markFn(args);
      return {
        unwrap: () => Promise.resolve({ canonicalId: 'b1', duplicateIds: ['b2'], updatedCount: 1 }),
      };
    };
    return [run, result];
  },
  useUnmarkDuplicateMutation: () => {
    const [result] = useState({ ...apiMocks.unmarkState });
    const run = (args: unknown) => {
      apiMocks.unmarkFn(args);
      if (apiMocks.unmarkError.error !== undefined) {
        return { unwrap: () => Promise.reject(apiMocks.unmarkError.error) };
      }
      return { unwrap: () => Promise.resolve({ duplicateIds: ['b2'], updatedCount: 1 }) };
    };
    return [run, result];
  },
}));

// Mock the Layout shell so the test stays focused on the audit page itself.
vi.mock('@/components/Layout', () => ({
  default: ({ children }: { children: ReactNode }) => <div data-testid="layout">{children}</div>,
}));

// jsdom's Blob does not implement .text(); read through FileReader instead.
const readBlobAsText = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read Blob'));
    reader.readAsText(blob);
  });

/**
 * Pull the first Blob passed to URL.createObjectURL out of a vi.fn() mock.
 * Throws an explicit error instead of silently casting `undefined` when the
 * mock was never called or was called with a non-Blob first argument.
 */
const firstObjectUrlBlob = (createObjectURL: {
  mock: { calls: ReadonlyArray<readonly unknown[]> };
}): Blob => {
  const firstCall = createObjectURL.mock.calls[0];
  const firstArg = firstCall?.[0];
  if (!(firstArg instanceof Blob)) {
    throw new Error('Expected URL.createObjectURL to be called with a Blob as its first argument');
  }
  return firstArg;
};

const report: DuplicateAuditResult = {
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

// Post-mark state: b2 is now soft-hidden as a duplicate of b1.
const markedReport: DuplicateAuditResult = {
  ...report,
  groups: [
    {
      ...report.groups[0],
      books: [
        { ...report.groups[0].books[0], duplicateOf: null },
        { ...report.groups[0].books[1], duplicateOf: 'b1' },
      ],
    },
  ],
};

const pagedReport: DuplicateAuditResult = { ...report, totalGroups: 45 };
const pagedReportPage2: DuplicateAuditResult = { ...pagedReport, page: 2 };

function createTestStore(isAdmin: boolean) {
  const store = configureStore({
    reducer: {
      [commonApi.reducerPath]: commonApi.reducer,
      authSlice: authReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(commonApi.middleware),
  });
  store.dispatch(
    loadUser({
      user: {
        id: 'user-1',
        username: isAdmin ? 'admin' : 'user',
        email: isAdmin ? 'admin@example.com' : 'user@example.com',
        isAdmin,
      },
    })
  );
  return store;
}

function renderAudit(isAdmin = true) {
  const store = createTestStore(isAdmin);
  const ui = (
    <Provider store={store}>
      <MemoryRouter initialEntries={['/admin/duplicate-audit']}>
        <Routes>
          <Route path="/" element={<div>Home Page</div>} />
          <Route path="/admin/duplicate-audit" element={<AdminDuplicateAudit />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
  render(ui);
  return { store };
}

describe('AdminDuplicateAudit', () => {
  beforeEach(() => {
    apiMocks.reset();
    toastMocks.success.mockClear();
    toastMocks.error.mockClear();
  });

  afterEach(() => {
    Reflect.deleteProperty(URL, 'createObjectURL');
    Reflect.deleteProperty(URL, 'revokeObjectURL');
    vi.restoreAllMocks();
  });

  it('redirects non-admin users away without firing a request', () => {
    renderAudit(false);

    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Duplicate Audit' })).not.toBeInTheDocument();
    expect(apiMocks.trigger).not.toHaveBeenCalled();
  });

  it('does not fire a request until Run Audit is clicked', async () => {
    const user = userEvent.setup();
    renderAudit();

    expect(apiMocks.trigger).not.toHaveBeenCalled();
    expect(screen.getByText(/Run an audit to detect duplicate books/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Run Audit' }));

    expect(apiMocks.trigger).toHaveBeenCalledTimes(1);
    expect(apiMocks.trigger).toHaveBeenCalledWith({ type: 'url', page: 1, limit: 20 });
  });

  it('renders summary cards and the grouped table after running', async () => {
    const user = userEvent.setup();
    apiMocks.state.data = report;
    renderAudit();

    await user.click(screen.getByRole('button', { name: 'Run Audit' }));

    expect(screen.getByTestId('summary-url')).toHaveTextContent('1');
    expect(screen.getByTestId('summary-isbn')).toHaveTextContent('0');
    expect(screen.getByTestId('summary-name-size')).toHaveTextContent('0');
    expect(screen.getByTestId('summary-title-author-language')).toHaveTextContent('0');
    expect(screen.getByTestId('summary-scanned')).toHaveTextContent('3');
    expect(screen.getByTestId('summary-total-groups')).toHaveTextContent('1');
    expect(screen.queryByTestId('truncated-warning')).not.toBeInTheDocument();

    // Each group is its own card with a canonical/duplicate selection row and
    // a status cell; the group key and confidence live in the card header.
    const group = screen.getByTestId('group-a1b2c3d4e5f60718');
    expect(within(group).getByText('a1b2c3d4e5f60718')).toBeInTheDocument();
    expect(within(group).getByText('exact', { exact: true })).toBeInTheDocument();
    expect(within(group).getByText('Alpha')).toBeInTheDocument();
    expect(within(group).getByText('Küçük Prens, "Ciltli"')).toBeInTheDocument();

    const table = within(group).getByRole('table');
    expect(within(table).getByRole('columnheader', { name: 'Canonical' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Duplicate' })).toBeInTheDocument();
  });

  it('defaults the canonical to the first unmarked book and supports switching', async () => {
    const user = userEvent.setup();
    apiMocks.state.data = report;
    renderAudit();

    await user.click(screen.getByRole('button', { name: 'Run Audit' }));

    const alphaRadio = screen.getByRole('radio', { name: 'Set Alpha as canonical' });
    const prensRadio = screen.getByRole('radio', {
      name: 'Set Küçük Prens, "Ciltli" as canonical',
    });
    expect(alphaRadio).toBeChecked();
    expect(prensRadio).not.toBeChecked();

    // The canonical book cannot also be selected as a duplicate.
    expect(screen.getByRole('checkbox', { name: 'Select Alpha as duplicate' })).toBeDisabled();
    expect(
      screen.getByRole('checkbox', { name: 'Select Küçük Prens, "Ciltli" as duplicate' })
    ).toBeEnabled();

    await user.click(prensRadio);

    expect(prensRadio).toBeChecked();
    expect(alphaRadio).not.toBeChecked();
    // Alpha can now be selected as a duplicate instead.
    expect(screen.getByRole('checkbox', { name: 'Select Alpha as duplicate' })).toBeEnabled();
    expect(
      screen.getByRole('checkbox', { name: 'Select Küçük Prens, "Ciltli" as duplicate' })
    ).toBeDisabled();
  });

  it('sends the canonical and selected duplicates to the mark mutation after confirmation', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    apiMocks.state.data = report;
    renderAudit();

    await user.click(screen.getByRole('button', { name: 'Run Audit' }));
    await user.click(
      screen.getByRole('checkbox', { name: 'Select Küçük Prens, "Ciltli" as duplicate' })
    );
    await user.click(screen.getByRole('button', { name: 'Mark duplicates' }));

    expect(apiMocks.markFn).toHaveBeenCalledTimes(1);
    expect(apiMocks.markFn).toHaveBeenCalledWith({ canonicalId: 'b1', duplicateIds: ['b2'] });
    expect(toastMocks.success).toHaveBeenCalledWith('Marked 1 book(s) as duplicates');

    // The current audit re-runs after a successful mutation.
    expect(apiMocks.trigger).toHaveBeenCalledTimes(2);
    expect(apiMocks.trigger).toHaveBeenLastCalledWith({ type: 'url', page: 1, limit: 20 });
  });

  it('does not fire the mark mutation when the confirm dialog is cancelled', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    apiMocks.state.data = report;
    renderAudit();

    await user.click(screen.getByRole('button', { name: 'Run Audit' }));
    await user.click(
      screen.getByRole('checkbox', { name: 'Select Küçük Prens, "Ciltli" as duplicate' })
    );
    await user.click(screen.getByRole('button', { name: 'Mark duplicates' }));

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(apiMocks.markFn).not.toHaveBeenCalled();
    expect(apiMocks.trigger).toHaveBeenCalledTimes(1);
    expect(toastMocks.success).not.toHaveBeenCalled();
  });

  it('shows a marked badge with the canonical id and undoes a single row', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    apiMocks.state.data = report;
    renderAudit();

    await user.click(screen.getByRole('button', { name: 'Run Audit' }));
    await user.click(
      screen.getByRole('checkbox', { name: 'Select Küçük Prens, "Ciltli" as duplicate' })
    );

    // The server now returns the post-mark report; the rerun after the
    // successful mutation picks it up and renders the marked badge.
    apiMocks.state.data = markedReport;
    await user.click(screen.getByRole('button', { name: 'Mark duplicates' }));

    expect(apiMocks.markFn).toHaveBeenCalledWith({ canonicalId: 'b1', duplicateIds: ['b2'] });
    const badge = screen.getByTestId('marked-b2');
    expect(badge).toHaveTextContent('Duplicate of b1');

    const undoButton = screen.getByRole('button', {
      name: 'Undo mark for Küçük Prens, "Ciltli"',
    });
    expect(undoButton).toBeEnabled();

    // Restore the unmarked report so the post-undo rerun clears the badge.
    apiMocks.state.data = report;
    await user.click(undoButton);

    expect(apiMocks.unmarkFn).toHaveBeenCalledTimes(1);
    expect(apiMocks.unmarkFn).toHaveBeenCalledWith({ duplicateIds: ['b2'] });
    expect(toastMocks.success).toHaveBeenCalledWith('Restored 1 book(s)');
    await waitFor(() => {
      expect(screen.queryByTestId('marked-b2')).not.toBeInTheDocument();
    });
  });

  it('shows an error toast and skips the rerun when undo fails', async () => {
    const user = userEvent.setup();
    apiMocks.state.data = markedReport;
    apiMocks.unmarkError.error = {
      data: { errors: [{ message: 'Undo failed' }] },
    };
    renderAudit();

    await user.click(screen.getByRole('button', { name: 'Run Audit' }));

    expect(screen.getByTestId('marked-b2')).toHaveTextContent('Duplicate of b1');

    apiMocks.trigger.mockClear();
    await user.click(screen.getByRole('button', { name: 'Undo mark for Küçük Prens, "Ciltli"' }));

    expect(apiMocks.unmarkFn).toHaveBeenCalledWith({ duplicateIds: ['b2'] });
    expect(toastMocks.error).toHaveBeenCalledWith('Undo failed');
    expect(apiMocks.trigger).not.toHaveBeenCalled();
  });

  it('disables all mark controls while a mark mutation is in flight', async () => {
    apiMocks.markState.isLoading = true;
    apiMocks.state.data = report;
    renderAudit();

    expect(screen.getByRole('button', { name: 'Run Audit' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Set Alpha as canonical' })).toBeDisabled();
    expect(
      screen.getByRole('radio', { name: 'Set Küçük Prens, "Ciltli" as canonical' })
    ).toBeDisabled();
    expect(
      screen.getByRole('checkbox', { name: 'Select Küçük Prens, "Ciltli" as duplicate' })
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Mark duplicates' })).toBeDisabled();
  });

  it('passes the next page when navigating pagination', async () => {
    const user = userEvent.setup();
    apiMocks.state.data = pagedReport;
    renderAudit();

    expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();

    apiMocks.state.data = pagedReportPage2;
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(apiMocks.trigger).toHaveBeenCalledTimes(1);
    expect(apiMocks.trigger).toHaveBeenCalledWith({ type: 'url', page: 2, limit: 20 });

    expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
  });

  it('warns when the bounded scan is incomplete', async () => {
    const user = userEvent.setup();
    apiMocks.state.data = { ...report, isTruncated: true, scannedBooks: 5000, totalBooks: 10000 };
    renderAudit();

    await user.click(screen.getByRole('button', { name: 'Run Audit' }));

    const warning = screen.getByTestId('truncated-warning');
    expect(warning).toHaveTextContent('Scan limit reached');
    expect(warning).toHaveTextContent('5,000 of 10,000 books');
  });

  it('downloads sanitized JSON and CSV exports', async () => {
    const user = userEvent.setup();
    apiMocks.state.data = report;
    renderAudit();

    const createObjectURL = vi.fn(() => 'blob:mock-download');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectURL,
    });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await user.click(screen.getByRole('button', { name: 'Download JSON' }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const jsonBlob = firstObjectUrlBlob(createObjectURL);
    const jsonText = await readBlobAsText(jsonBlob);
    const parsed = JSON.parse(jsonText) as DuplicateAuditResult;

    expect(parsed.groups[0].books[0]).toEqual({
      bookId: 'b1',
      name: 'Alpha',
      size: 100,
      author: null,
      isbn: null,
      language: 'turkish',
      duplicateOf: null,
    });
    expect(jsonText).not.toContain('uploader');
    expect(jsonText).not.toContain('email');
    expect(jsonText).not.toContain('http');

    createObjectURL.mockClear();
    clickSpy.mockClear();

    await user.click(screen.getByRole('button', { name: 'Download CSV' }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const csvBlob = firstObjectUrlBlob(createObjectURL);
    const csvText = await readBlobAsText(csvBlob);

    expect(csvText).toContain(
      'Group Key,Reason,Confidence,Count,Book ID,Name,Author,ISBN,Language,Size'
    );
    expect(csvText).toContain('"Küçük Prens, ""Ciltli"""');
    expect(csvText).toContain("'=SUM(A1)");
    expect(csvText).not.toContain('uploader');
    expect(csvText).not.toContain('email');
    expect(csvText).not.toContain('http');
  });
});
