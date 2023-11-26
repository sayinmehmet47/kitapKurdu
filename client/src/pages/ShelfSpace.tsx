import { Card } from '@mui/material';
import { BiSend } from 'react-icons/bi';
import { AiFillDelete } from 'react-icons/ai';
import { useSelector } from 'react-redux';
import { Button, Form, FormGroup, Input } from 'reactstrap';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import { toast } from 'sonner';
import {
  useAddMessageMutation,
  useDeleteMessageMutation,
  useGetAllMessagesQuery,
} from '../redux/services/messages.api';
import { useState } from 'react';

export default function ShelfSpace() {
  const { _id: userId, isAdmin } = useSelector(
    (state: any) => state.authSlice.user.user
  );
  const { data: messages, isLoading, isError } = useGetAllMessagesQuery();
  const [deleteMessage] = useDeleteMessageMutation();
  const [addMessage] = useAddMessageMutation();

  const [text, setText] = useState<string>();

  if (isLoading || !messages) return <Loading />;

  if (isError) return <h1>Error...</h1>;

  const resetForm = () => {
    setText('');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!text) {
      toast.error('Please enter a message');
      return;
    }

    try {
      addMessage({
        text,
        sender: userId,
      });
      toast.success('Message sent successfully');
      resetForm();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Layout>
      <div className="border-2 border mt-4 overflow-scroll">
        {messages?.map((message) => (
          <Card className="m-4 p-3 tex-center" key={message._id}>
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
            <div key={message._id}>
              <p className="text-danger">{message.sender.username}</p>
              <h5 className="text-success me-3">{message.text}</h5>
            </div>
          </Card>
        ))}

        <Form className="mt-5" onSubmit={handleSubmit}>
          <FormGroup className="mx-5">
            <div className="flex flex-column gap-4">
              <Input
                id="exampleText"
                name="text"
                type="textarea"
                placeholder="Write your message here..."
                value={text}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  return setText(e.target.value);
                }}
              />
              <Button className="px-5 mt-2">
                <BiSend />
              </Button>
            </div>
          </FormGroup>
        </Form>
      </div>
    </Layout>
  );
}
