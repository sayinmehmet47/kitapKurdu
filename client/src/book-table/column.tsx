import { ColumnDef } from '@tanstack/react-table';
import { Book } from 'src/redux/services/book.api';

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
];
