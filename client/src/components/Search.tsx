import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useLazySearchBooksQuery } from '../redux/services/book.api';
import { Input } from './ui/input';
import { Form, FormControl, FormField, FormItem } from './ui/form';
import { Button, LoadingSpinner, Pagination } from './ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Badge } from './ui/badge';
import { Book, Eye, Download, User, Calendar, FileText } from 'lucide-react';
import { downloadBook } from '@/helpers/downloadBook';

const formSchema = z.object({
  name: z.string().min(2).max(50),
});

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

export const Search = () => {
  const [searchBook, { data: books, isLoading, isError }] =
    useLazySearchBooksQuery();
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const bookName = searchParams.get('name');
  const bookPage = searchParams.get('page');

  const { setValue, getValues, control, handleSubmit, ...form } = useForm<
    z.infer<typeof formSchema>
  >({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newPage = 1;
    setPage(newPage);
    setSearchParams({ name: values.name, page: newPage.toString() });
    searchBook({ name: values.name, page: newPage });
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const currentName = getValues('name');
    if (currentName) {
      setSearchParams({ name: currentName, page: newPage.toString() });
      searchBook({ name: currentName, page: newPage });
    }
  };

  useEffect(() => {
    if (bookName) {
      setValue('name', bookName);
      const currentPage = parseInt(bookPage ?? '1');
      setPage(currentPage);
      searchBook({ name: bookName, page: currentPage });
    }
  }, [bookName, bookPage, setValue, searchBook]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <Book className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Please try searching again.
          </p>
        </div>
      </div>
    );
  }

  // Calculate pagination values
  const totalBooks = books?.total || 0;
  const limit = 10; // This should match the backend limit
  const totalPages = Math.ceil(totalBooks / limit);

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
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Find your next great read
              </p>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <Form
            {...form}
            setValue={setValue}
            getValues={getValues}
            control={control}
            handleSubmit={handleSubmit}
          >
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col md:flex-row items-center gap-4 max-w-2xl mx-auto"
            >
              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1 w-full">
                    <FormControl>
                      <Input
                        placeholder="Search for a book, author, or keyword..."
                        {...field}
                        className="h-12 text-lg"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={isLoading}
                size="lg"
                className="w-full md:w-auto px-8"
              >
                {isLoading ? (
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
        {books && (
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
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100">
                        Author
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100">
                        Size
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100">
                        Date Added
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {books.results.map((book: any) => (
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
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {book.name}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {book.language && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {book.language}
                                  </Badge>
                                )}
                                {book.category &&
                                  book.category.length > 0 &&
                                  book.category.map((category, index) => (
                                    <Badge
                                      key={index}
                                      variant={
                                        index % 4 === 0
                                          ? 'default'
                                          : index % 4 === 1
                                          ? 'success'
                                          : index % 4 === 2
                                          ? 'info'
                                          : 'warning'
                                      }
                                      className="text-xs max-w-24 truncate"
                                    >
                                      {category}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <User className="h-4 w-4 mr-1" />
                            {book.uploader?.username || 'Unknown'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <FileText className="h-4 w-4 mr-1" />
                            {formatFileSize(book.size)}
                          </div>
                        </TableCell>
                        <TableCell>
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
                    ))}
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
        )}

        {/* Empty State */}
        {!books && (
          <div className="text-center py-16">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-sm border border-gray-200 dark:border-gray-700 max-w-md mx-auto">
              <Book className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Start Your Search
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Enter a book title, author name, or keyword to find your next
                great read.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
