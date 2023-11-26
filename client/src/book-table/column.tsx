import { ColumnDef } from '@tanstack/react-table';
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Button } from '../components/ui/button';
import { DownloadIcon, MoreHorizontal } from 'lucide-react';
import { DropdownMenuContent } from '../components/ui/dropdown-menu';
import { DropdownMenuLabel } from '../components/ui/dropdown-menu';
import { DropdownMenuItem } from '../components/ui/dropdown-menu';
import { DropdownMenuSeparator } from '../components/ui/dropdown-menu';
import { Book } from 'src/redux/services/book.api';
import { AiOutlineDelete } from 'react-icons/ai';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

import { Link } from 'react-router-dom';

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

const BookOptions = ({ row }: { row: { original: Book } }) => {
  const { user, isLoggedIn } = useSelector(
    (state: RootState) => state.authSlice
  );

  const isAdmin = isLoggedIn && user.user.isAdmin;

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
        {isAdmin && (
          <DropdownMenuItem>
            <AiOutlineDelete className="h-4 w-4 mr-2 text-red-500" />
            <span className="cursor-pointer text-red-500">Delete Book</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const columns: ColumnDef<Book>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
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
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => {
      return (
        <div className="text-sm text-gray-500">
          {new Date(row.original.date).toLocaleDateString()}
        </div>
      );
    },
  },

  {
    header: 'Uploaded By',
    accessorKey: 'uploader',
    cell: ({ row }) => (
      <div className="text-gray-500">{row.original.uploader.username}</div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <BookOptions row={row} />,
  },
];
