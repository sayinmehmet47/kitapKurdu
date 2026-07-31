import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Search } from '../Search';

const { searchBook, queryState } = vi.hoisted(() => {
  const queryState = {
    data: undefined as unknown,
    isLoading: false,
    isFetching: false,
    isError: false,
  };

  return {
    searchBook: vi.fn(),
    queryState,
  };
});

vi.mock('../../redux/services/book.api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../redux/services/book.api')>();

  return {
    ...actual,
    useLazySearchBooksQuery: () => [searchBook, queryState],
  };
});

const resultWithMetadata = {
  _id: 'book-1',
  name: 'Metadata Book',
  file: 'metadata-book.pdf',
  size: 1024,
  url: 'https://example.com/metadata-book.pdf',
  date: '2024-01-15T12:00:00.000Z',
  uploader: {
    username: 'uploader-name',
    _id: 'user-1',
  },
  category: ['Fiction'],
  language: 'English',
  description: 'A book with structured metadata.',
  author: 'Metadata Author',
  isbn: '978-1-23456-789-0',
  publisher: 'Metadata Publisher',
  imageLinks: {
    smallThumbnail: 'https://example.com/small.jpg',
    thumbnail: 'https://example.com/cover.jpg',
  },
};

const renderSearch = (initialEntry = '/') =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Search />
    </MemoryRouter>
  );

