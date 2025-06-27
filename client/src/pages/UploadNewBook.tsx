import { toast } from 'sonner';
import 'react-dropzone-uploader/dist/styles.css';
import Dropzone from 'react-dropzone-uploader';

import Layout from '../components/Layout';
import styled from 'styled-components';
import { useAppSelector } from '@/redux/store';
import { useAddNewBookMutation } from '../redux/services/book.api';

const Container = styled.div`
  display: grid;
  place-items: center;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
`;

export default function UploadNewBook() {
  const [addNewBook] = useAddNewBookMutation();

  const user = useAppSelector((state) => state.authSlice.user.user);
  const userId = user.username; // Use username as identifier for now

  const addBook = async (response: {
    original_filename: string;
    bytes: string;
    secure_url: string;
  }) => {
    const book = {
      name: response.original_filename,
      size: response.bytes,
      url: response.secure_url,
      uploader: userId,
    };
    try {
      await addNewBook(book);
      toast.success(book.name + ' has been uploaded!');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      toast.error(errorMessage + ' Please try again.');
    }
  };

  return (
    <Layout>
      <Container>
        <Dropzone
          getUploadParams={() => ({
            url: process.env.REACT_APP_CLOUDINARY_URL as string,
          })}
          onChangeStatus={({ xhr }, status) => {
            if (status === 'done') {
              addBook(JSON.parse(xhr?.response));
            }
          }}
          inputContent={(files, extra) =>
            extra.reject
              ? 'Only PDF and EPUB files are allowed'
              : 'Drag and drop or click to upload'
          }
          onSubmit={(allFiles) => {
            allFiles.forEach((f) => f.remove());
          }}
          accept="application/pdf, application/epub+zip"
        />
      </Container>
    </Layout>
  );
}
