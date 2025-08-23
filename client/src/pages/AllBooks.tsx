import { Link, useSearchParams } from 'react-router-dom';
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
  LoadingSpinner,
  BookFilters,
} from '@/components';
import { Pagination } from '@/components/ui/pagination';
import { DownloadIcon, Edit, Eye, MoreHorizontal, Share2 } from 'lucide-react';
import { AiOutlineDelete } from 'react-icons/ai';
import { downloadBook } from '@/helpers/downloadBook';
import ReactGA from 'react-ga4';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { RootState } from '@/redux/store';
import { shareLink } from '@/helpers/shareLink';

const AllBooks = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    data: bookData,
    isLoading,
    isFetching,
  } = useFetchAllBooksQuery({
    page: Number(searchParams.get('page') || '1'),
    language: searchParams.get('language') || '',
    category: searchParams.get('category') || undefined,
    fileType: searchParams.get('fileType') || undefined,
    sort: searchParams.get('sort') || undefined,
    search: searchParams.get('search') || undefined,
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

  const handleShare = (e: React.MouseEvent, id: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/og/book/${id}`;
    shareLink({ title, text: `Check out this book: ${title}`, url });
  };

  const handleSearch = (query: string) => {
    // Send event to Google Analytics
    ReactGA.event({
      category: 'Search',
      action: 'Book Search',
      label: query,
    });
  };

  if (isLoading || isFetching) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <BookFilters onSearch={handleSearch} />
      <div className="mt-5 2xl:grid-cols-4 grid xl:grid-cols-4 lg:grid-cols-3  gap-12 m-4 md:grid-cols-2 sm:grid-cols-1 w-3/4 mx-auto">
        {bookData?.results.map((book) => (
          <Link key={book._id} to={`/book/${book._id}`}>
            <Card className="h-full w-full p-12 pb-20 relative bg-gray-100 hover:scale-105 transform transition-all duration-300 ease-in-out shadow-lg rounded-lg">
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
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
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
                      onClick={(e) => {
                        // Prevent navigation to preview when downloading
                        e.preventDefault();
                        e.stopPropagation();
                        downloadBook(book.url, book.name);
                      }}
                    >
                      <DownloadIcon className="h-4 w-4 mr-2 " />
                      Download Book
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={(e) => handleShare(e, book._id, book.name)}
                    >
                      <Share2 className="h-4 w-4 mr-2 " />
                      Share
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
        <div className="flex w-full justify-center py-3">
          <Pagination
            currentPage={Number(searchParams.get('page') || '1')}
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
