import { Book, BookModel, BooksData } from '../../models/book.model';
import { commonApi } from '../common.api';

export const bookApi = commonApi.injectEndpoints({
  endpoints: (build) => ({
    fetchAllBooks: build.query<BookModel, { page: number; language: string }>({
      query: ({ page, language }) => ({
        url: `/books/allBooks/`,
        params: {
          page,
          language,
        },
      }),
      providesTags: (result) => [{ type: 'Book', id: 'List' }],
    }),
    deleteBook: build.mutation<BookModel, { id: string }>({
      query: ({ id }) => ({
        url: `/books/deleteBook/${id}`,
        method: 'POST',
        params: {
          id,
        },
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

    updateBook: build.mutation<
      BookModel,
      {
        id: string;
        name?: string;
        language?: string;
      }
    >({
      query: ({ id, name, language }) => ({
        url: `/books/updateBook/${id}`,
        method: 'POST',
        params: {
          id,
        },
        body: {
          name,
          language,
        },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Book', id: 'List' },
        { type: 'Book', id: 'RecentlyAdded' },
        { type: 'Book', id },
      ],
    }),

    getBookById: build.query<Book, string | undefined>({
      query: (id) => ({
        url: `/books/getBookById/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: 'Book', id }],
    }),

    fetchRecentlyAdded: build.query<Book[], number | void>({
      query: (page: number) => ({
        url: '/books/recently-added',
        params: {
          page,
        },
      }),
      providesTags: (result) => [{ type: 'Book', id: 'RecentlyAdded' }],
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
  useUpdateBookMutation,
} = bookApi;
