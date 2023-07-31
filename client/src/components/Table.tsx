import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTable, useSortBy, usePagination, Column } from 'react-table';
import { toast } from 'react-toastify';
import { AiOutlineDelete } from 'react-icons/ai';
import Loading from './Loading';
import {
  Book,
  BooksData,
  useDeleteBookMutation,
} from '../redux/services/book.api';

type TableTypes = {
  books: BooksData;
  setPage: (page: number) => void;
  isLoading: boolean;
};

type ColumnWithShow<T extends Record<string, unknown>> = Column<T> & {
  show?: boolean;
};

export const Table = ({ books, setPage, isLoading }: TableTypes) => {
  const [data, setData] = React.useState(books.results);
  const [deleteBook] = useDeleteBookMutation();

  useEffect(() => {
    setData(books.results);
  }, [books]);

  const { next, previous } = books;

  const { user: USERINFO, isLoggedIn } = useSelector(
    (state: any) => state.authSlice
  );

  const isAdmin = isLoggedIn && USERINFO.user?.isAdmin;

  const columns = useMemo(
    (): readonly ColumnWithShow<Book>[] => [
      {
        Header: 'Name',
        id: 'name',
        show: true,
        accessor: (d: Book) => d.file,
        Cell: ({ row }: any) => {
          return (
            <a href={row.original.url} download="renamed.pdf">
              {row.original.name}
            </a>
          );
        },
      },
      {
        Header: 'Size',
        accessor: 'size', // accessor is the "key" in the data
      },

      {
        Header: 'Date',
        accessor: (d: Book) => d.date,
        Cell: ({ row }: any) => {
          return (
            <div className="text-success ms-5">
              {new Date(row.original.date).toLocaleDateString()}
            </div>
          );
        },
      },
      {
        Header: 'Uploaded By',
        accessor: 'uploader',
        Cell: ({ row }) => (
          <div className="text-success ms-5">
            {row.original.uploader.username}
          </div>
        ),
      },
      {
        Header: 'Category',
        accessor: 'category',
        show:isAdmin,
        Cell: ({ row }) => (
          <div className="text-success ms-5">{row.original.category[0]}</div>
        ),
          
      },
      {
        Header: 'Language',
        accessor: 'language',
        show:isAdmin,
        Cell: ({ row }) => (
          <div className="text-success ms-5">{row.original.language}</div>
        ),
      },
      {
        Header: 'Delete',
        id: 'delete',
        show: isAdmin,
        Cell: ({ row }:any) => (
          <div className="text-center delete-icon flex justify-content-center me-1">
            <AiOutlineDelete
              onClick={() => {
                return deleteBook(row.original._id)
                  .unwrap()
                  .then(() => {
                    toast.success('Book deleted successfully');
                  });
              }}
            />
          </div>
        ),
      },
    ],
    [
      deleteBook,
      isAdmin,
    ]
  );

  React.useEffect(() => {
    setHiddenColumns(
      columns.filter((column) => !column.show).map((column) => column.id)
    );
  }, []);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    setHiddenColumns,
  } = useTable(
    {
      columns,
      data,
    },
    useSortBy,
    usePagination
  ) as any;

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div
      className="d-flex flex-column  mt-5 mx-5 overflow-scroll"
      style={{ marginBottom: '40px' }}
    >
      <table {...getTableProps()} style={{ borderRadius: '15px' }}>
        <thead>
          {headerGroups.map((headerGroup: any) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column: any) => (
                <th
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  className="border"
                  style={{
                    background: '#f3f4f6',
                    color: 'black',
                    paddingLeft: '12px',
                  }}
                >
                  {column.render('Header')}
                  <span>
                    {column.isSorted ? (column.isSortedDesc ? '🔽' : '🔼') : ''}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row: any) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()} data-testid="table-row">
                {row.cells.map((cell: any) => {
                  return (
                    <td
                      {...cell.getCellProps()}
                      className="border py-2 "
                      style={{
                        textDecorationLine: 'none',
                        paddingLeft: '7px',
                      }}
                    >
                      {cell.render('Cell')}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-2 d-flex justify-content-center">
        <button
          className="btn btn-outline-dark btn-sm"
          onClick={() => setPage(previous.page)}
          disabled={!previous}
        >
          ⬅ Previous
        </button>
        <button
          className="btn btn-outline-dark btn-sm"
          onClick={() => {
            setPage(next.page);
          }}
          disabled={!next}
        >
          NextPage ➡
        </button>
      </div>
    </div>
  );
};
