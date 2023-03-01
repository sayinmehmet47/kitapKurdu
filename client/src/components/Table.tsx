import axios from 'axios';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTable, useSortBy, usePagination } from 'react-table';
import 'react-toastify/dist/ReactToastify.css';
import { toast, ToastContainer } from 'react-toastify';

export const Table = ({ books }: any) => {
  const data = useMemo(() => [...books], [books]);
  const { user: USERINFO } = useSelector((state: any) => state.authSlice);

  const isAdmin = USERINFO.user.isAdmin;

  const columns = useMemo(
    () => [
      {
        Header: 'Name',
        id: 'name',
        accessor: (d: any) => d.file,
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
      isAdmin && {
        Header: 'Delete',
        id: 'delete',
        Cell: ({ row }: any) => (
          <button
            className="btn btn-danger"
            onClick={() => {
              axios
                .post('https://kitapkurdu.onrender.com/books/deleteBook', {
                  id: row.original.id,
                })
                .then((res) => {
                  toast.success('Book deleted successfully');
                });
            }}
          >
            Delete
          </button>
        ),
      },
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    nextPage,
    previousPage,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
  } = useTable({ columns, data }, useSortBy, usePagination) as any;
  return (
    <div
      className="d-flex flex-column  mt-5 mx-5"
      style={{ marginBottom: '40px' }}
    >
      <ToastContainer />
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
        {/* @ts-ignore */}
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
          onClick={() => previousPage()}
          disabled={!canPreviousPage}
        >
          ⬅ Previous
        </button>
        <button
          className="btn btn-outline-dark btn-sm"
          onClick={() => nextPage()}
          disabled={!canNextPage}
        >
          NextPage ➡
        </button>
      </div>
    </div>
  );
};
