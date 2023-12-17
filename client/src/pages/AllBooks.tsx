import React, { useEffect, useState } from 'react';
import {
  Link,
  useLocation,
  useRoutes,
  useSearchParams,
} from 'react-router-dom';
import Loading from '@/components/Loading';
import {
  useDeleteBookMutation,
  useFetchAllBooksQuery,
} from '@/redux/services/book.api';
import Layout from '@/components/Layout';
import {
  Button,
  Card,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components';
import { DownloadIcon, Edit, Eye, MoreHorizontal } from 'lucide-react';
import { AiOutlineDelete } from 'react-icons/ai';
import { downloadBook } from '@/helpers/downloadBook';
import ReactGA from 'react-ga4';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { RootState } from '@/redux/store';
import { Pagination } from 'flowbite-react';

const AllBooks = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    data: bookData,
    isLoading,
    isFetching,
  } = useFetchAllBooksQuery({
    page: Number(searchParams.get('page' || 1)),
    language: searchParams.get('language') || '',
  });

  const { user, isLoggedIn } = useSelector(
    (state: RootState) => state.authSlice
  );
  const [deleteBook, { isSuccess, isError }] = useDeleteBookMutation();

  const isAdmin = isLoggedIn && user.user.isAdmin;
  const handleDelete = async ({ id }: { id: string }) => {
    deleteBook({ id }).catch((err) => {
      isError && toast.error('Something went wrong');
    });

    isSuccess && toast.success('Book deleted successfully');

    // Send event to Google Analytics
    ReactGA.event({
      category: 'Book',
      action: 'Delete',
      label: id,
    });
  };

  const handlePageChange = (page: number) => {
    searchParams.set('page', String(page));
    setSearchParams(new URLSearchParams(searchParams));

    // Send event to Google Analytics
    ReactGA.event({
      category: 'Page',
      action: 'Change',
      label: `Page ${page}`,
    });
  };

  const handleLanguageChange = (value: string) => {
    if (value === 'english') {
      searchParams.set('language', 'english');
    }
    if (value === 'turkish') {
      searchParams.set('language', 'turkish');
    }
    if (value === 'all') {
      searchParams.delete('language');
    }
    setSearchParams(new URLSearchParams(searchParams));
  };

  if (isLoading || isFetching) {
    return <Loading />;
  }

  return (
    <Layout>
      <div className="flex justify-end m-8">
        <Select
          defaultValue={searchParams.get('language') || 'all'}
          onValueChange={(value) => handleLanguageChange(value)}
        >
          <SelectTrigger className="max-w-[160px]">
            <SelectValue placeholder="Select a book language" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All Books</SelectItem>
              <SelectItem value="english">English 🏴󠁧󠁢󠁥󠁮󠁧󠁿</SelectItem>
              <SelectItem value="turkish">Turkish 🇹🇷</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="mt-5 2xl:grid-cols-4 grid xl:grid-cols-4 lg:grid-cols-3  gap-12 m-4 md:grid-cols-2 sm:grid-cols-1 w-3/4 mx-auto">
        {bookData?.results.map((book) => (
          <Link to={`/book/${book._id}`} key={book._id}>
            <Card
              className="h-full w-full p-12 pb-20 relative bg-gray-100 hover:scale-105 transform transition-all duration-300 ease-in-out shadow-lg rounded-lg"
              key={book._id}
            >
              <img
                src={
                  book.url?.includes('pdf')
                    ? book.url?.replace('pdf', 'jpg')
                    : book.imageLinks?.thumbnail ||
                      'https://images.pexels.com/photos/8594539/pexels-photo-8594539.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
                }
                className="h-full w-full rounded-t-lg object-contain"
                alt="Book Cover"
              />

              <CardTitle
                title={book.name}
                className="text-left ps-2 text-lg mt-2 text-gray-800 line-clamp-2"
              >
                {book.name}
              </CardTitle>
              <div
                data-testid="book-options"
                className="flex justify-between items-center mt-4 absolute -top-3 right-2"
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem className="cursor-pointer">
                      <Link
                        to={`/book/${book._id}`}
                        className="flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-2 " />
                        Preview
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => downloadBook(book.url, book.name)}
                    >
                      <DownloadIcon className="h-4 w-4 mr-2 " />
                      Download Book
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    {
                      <DropdownMenuItem disabled={!isAdmin}>
                        <Link
                          className="cursor-pointer"
                          to={`/book/edit/${book._id}`}
                        >
                          <div className="flex">
                            <Edit className="h-4 w-4 mr-2" />
                            <span>Edit Book</span>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    }

                    <DropdownMenuSeparator />
                    {
                      <DropdownMenuItem
                        disabled={!isAdmin}
                        onClick={() =>
                          handleDelete({
                            id: book._id,
                          })
                        }
                      >
                        <AiOutlineDelete className="h-4 w-4 mr-2 text-red-500" />
                        <span className="cursor-pointer text-red-500">
                          Delete Book
                        </span>
                      </DropdownMenuItem>
                    }
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          </Link>
        ))}
      </div>
      {bookData && (
        <div className="d-flex justify-content-center mt-4 mb-4">
          <Pagination
            currentPage={Number(searchParams.get('page' || 1))}
            totalPages={Math.ceil(bookData?.total / 10)}
            onPageChange={handlePageChange}
            layout="pagination"
          />
        </div>
      )}
    </Layout>
  );
};

export default AllBooks;
