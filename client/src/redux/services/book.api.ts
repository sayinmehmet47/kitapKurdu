import { Book, BookModel, BooksData } from '../../models/book.model';
import { commonApi } from '../common.api';

export const bookApi = commonApi.injectEndpoints({
  endpoints: (build) => ({
    fetchAllBooks: build.query<
      BookModel,
      {
        page: number;
        language?: string;
        category?: string; // comma-separated
        fileType?: 'pdf' | 'epub' | '' | string;
        sort?: 'dateDesc' | 'dateAsc' | 'nameAsc' | 'nameDesc' | string;
      }
    >({
      query: ({ page, language, category, fileType, sort }) => ({
        url: `/books/allBooks`,
        params: {
          page,
          language,
          category,
          fileType,
          sort,
        },
      }),
      transformResponse: (response: any) => {
        return response.data || response;
      },
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
      invalidatesTags: (result, error, { id }) => [
        { type: 'Book', id: 'List' },
        { type: 'Book', id: 'RecentlyAdded' },
        { type: 'Book', id },
      ],
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
      invalidatesTags: [
        { type: 'Book', id: 'List' },
        { type: 'Book', id: 'RecentlyAdded' },
      ],
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

    fetchRecentlyAdded: build.query<
      {
        data: {
          books: Book[];
          pagination: {
            currentPage: number;
            totalPages: number;
            totalBooks: number;
            hasMore: boolean;
            limit: number;
          };
        };
      },
      { page?: number; limit?: number } | void
    >({
      query: (params) => {
        const { page = 1, limit = 16 } = params || {};
        return {
          url: '/books/recently-added',
          params: { page, limit },
        };
      },
      providesTags: (result) => [{ type: 'Book', id: 'RecentlyAdded' }],
      serializeQueryArgs: ({ endpointName }) => {
        return endpointName;
      },
      merge: (currentCache, newItem, { arg }) => {
        const { page = 1 } = arg || {};
        if (page === 1) {
          // Reset cache for first page
          return newItem;
        } else {
          // Merge new books with existing ones
          return {
            ...newItem,
            data: {
              ...newItem.data,
              books: [...currentCache.data.books, ...newItem.data.books],
            },
          };
        }
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
    }),
  }),
});

export const {
  useFetchAllBooksQuery,
  useDeleteBookMutation,
  useLazySearchBooksQuery,
  useAddNewBookMutation,
  useFetchRecentlyAddedQuery,
  useLazyFetchRecentlyAddedQuery,
  useGetBookByIdQuery,
  useUpdateBookMutation,
} = bookApi;
