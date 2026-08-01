import { configureStore } from '@reduxjs/toolkit';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactNode, useState } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdminDuplicateAudit from '@/pages/AdminDuplicateAudit';
import authReducer, { loadUser } from '@/redux/authSlice';
import { commonApi } from '@/redux/common.api';
import type { DuplicateAuditResult } from '@/redux/services/duplicateAudit.api';

// Partial-mock the audit API only: the hook is stubbed while the real
// commonApi reducer and middleware stay in the test store.
const apiMocks = vi.hoisted(() => {
  const state: {
    data: DuplicateAuditResult | null;
    isFetching: boolean;
    isError: boolean;
    error: unknown;
  } = { data: null, isFetching: false, isError: false, error: undefined };

  return {
    trigger: vi.fn(),
    state,
    reset() {
      state.data = null;
      state.isFetching = false;
      state.isError = false;
      state.error = undefined;
      apiMocks.trigger.mockClear();
    },
  };
});

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

    // The group key and the confidence badge repeat once per book row inside
    // the group, so scope the queries to the table and use plural getters for
    // those duplicated values.
    const table = screen.getByRole('table');
    expect(within(table).getAllByText('a1b2c3d4e5f60718')).toHaveLength(2);
    expect(within(table).getByText('Alpha')).toBeInTheDocument();
    expect(within(table).getByText('Küçük Prens, "Ciltli"')).toBeInTheDocument();
    expect(within(table).getAllByText('exact', { exact: true })).toHaveLength(2);
    expect(within(table).getByRole('columnheader', { name: 'Group Key' })).toBeInTheDocument();
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
