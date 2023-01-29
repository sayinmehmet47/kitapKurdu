import React from 'react';
import axios from 'axios';

import { ToastContainer, toast } from 'react-toastify';
import 'react-dropzone-uploader/dist/styles.css';
import Dropzone from 'react-dropzone-uploader';

import Layout from '../components/Layout';
import styled from 'styled-components';

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
  const handleResponse = (response: any) => {
    console.log(response);
    const addBook = async (response: {
      original_filename: any;
      bytes: any;
      secure_url: any;
    }) => {
      const book = {
        name: response.original_filename,
        size: response.bytes,
        url: response.secure_url,
      };
      try {
        async function addNewBook() {
          axios.post('books/addNewBook', book).then((res) => {
            toast.success(res.data.name + ' has been uploaded!');
          });
        }

        addNewBook();
      } catch (error) {
        toast.error(error.message + ' Please try again.');
      }
    };

    addBook(response);
  };

  return (
    <Layout>
      <Container>
        <Dropzone
          getUploadParams={() => ({
            url: `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload?upload_preset=${UPLOAD_PRESET}`,
          })}
          onChangeStatus={({ meta, file, xhr }, status) => {
            if (status === 'done') {
              handleResponse(JSON.parse(xhr?.response));
            }
          }}
        />
      </Container>
      <ToastContainer />
    </Layout>
  );
}
