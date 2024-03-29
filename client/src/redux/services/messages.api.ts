import { MessagesModel } from '../../models/messages.model';
import { commonApi } from '../common.api';

export const messagesApi = commonApi.injectEndpoints({
  endpoints: (build) => ({
    getAllMessages: build.query<MessagesModel[], void>({
      query: () => ({
        url: '/messages/userMessages',
        credentials: 'include',
      }),
      providesTags: (result) => [{ type: 'Messages', id: 'List' }],
    }),
    deleteMessage: build.mutation<MessagesModel, { id: string }>({
      query: (id) => ({
        url: `/messages/deleteMessage`,
        method: 'DELETE',
        body: id,
      }),
      invalidatesTags: ['Messages'],
    }),
    addMessage: build.mutation<MessagesModel, { text: string; sender: string }>(
      {
        query: (body) => ({
          url: `/messages/userMessages`,
          method: 'POST',
          body,
        }),
        invalidatesTags: ['Messages'],
      }
    ),
  }),
});

export const {
  useGetAllMessagesQuery,
  useDeleteMessageMutation,
  useAddMessageMutation,
} = messagesApi;
