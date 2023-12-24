import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Button } from '../components/ui/button';
import { DownloadIcon, Edit, MoreHorizontal } from 'lucide-react';
import { DropdownMenuContent } from '../components/ui/dropdown-menu';
import { DropdownMenuLabel } from '../components/ui/dropdown-menu';
import { DropdownMenuItem } from '../components/ui/dropdown-menu';
import { DropdownMenuSeparator } from '../components/ui/dropdown-menu';
import { AiOutlineDelete } from 'react-icons/ai';
import { useSelector } from 'react-redux';

import { Link } from 'react-router-dom';
import { useDeleteBookMutation } from 'redux/services/book.api';
import { RootState } from 'redux/store';
import { downloadBook } from '@/helpers/downloadBook';
import { Badge } from '@/components/ui/badge';
import { Book } from '@/models/book.model';

const BookOptions = ({ row }: { row: { original: Book } }) => {
  const { user, isLoggedIn } = useSelector(
    (state: RootState) => state.authSlice
  );

  const [deleteBook, { isSuccess, isError }] = useDeleteBookMutation();

  const isAdmin = isLoggedIn && user.user.isAdmin;

  const handleDelete = async () => {
    deleteBook({ id: row.original._id }).catch((err) => {
      isError && toast.error('Something went wrong');
    });
  };
  isSuccess && toast.success('Book deleted successfully');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => downloadBook(row.original.url, row.original.name)}
        >
          <DownloadIcon className="h-4 w-4 mr-2 " />
          Download Book
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {
          <DropdownMenuItem disabled={!isAdmin}>
            <Link
              className="cursor-pointer"
              to={`/book/edit/${row.original._id}`}
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
          <DropdownMenuItem onClick={handleDelete} disabled={!isAdmin}>
            <AiOutlineDelete className="h-4 w-4 mr-2 text-red-500" />
            <span className="cursor-pointer text-red-500">Delete Book</span>
          </DropdownMenuItem>
        }
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const columns: ColumnDef<Book>[] = [
  {
    accessorKey: 'name',
    header: () => (
      <div className="text-green-800 font-bold text-base">Name</div>
    ),
    cell: ({ row }) => (
      <Link
        className="text-gray-700 hover:text-blue-400 cursor-pointer"
        to={`/book/${row.original._id}`}
      >
        {row.original.name}
      </Link>
    ),
  },

  {
    accessorKey: 'category',
    header: () => (
      <div className="text-green-800 font-bold text-base hidden md:flex">
        Category
      </div>
    ),
    cell: ({ row }) =>
      row.original.category.length > 1 &&
      row.original.category.map((category) => (
        <Badge
          className="text-xs max-w-36 truncate hidden md:inline-flex m-1"
          key={category}
        >
          {category}
        </Badge>
      )),
  },

  {
    accessorKey: 'date',
    header: () => (
      <div className="text-green-800 font-bold text-base  hidden md:flex">
        Date
      </div>
    ),
    cell: ({ row }) => {
      return (
        <div className="text-sm text-gray-500 hidden md:flex">
          {new Date(row.original.date).toLocaleDateString()}
        </div>
      );
    },
  },

  {
    header: () => (
      <div className="text-green-800 font-bold text-base hidden md:flex">
        Uploader
      </div>
    ),
    accessorKey: 'uploader',
    cell: ({ row }) => (
      <div className="text-gray-500 hidden md:flex">
        {row.original.uploader.username}
      </div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <BookOptions row={row} />,
  },
];
