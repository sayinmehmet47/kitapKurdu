import React, { useEffect, useState } from 'react';
import { Button, Form, FormGroup, Input } from 'reactstrap';
import bytes2Size from './bytes2Size';
import { GetDownloadLink } from './GetDownloadLink';
import { Table } from './Table';
import { Spinner } from 'reactstrap';
import library from '../images/library.jpg';
import bookPic from '../images/book-1.png';

const axios = require('axios');

export const Search = () => {
  const [search, setSearch] = useState('');
  const [books, setBooks] = useState('');
  const [isLoading, setisLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleChangeInput = (e) => {
    setSearch(e.target.value);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    e.target.reset();
    setisLoading(true);
    fetch(`/books/${search}`)
      .then((res) => res.json())
      .then((d) => {
        Promise.all(
          d.map((e) => {
            return fetch(
              encodeURI(
                `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=https://disk.yandex.com.tr/d/sLURXWsHH4gDmw&path=${e.path}`
              )
            )
              .then((res) => res.json())
              .then((res) => {
                return {
                  name: e.name,
                  size: bytes2Size(e.size),
                  date: new Date(e.date).toLocaleDateString(),
                  file: res.href,
                };
              });
          })
        ).then((data) => {
          setBooks(data);
          setIsLoaded(true);
          setisLoading(false);
        });
      });
  };

  return (
    <>
      <Form className="mx-5 text-center mt-5" onSubmit={handleSubmit}>
        <h4 className="my-4">Search for Books</h4>
        <FormGroup className="d-flex justify-content-center align-items-center mx-5">
          <Input
            type="text"
            style={{ maxWidth: '250px', marginRight: '10px' }}
            name="text"
            inline="true"
            id="search"
            placeholder="Example:George Orwell"
            onChange={handleChangeInput}
          />

          {isLoading ? (
            <div>
              <Button type="submit" color="dark" className="" block>
                <Spinner children="" size="sm" color="light" /> Submit
              </Button>
            </div>
          ) : (
            <Button type="submit" color="dark" className="" block>
              Submit
            </Button>
          )}
        </FormGroup>
      </Form>
      {isLoaded ? (
        <Table books={books} />
      ) : (
        <div style={{ textAlign: 'center', marginTop: '80px' }}>
          <img width="60%" src={bookPic} alt="fd" />
        </div>
      )}
    </>
  );
};
