import { zodResolver } from '@hookform/resolvers/zod';
import { Book, Calendar, Download, Eye, FileText, User } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import * as z from 'zod';
import { downloadBook } from '@/helpers/downloadBook';
import { useLazySearchBooksQuery } from '../redux/services/book.api';
import { Button, LoadingSpinner, Pagination } from './ui';
import { Badge } from './ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel } from './ui/form';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

const formSchema = z.object({
  name: z.string().max(200),
  author: z.string().max(200),
  isbn: z.string().max(32),
  publisher: z.string().max(200),
  category: z.string().max(200),
});

type SearchFormValues = z.infer<typeof formSchema>;

type SearchRequest = {
  q?: string;
  author?: string;
  isbn?: string;
  publisher?: string;
  category?: string;
  page: number;
  limit: number;
};

const SEARCH_LIMIT = 10;

const trimValue = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed || undefined;
};

const buildSearchRequest = (values: SearchFormValues, page: number): SearchRequest => {
  const request: SearchRequest = {
    page,
    limit: SEARCH_LIMIT,
  };

  const q = trimValue(values.name);
  const author = trimValue(values.author);
  const isbn = trimValue(values.isbn);
  const publisher = trimValue(values.publisher);
  const category = trimValue(values.category);

  if (q) request.q = q;
  if (author) request.author = author;
  if (isbn) request.isbn = isbn;
  if (publisher) request.publisher = publisher;
  if (category) request.category = category;

  return request;
};

const hasSearchFilters = (request: SearchRequest): boolean =>
  Boolean(request.q || request.author || request.isbn || request.publisher || request.category);

const getFiltersKey = (request: SearchRequest): string =>
  JSON.stringify({
    q: request.q,
    author: request.author,
    isbn: request.isbn,
    publisher: request.publisher,
    category: request.category,
  });

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / k ** i).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

