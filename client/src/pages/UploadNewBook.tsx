import { toast } from 'react-toastify';
import 'react-dropzone-uploader/dist/styles.css';
import Dropzone from 'react-dropzone-uploader';

import Layout from '../components/Layout';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
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

  const { _id: userId } = useSelector(
    (state: any) => state.authSlice.user.user
  );

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
    } catch (error: any) {
      toast.error(error.message + ' Please try again.');
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
