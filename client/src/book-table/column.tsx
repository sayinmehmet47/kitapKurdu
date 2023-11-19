import { ColumnDef } from '@tanstack/react-table';
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Button } from '../components/ui/button';
import {
  DeleteIcon,
  Download,
  DownloadIcon,
  MoreHorizontal,
} from 'lucide-react';
import { DropdownMenuContent } from '../components/ui/dropdown-menu';
import { DropdownMenuLabel } from '../components/ui/dropdown-menu';
import { DropdownMenuItem } from '../components/ui/dropdown-menu';
import { DropdownMenuSeparator } from '../components/ui/dropdown-menu';
import { Book } from 'src/redux/services/book.api';
import { AiOutlineDelete } from 'react-icons/ai';

export const columns: ColumnDef<Book>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'size',
    header: 'Size',
  },
  {
    accessorKey: 'date',
    header: 'Date',
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const payment = row.original;

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
              onClick={() => navigator.clipboard.writeText(payment.id)}
              className="cursor-pointer"
            >
              <DownloadIcon className="h-4 w-4 mr-2 " />
              Download Book
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <AiOutlineDelete className="h-4 w-4 mr-2 text-red-500" />
              <span className="cursor-pointer text-red-500">Delete Book</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
