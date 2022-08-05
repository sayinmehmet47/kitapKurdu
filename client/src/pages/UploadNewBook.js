import axios from 'axios';
import React, { useState } from 'react';
import Uploady from '@rpldy/uploady';
import UploadButton from '@rpldy/upload-button';

import Layout from '../components/Layout';

const CLOUD_NAME = 'dsequsn4l',
  UPLOAD_PRESET = 'uploads';

export default function UploadNewBook() {
  const handleResponse = (response) => {
    console.log(response);
    const addBook = async (response) => {
      const book = {
        name: response.original_filename,
        size: response.bytes,
        url: response.secure_url,
      };
      axios.post('books/addNewBook', book);
    };

    addBook(response);
  };

  return (
    <Layout>
      <Uploady
        isSuccessfulCall={(response) => {
          handleResponse(JSON.parse(response.response));
        }}
        destination={{
          url: `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`,
          params: {
            upload_preset: UPLOAD_PRESET,
          },
        }}
      >
        <UploadButton>Upload to Cloudinary</UploadButton>
      </Uploady>
    </Layout>
  );
}
