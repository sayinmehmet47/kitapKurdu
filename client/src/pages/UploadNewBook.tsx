import React from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-dropzone-uploader/dist/styles.css';
import Dropzone from 'react-dropzone-uploader';

import Layout from '../components/Layout';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

const CLOUD_NAME = 'dsequsn4l',
  UPLOAD_PRESET = 'uploads';

const Container = styled.div`
  display: grid;
  place-items: center;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
`;

export default function UploadNewBook() {
  const { _id: userId } = useSelector(
    (state: any) => state.authSlice.user.user
  );

  const addBook = async (response: {
    original_filename: string;
    bytes: string;
    secure_url: string;
  }) => {
    console.log(response.secure_url.replace('upload', 'upload/w_200'));
    const book = {
      name: response.original_filename,
      size: response.bytes,
      url: response.secure_url,
      uploader: userId,
      // you can generate a thumbnail image of the first page of the PDF or EPUB file using Cloudinary's image manipulation and transformation capabilities
      // thumbnail: response.secure_url.replace('upload', 'upload/w_200'),
    };
    try {
      async function addNewBook() {
        axios
          .post('https://kitapkurdu.onrender.com/books/addNewBook', book)
          .then((res) => {
            toast.success(res.data.name + ' has been uploaded!');
          });
      }

      addNewBook();
    } catch (error) {
      toast.error(error.message + ' Please try again.');
    }
  };

  return (
    <Layout>
      <Container>
        <Dropzone
          getUploadParams={() => ({
            url: `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload?upload_preset=${UPLOAD_PRESET}`,
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
