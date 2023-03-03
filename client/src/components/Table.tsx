import axios from 'axios';
import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTable, useSortBy, usePagination, Column } from 'react-table';
import { toast } from 'react-toastify';
import { AiOutlineDelete } from 'react-icons/ai';
import { Book, BooksData } from '../helpers/hooks/useFetchBooks';

type TableTypes = {
  books: BooksData;
  setPage: (page: number) => void;
  refresh: () => void;
  isLoading: boolean;
};

type ColumnWithShow<T extends Record<string, unknown>> = Column<T> & {
  show?: boolean;
};

export const Table = ({ books, setPage, refresh, isLoading }: TableTypes) => {
  const [data, setData] = React.useState(books.results);

  useEffect(() => {
    setData(books.results);
  }, [books]);

  const { next, previous } = books;

  const { user: USERINFO, isLoggedIn } = useSelector(
    (state: any) => state.authSlice
  );

  const isAdmin = isLoggedIn && USERINFO.user?.isAdmin;

  const handleDelete = (row: any) => {
    axios
      .post('https://kitapkurdu.onrender.com/books/deleteBook', {
        id: row.original.id,
      })
      .then((res) => {
        if (res.data) {
          res.data && toast.success('Book deleted successfully');
          refresh();
        } else {
          toast.error('Something went wrong');
        }
      })
      .catch((err) => {
        toast.error('Something went wrong');
      });
  };

  const columns = useMemo(
    (): readonly ColumnWithShow<Book>[] => [
      {
        Header: 'Name',
        id: 'name',
        show: true,
        accessor: (d: Book) => d.file,
        Cell: ({ row }: any) => (
          <a href={row.original.file} target="_blank" rel="noopener noreferrer">
            {row.original.name}
          </a>
        ),
      },
      {
        Header: 'Size',
        accessor: 'size', // accessor is the "key" in the data
      },
      {
        Header: 'Date',
        accessor: 'date',
      },
      {
        Header: 'Uploaded By',
        accessor: 'uploader',
        Cell: ({ row }: any) => (
          <div className="text-success ms-5">
            {row.original.uploader.username}
          </div>
        ),
      },
      {
        Header: 'Delete',
        id: 'delete',
        show: isAdmin,
        Cell: ({ row }: any) => (
          <div className="text-center delete-icon flex justify-content-center me-1">
            <AiOutlineDelete onClick={() => handleDelete(row)} />
          </div>
        ),
      },
    ],
    []
  );

  React.useEffect(() => {
    setHiddenColumns(
      columns.filter((column) => !column.show).map((column) => column.id)
    );
  }, [columns]);

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
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: '60vh' }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="d-flex flex-column  mt-5 mx-5 overflow-auto"
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
          onClick={() => setPage(next.page)}
          disabled={!next}
        >
          NextPage ➡
        </button>
      </div>
    </div>
  );
};
