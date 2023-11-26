import { BookModel } from '../../models/book.model';
import { commonApi } from '../common.api';

export type Book = {
  name: string;
  file: string;
  date: string;
  size: string;
  _id: string;
  category: string[];
  language: string;
  url?: string;
  uploader: {
    username: string;
    _id: string;
    email: string;
  };
};
export type BooksData = {
  results: Book[];
  total: number;
  page: number;
  next: {
    page: number;
  };
  previous: {
    page: number;
  };
};

export const bookApi = commonApi.injectEndpoints({
  endpoints: (build) => ({
    fetchAllBooks: build.query<BookModel, number | void>({
      query: (page: number) => ({
        url: '/books/allBooks',
        params: {
          page,
        },
      }),
      providesTags: (result) => [{ type: 'Book', id: 'List' }],
    }),
    deleteBook: build.mutation<BookModel, { id: string }>({
      query: (id) => ({
        url: `/books/deleteBook`,
        method: 'POST',
        body: { id },
      }),
      invalidatesTags: [{ type: 'Book', id: 'List' }],
    }),

    searchBooks: build.query<
      BooksData,
      {
        name: string;
        page: number;
      }
    >({
      query: ({ name, page }) => ({
        url: `/books/searchBooks`,
        params: {
          name,
          page,
        },
      }),
      providesTags: (result) => [{ type: 'Book', id: 'List' }],
    }),

    addNewBook: build.mutation<
      BookModel,
      {
        name: string;
        size: string;
        url: string;
        uploader: string;
      }
    >({
      query: (book) => ({
        url: `/books/addNewBook`,
        method: 'POST',
        body: book,
      }),
      invalidatesTags: [{ type: 'Book', id: 'List' }],
    }),

    getBookById: build.query<Book, string | undefined>({
      query: (id) => ({
        url: `/books/getBookById/${id}`,
      }),
    }),

    fetchRecentlyAdded: build.query<Book[], number | void>({
      query: (page: number) => ({
        url: '/books/recently-added',
        params: {
          page,
        },
        invalidatesTags: [{ type: 'Book', id: 'List' }],
      }),
    }),
  }),
});

export const {
  useFetchAllBooksQuery,
  useDeleteBookMutation,
  useLazySearchBooksQuery,
  useAddNewBookMutation,
  useFetchRecentlyAddedQuery,
  useGetBookByIdQuery,
} = bookApi;
