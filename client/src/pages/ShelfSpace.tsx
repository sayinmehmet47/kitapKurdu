import { Card } from '@mui/material';
import React from 'react';
import { BiSend } from 'react-icons/bi';
import { AiFillDelete } from 'react-icons/ai';
import { useSelector } from 'react-redux';
import { Button, Form, FormGroup, Input } from 'reactstrap';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import useFetchAllMessages from '../helpers/hooks/useFetchAllMessages';
import { toast } from 'react-toastify';
import axios from 'axios';

export default function ShelfSpace() {
  const { _id: userId, isAdmin } = useSelector(
    (state: any) => state.authSlice.user.user
  );
  const { allMessages, loading, error, refresh } = useFetchAllMessages();
  const [text, setText] = React.useState('');

  if (loading) return <Loading />;

  if (error) return <h1>Error...</h1>;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const sendMessage = async () => {
      try {
        await axios.post(
          'https://kitapkurdu.onrender.com/messages/userMessages',
          {
            text,
            sender: userId,
          }
        );
        refresh();
      } catch (error) {
        console.log(error);
      }
    };
    sendMessage();
    toast.success('Message sent');
  };

  return (
    <Layout>
      <div className="border-2 border mt-4 overflow-scroll">
        {allMessages.map((message) => (
          <Card className="m-4 p-3 tex-center">
            {isAdmin && (
              <AiFillDelete
                color="red"
                className="float-end"
                style={{ cursor: 'pointer' }}
                onClick={async () => {
                  try {
                    await axios.delete(
                      `https://kitapkurdu.onrender.com/messages/userMessages/${message._id}`
                    );
                    refresh();
                  } catch (error) {
                    console.log(error);
                  }
                  toast.success('Message deleted');
                }}
              />
            )}
            <div key={message._id}>
              <p className="text-danger">{message.sender?.username}</p>
              <h5 className="text-success me-3">{message?.text}</h5>
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
                onChange={(e) => {
                  setText(e.target.value);
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
