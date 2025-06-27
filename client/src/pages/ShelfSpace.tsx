import { useSelector } from 'react-redux';
import Layout from '../components/Layout';
import { RootState } from '@/redux/store';
import { toast } from 'sonner';
import {
  useDeleteMessageMutation,
  useGetAllMessagesQuery,
} from '../redux/services/messages.api';
import {
  ShelfSpaceHeader,
  ErrorState,
  MessagesList,
  FormSidebar,
  LoadingState,
} from '@/components/shelf-space';

export default function ShelfSpace() {
  const { isAdmin } = useSelector(
    (state: RootState) => state.authSlice.user.user
  );
  const { data: messages, isLoading, isError } = useGetAllMessagesQuery();
  const [deleteMessage] = useDeleteMessageMutation();

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage({ id: messageId }).unwrap();
      toast.success('Message deleted successfully');
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  if (isLoading || !messages) {
    return (
      <Layout>
        <LoadingState />
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <ErrorState />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4 max-w-5xl">
        <ShelfSpaceHeader messageCount={messages.length} isAdmin={isAdmin} />

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MessagesList
              messages={messages}
              isAdmin={isAdmin}
              onDeleteMessage={handleDeleteMessage}
            />
          </div>

          <div className="lg:col-span-1">
            <FormSidebar />
          </div>
        </div>
      </div>
    </Layout>
  );
}