describe('Search', () => {
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.useFakeTimers();
    searchBook.mockClear();
    queryState.data = undefined;
    queryState.isLoading = false;
    queryState.isFetching = false;
    queryState.isError = false;
  });

  it('submits the advanced search fields together with the keyword', async () => {
    renderSearch();

    fireEvent.change(screen.getByPlaceholderText('Search for a book, author, or keyword...'), {
      target: { value: '  Great Book  ' },
    });
    fireEvent.change(screen.getByLabelText('Author'), {
      target: { value: 'Jane Author' },
    });
    fireEvent.change(screen.getByLabelText('ISBN'), {
      target: { value: '9780000000001' },
    });
    fireEvent.change(screen.getByLabelText('Publisher'), {
      target: { value: 'Example Press' },
    });
    fireEvent.change(screen.getByLabelText('Category'), {
      target: { value: 'Fiction' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await act(async () => {});

    expect(searchBook).toHaveBeenLastCalledWith({
      q: 'Great Book',
      author: 'Jane Author',
      isbn: '9780000000001',
      publisher: 'Example Press',
      category: 'Fiction',
      page: 1,
      limit: 10,
    });
  });

  it('renders optional metadata in search results', () => {
    queryState.data = {
      results: [resultWithMetadata],
      total: 1,
      page: 1,
      next: { page: 2, limit: 10 },
      previous: { page: 0, limit: 10 },
    };

    renderSearch('/?q=Metadata');

    expect(screen.getByText('Metadata Book')).toBeInTheDocument();
    expect(screen.getByText('Metadata Author')).toBeInTheDocument();
    expect(screen.getByText('Publisher: Metadata Publisher')).toBeInTheDocument();
    expect(screen.getByText('ISBN: 978-1-23456-789-0')).toBeInTheDocument();
  });

  it('limits search fields to the backend query bounds', () => {
    renderSearch();

    expect(screen.getByPlaceholderText('Search for a book, author, or keyword...')).toHaveAttribute(
      'maxLength',
      '200'
    );
    expect(screen.getByLabelText('Author')).toHaveAttribute('maxLength', '200');
    expect(screen.getByLabelText('ISBN')).toHaveAttribute('maxLength', '32');
    expect(screen.getByLabelText('Publisher')).toHaveAttribute('maxLength', '200');
    expect(screen.getByLabelText('Category')).toHaveAttribute('maxLength', '200');
  });

  it('shows loading state while an active search is fetching', () => {
    queryState.isFetching = true;

    renderSearch('/?q=React');

    expect(screen.getByRole('button', { name: 'Searching...' })).toBeDisabled();
  });

  it('preserves the focused form value when it writes a search URL', () => {
    renderSearch();

    const authorInput = screen.getByLabelText('Author');
    authorInput.focus();
    fireEvent.change(authorInput, { target: { value: '  Jane Author  ' } });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(authorInput).toHaveValue('  Jane Author  ');
    expect(document.activeElement).toBe(authorInput);
  });

  it('fetches and resets from browser URLs instead of treating them as self-writes', () => {
    renderSearch('/?q=React&author=Jane%20Author&page=2');

    expect(screen.getByPlaceholderText('Search for a book, author, or keyword...')).toHaveValue(
      'React'
    );
    expect(screen.getByLabelText('Author')).toHaveValue('Jane Author');
    expect(searchBook).toHaveBeenCalledWith({
      q: 'React',
      author: 'Jane Author',
      page: 2,
      limit: 10,
    });
  });

  it('does not fetch the catalog for an empty advanced search', async () => {
    renderSearch();

    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await act(async () => {});

    expect(searchBook).not.toHaveBeenCalled();
    expect(screen.queryByText('Search Results')).not.toBeInTheDocument();
  });

  it('clears stale results when all filters are removed', () => {
    queryState.data = {
      results: [resultWithMetadata],
      total: 1,
      page: 1,
      next: { page: 2, limit: 10 },
      previous: { page: 0, limit: 10 },
    };
    renderSearch();

    const keywordInput = screen.getByPlaceholderText('Search for a book, author, or keyword...');
    fireEvent.change(keywordInput, { target: { value: 'React' } });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    fireEvent.change(keywordInput, { target: { value: '' } });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(searchBook).toHaveBeenCalledTimes(1);
    expect(screen.getByPlaceholderText('Search for a book, author, or keyword...')).toBeVisible();
    expect(screen.queryByText('Search Results')).not.toBeInTheDocument();
  });

  it('cancels a pending debounce when submitted immediately', async () => {
    renderSearch();

    fireEvent.change(screen.getByPlaceholderText('Search for a book, author, or keyword...'), {
      target: { value: 'React' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await act(async () => {});

    expect(searchBook).toHaveBeenCalledTimes(1);
    expect(searchBook).toHaveBeenLastCalledWith({
      q: 'React',
      page: 1,
      limit: 10,
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(searchBook).toHaveBeenCalledTimes(1);
  });

  it('cancels a pending debounce on page navigation and preserves filters', () => {
    queryState.data = {
      results: [resultWithMetadata],
      total: 21,
      page: 1,
      next: { page: 2, limit: 10 },
      previous: { page: 0, limit: 10 },
    };
    renderSearch();

    fireEvent.change(screen.getByLabelText('Author'), {
      target: { value: 'Jane Author' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(searchBook).toHaveBeenCalledTimes(1);
    expect(searchBook).toHaveBeenLastCalledWith({
      author: 'Jane Author',
      page: 2,
      limit: 10,
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(searchBook).toHaveBeenCalledTimes(1);
  });

  it('resets pagination when a filter actually changes', () => {
    queryState.data = {
      results: [resultWithMetadata],
      total: 21,
      page: 1,
      next: { page: 2, limit: 10 },
      previous: { page: 0, limit: 10 },
    };
    renderSearch();

    const authorInput = screen.getByLabelText('Author');
    fireEvent.change(authorInput, { target: { value: 'Jane Author' } });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    fireEvent.change(authorInput, { target: { value: '' } });
    fireEvent.change(authorInput, { target: { value: 'New Author' } });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(searchBook).toHaveBeenLastCalledWith({
      author: 'New Author',
      page: 1,
      limit: 10,
    });
  });

  it('debounces keyword-driven searches by about 300 milliseconds', () => {
    renderSearch();

    fireEvent.change(screen.getByPlaceholderText('Search for a book, author, or keyword...'), {
      target: { value: 'React' },
    });

    expect(searchBook).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(searchBook).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(searchBook).toHaveBeenCalledWith({
      q: 'React',
      page: 1,
      limit: 10,
    });
  });
});
