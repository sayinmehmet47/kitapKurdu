import Loading from '../components/Loading';
import Layout from '../components/Layout';
import {
  useDeleteBookMutation,
  useFetchRecentlyAddedQuery,
} from '../redux/services/book.api';
import { Card, CardTitle } from '../components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { DropdownMenuLabel } from '../components/ui/dropdown-menu';
import { DropdownMenuItem } from '../components/ui/dropdown-menu';
import { DropdownMenuSeparator } from '../components/ui/dropdown-menu';
import { DownloadIcon, Eye, MoreHorizontal } from 'lucide-react';
import { Button } from '../components/ui/button';
import { AiOutlineDelete } from 'react-icons/ai';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const RecentlyAdded = () => {
  const { data: recentlyAddedBooks, isLoading } = useFetchRecentlyAddedQuery();
  const { user, isLoggedIn } = useSelector(
    (state: RootState) => state.authSlice
  );
  const [deleteBook, { isSuccess, isError }] = useDeleteBookMutation();

  const downloadBook = async (url: string | undefined, name: string) => {
    if (!url) {
      console.error('URL is undefined');
      return;
    }

    const response = await fetch(url);
    const data = await response.blob();
    const blobUrl = window.URL.createObjectURL(data);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const isAdmin = isLoggedIn && user.user.isAdmin;
  const handleDelete = async ({ id }: { id: string }) => {
    deleteBook({ id }).catch((err) => {
      isError && toast.error('Something went wrong');
    });

    isSuccess && toast.success('Book deleted successfully');
  };

  if (isLoading || !recentlyAddedBooks) {
    return <Loading />;
  }

  return (
    <Layout>
      <div className="mt-5 grid xl:grid-cols-6 lg:grid-cols-4  gap-12 m-4 md:grid-cols-3 sm:grid-cols-2">
        {recentlyAddedBooks?.map((book) => (
          <Card className="h-full w-full p-12 pb-20 relative" key={book._id}>
            <img
              src={
                book.url?.includes('pdf')
                  ? book.url?.replace('pdf', 'jpg')
                  : 'https://images.pexels.com/photos/8594539/pexels-photo-8594539.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
              }
              className="h-3/4 w-full rounded-t-lg"
              alt="Book Cover"
            />

            <CardTitle
              title={book.name}
              className="text-left ps-2 text-lg mt-2 text-gray-800"
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
                  {isAdmin && (
                    <DropdownMenuItem
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
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        ))}
      </div>
    </Layout>
  );
};

export default RecentlyAdded;
