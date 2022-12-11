import axios from 'axios';
import React, { useState } from 'react';
import Uploady, { useItemProgressListener } from '@rpldy/uploady';
import UploadButton from '@rpldy/upload-button';
import { ToastContainer, toast } from 'react-toastify';
import { BsFillCloudUploadFill } from 'react-icons/bs';
import { Line } from 'rc-progress';

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
        <Uploady
          isSuccessfulCall={(response) => {
            return handleResponse(JSON.parse(response.response)) as any;
          }}
          destination={{
            url: `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`,
            params: {
              upload_preset: UPLOAD_PRESET,
            },
          }}
        >
          <div>
            <UploadButton>
              <BsFillCloudUploadFill size={30} />
            </UploadButton>
            <span className="ms-4">UPLOAD A BOOK</span>
          </div>
        </Uploady>
      </Container>
      <ToastContainer />
    </Layout>
  );
}
