import { AiFillDelete } from 'react-icons/ai';
import { useSelector } from 'react-redux';
import Layout from '../components/Layout';
import { toast } from 'sonner';
import {
  useDeleteMessageMutation,
  useGetAllMessagesQuery,
} from '../redux/services/messages.api';
import { Card, LoadingSpinner } from '@/components';

import { ShelfSpaceForm } from './ShelfSpaceForm';

export default function ShelfSpace() {
  const { isAdmin } = useSelector((state: any) => state.authSlice.user.user);
  const { data: messages, isLoading, isError } = useGetAllMessagesQuery();
  const [deleteMessage] = useDeleteMessageMutation();

  if (isLoading || !messages)
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner />
        </div>
      </Layout>
    );

  if (isError) return <h1>Error...</h1>;

  return (
    <Layout>
      <div className="flex gap-1 flex-col container py-3">
        {messages?.map((message) => (
          <Card key={message._id}>
            <div className="flex justify-between p-3">
              <p className="text-green-700 text-lg">
                {message.sender.username}
              </p>
              {isAdmin && (
                <AiFillDelete
                  color="red"
                  className="float-end"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    deleteMessage({
                      id: message._id,
                    });
                    toast.success('Message deleted successfully');
                  }}
                />
              )}
            </div>
            <h5 className="text-success p-3 pt-0">{message.text}</h5>
          </Card>
        ))}
        <div className="mt-8">
          <ShelfSpaceForm />
        </div>
      </div>
    </Layout>
  );
}