export const Search = () => {
  const [searchBook, { data: books, isLoading, isFetching, isError }] = useLazySearchBooksQuery();
  const [page, setPage] = useState(1);
  const [hasActiveSearch, setHasActiveSearch] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamString = searchParams.toString();
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      author: '',
      isbn: '',
      publisher: '',
      category: '',
    },
  });
  const { control, getValues, handleSubmit, reset } = form;
  const watchedValues = useWatch({ control });
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingRequestRef = useRef<ReturnType<typeof searchBook> | undefined>(undefined);
  const isFormInitializedRef = useRef(false);
  const lastExecutedFiltersRef = useRef('');
  const lastWrittenSearchParamStringRef = useRef<string | undefined>(undefined);

  const cancelPendingSearch = useCallback(() => {
    if (debounceTimeoutRef.current !== undefined) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = undefined;
    }
  }, []);

  const cancelActiveRequest = useCallback(() => {
    pendingRequestRef.current?.abort?.();
    pendingRequestRef.current = undefined;
  }, []);

  const trackSearchRequest = useCallback(
    (request: SearchRequest) => {
      const requestPromise = searchBook(request);
      if (!requestPromise) {
        pendingRequestRef.current = undefined;
        return;
      }

      requestPromise.catch(() => undefined);
      pendingRequestRef.current = requestPromise;
    },
    [searchBook]
  );

  const executeSearch = useCallback(
    (values: SearchFormValues, nextPage: number) => {
      cancelPendingSearch();
      cancelActiveRequest();

      const request = buildSearchRequest(values, nextPage);
      const hasFilters = hasSearchFilters(request);
      setPage(nextPage);

      const nextParams = new URLSearchParams();
      if (hasFilters) {
        Object.entries(request).forEach(([key, value]) => {
          nextParams.set(key, String(value));
        });
      }

      const nextSearchParamString = nextParams.toString();
      lastWrittenSearchParamStringRef.current =
        nextSearchParamString === searchParamString ? undefined : nextSearchParamString;
      setSearchParams(nextParams);

      lastExecutedFiltersRef.current = getFiltersKey(request);

      if (hasFilters) {
        setHasActiveSearch(true);
        trackSearchRequest(request);
      } else {
        setHasActiveSearch(false);
      }
    },
    [
      cancelPendingSearch,
      cancelActiveRequest,
      searchParamString,
      setSearchParams,
      trackSearchRequest,
    ]
  );

  useEffect(() => {
    if (lastWrittenSearchParamStringRef.current === searchParamString) {
      lastWrittenSearchParamStringRef.current = undefined;
      isFormInitializedRef.current = true;
      return;
    }

    cancelPendingSearch();
    cancelActiveRequest();

    const currentSearchParams = new URLSearchParams(searchParamString);
    const values: SearchFormValues = {
      name: currentSearchParams.get('q') || currentSearchParams.get('name') || '',
      author: currentSearchParams.get('author') || '',
      isbn: currentSearchParams.get('isbn') || '',
      publisher: currentSearchParams.get('publisher') || '',
      category: currentSearchParams.get('category') || '',
    };
    const currentPage = Math.max(
      1,
      Number.parseInt(currentSearchParams.get('page') || '1', 10) || 1
    );
    const request = buildSearchRequest(values, currentPage);

    lastExecutedFiltersRef.current = getFiltersKey(request);
    reset(values);
    setPage(currentPage);

    if (hasSearchFilters(request)) {
      setHasActiveSearch(true);
      trackSearchRequest(request);
    } else {
      setHasActiveSearch(false);
    }

    isFormInitializedRef.current = true;
  }, [cancelActiveRequest, cancelPendingSearch, reset, searchParamString, trackSearchRequest]);

  const watchedName = watchedValues.name || '';
  const watchedAuthor = watchedValues.author || '';
  const watchedIsbn = watchedValues.isbn || '';
  const watchedPublisher = watchedValues.publisher || '';
  const watchedCategory = watchedValues.category || '';

  useEffect(() => {
    if (!isFormInitializedRef.current) return;

    const nextValues: SearchFormValues = {
      name: watchedName,
      author: watchedAuthor,
      isbn: watchedIsbn,
      publisher: watchedPublisher,
      category: watchedCategory,
    };
    const nextRequest = buildSearchRequest(nextValues, 1);
    const nextFiltersKey = getFiltersKey(nextRequest);
    const currentRequest = buildSearchRequest(getValues(), 1);

    // A URL-driven reset can run before useWatch receives the reset values.
    // Avoid scheduling a search for those transient values.
    if (getFiltersKey(currentRequest) !== nextFiltersKey) return;
    if (lastExecutedFiltersRef.current === nextFiltersKey) return;

    cancelPendingSearch();
    setHasActiveSearch(hasSearchFilters(nextRequest));

    debounceTimeoutRef.current = setTimeout(() => {
      debounceTimeoutRef.current = undefined;
      executeSearch(nextValues, 1);
    }, 300);

    return cancelPendingSearch;
  }, [
    cancelPendingSearch,
    executeSearch,
    getValues,
    watchedAuthor,
    watchedCategory,
    watchedIsbn,
    watchedName,
    watchedPublisher,
  ]);

  function onSubmit(values: SearchFormValues) {
    executeSearch(values, 1);
  }

  const handlePageChange = (newPage: number) => {
    executeSearch(getValues(), newPage);
  };

  // Calculate pagination values
  const totalBooks = books?.total || 0;
  const limit = SEARCH_LIMIT;
  const totalPages = Math.ceil(totalBooks / limit);
  const isSearchLoading = hasActiveSearch && (isLoading || isFetching);

  return (
    <div className="min-h-screen bg-gray-50/30 dark:bg-gray-950/30">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Search Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center bg-white dark:bg-gray-800 rounded-2xl px-6 py-3 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <div className="bg-primary/10 p-3 rounded-xl mr-4">
              <Book className="h-7 w-7 text-primary" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                Search Books
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">Find your next great read</p>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <Form {...form}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid grid-cols-1 md:grid-cols-2 items-end gap-4 max-w-3xl mx-auto"
            >
              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1 w-full">
                    <FormLabel>Keyword</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Search for a book, author, or keyword..."
                        {...field}
                        className="h-12 text-lg"
                        maxLength={200}
                        autoComplete="off"
                        spellCheck="false"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="author"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Author</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Filter by author"
                        {...field}
                        maxLength={200}
                        autoComplete="off"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="isbn"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>ISBN</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Filter by ISBN"
                        {...field}
                        maxLength={32}
                        autoComplete="off"
                        inputMode="numeric"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="publisher"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Publisher</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Filter by publisher"
                        {...field}
                        maxLength={200}
                        autoComplete="off"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="category"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Filter by category"
                        {...field}
                        maxLength={200}
                        autoComplete="off"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={isSearchLoading}
                size="lg"
                className="w-full md:col-span-2 md:w-auto md:justify-self-center px-8"
              >
                {isSearchLoading ? (
                  <>
                    <LoadingSpinner size={16} className="mr-2" />
                    Searching...
                  </>
                ) : (
                  'Search'
                )}
              </Button>
            </form>
          </Form>
        </div>

        {/* Search Results */}
        <div aria-live="polite">
          {isSearchLoading ? (
            <div className="flex justify-center items-center min-h-48 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <LoadingSpinner />
            </div>
          ) : hasActiveSearch && isError ? (
            <div className="flex flex-col items-center justify-center min-h-48 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <Book className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Something went wrong
                </h2>
                <p className="text-gray-600 dark:text-gray-300">Please try searching again.</p>
              </div>
            </div>
          ) : hasActiveSearch && books ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Results Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Search Results
                  </h2>
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    {totalBooks} books found
                  </Badge>
                </div>
              </div>

              {/* Results Table */}
              {books.results && books.results.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                        <TableHead className="font-semibold text-gray-900 dark:text-gray-100">
                          Book Details
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900 dark:text-gray-100 hidden sm:table-cell">
                          Author
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900 dark:text-gray-100 hidden md:table-cell">
                          Size
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900 dark:text-gray-100 hidden md:table-cell">
                          Date Added
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900 dark:text-gray-100">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {books.results.map((book) => {
                        const author = book.author?.trim() || 'Unknown';
                        const isbn = book.isbn?.trim();
                        const publisher = book.publisher?.trim();
                        const categories = [...new Set(book.category ?? [])];

                        return (
                          <TableRow
                            key={book._id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-900/50"
                          >
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                  <img
                                    src={
                                      book.url?.includes('pdf')
                                        ? book.url.replace('pdf', 'jpg')
                                        : book.imageLinks?.thumbnail ||
                                          'https://images.pexels.com/photos/8594539/pexels-photo-8594539.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
                                    }
                                    alt={book.name}
                                    className="h-12 w-8 object-cover rounded"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                                    {book.name}
                                  </p>
                                  <div className="mt-1 flex flex-wrap gap-1 hidden md:flex">
                                    {book.language && (
                                      <Badge variant="secondary" className="text-xs">
                                        {book.language}
                                      </Badge>
                                    )}
                                    {categories.length > 0 &&
                                      categories.map((category, index) => {
                                        const variants = [
                                          'default',
                                          'success',
                                          'info',
                                          'warning',
                                        ] as const;
                                        const variant = variants[index % 4];
                                        return (
                                          <Badge
                                            key={category}
                                            variant={variant}
                                            className="text-xs max-w-24 truncate"
                                          >
                                            {category}
                                          </Badge>
                                        );
                                      })}
                                  </div>
                                  {(publisher || isbn) && (
                                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                      {publisher && <span>Publisher: {publisher}</span>}
                                      {isbn && (
                                        <span className={publisher ? 'ml-2' : undefined}>
                                          ISBN: {isbn}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 sm:hidden">
                                    {author} • {formatFileSize(book.size)} • {formatDate(book.date)}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <User className="h-4 w-4 mr-1" />
                                {author}
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <FileText className="h-4 w-4 mr-1" />
                                {formatFileSize(book.size)}
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatDate(book.date)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button asChild variant="outline" size="sm">
                                  <Link to={`/book/${book._id}`}>
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Link>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadBook(book.url, book.name)}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                      <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        className="justify-center"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16">
                  <Book className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No books found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Try searching with different keywords.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-sm border border-gray-200 dark:border-gray-700 max-w-md mx-auto">
                <Book className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Start Your Search
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Enter a book title, author name, or keyword to find your next great read.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
