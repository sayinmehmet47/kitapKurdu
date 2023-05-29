import { BookModel } from '../../models/book.model';
import { commonApi } from '../common.api';

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
      invalidatesTags: ['Book'],
    }),

    // createExample: build.mutation<
    //   BookModel,
    //   { example: Partial<BookModel> & { limit?: number } }
    // >({
    //   query: ({ example }) => ({
    //     url: '/example',
    //     method: 'POST',
    //     body: example,
    //   }),
    //   async onQueryStarted({ example }, { dispatch, queryFulfilled }) {
    //     try {
    //       const { data } = await queryFulfilled;

    //       dispatch(
    //         exampleApi.util.updateQueryData(
    //           'fetchExampleList',
    //           example.limit,
    //           (draft) => {
    //             draft.unshift(data);
    //           }
    //         )
    //       );
    //     } catch (e) {
    //       console.error('userApi createUser error', e);
    //     }
    //   },
    // }),
    // updateExample: build.mutation<BookModel, { example: BookModel }>({
    //   query: ({ example }) => ({
    //     url: `/example`,
    //     method: 'PUT',
    //     body: example,
    //   }),
    //   invalidatesTags: ['Example'],
    // }),
    // deleteExample: build.mutation<BookModel, { example: BookModel }>({
    //   query: ({ example }) => ({
    //     url: `/example/${example.id}`,
    //     method: 'DELETE',
    //   }),
    //   invalidatesTags: ['Example'],
    // }),
  }),
});

export const {
  useFetchAllBooksQuery,
  useDeleteBookMutation,
  // useCreateExampleMutation,
  // useUpdateExampleMutation,
  // useDeleteExampleMutation,
} = bookApi;
