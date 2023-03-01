import axios from 'axios';
import { useState } from 'react';
import { Button, Form, FormGroup, Input, Spinner } from 'reactstrap';
import bytes2Size from './bytes2Size';
import { Table } from './Table';

export const Search = () => {
  const [search, setSearch] = useState('');
  const [books, setBooks] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleChangeInput = (e: any) => {
    setSearch(e.target.value);
  };
  const handleSubmit = (e: any) => {
    e.preventDefault();
    e.target.reset();
    setIsLoading(true);
    axios
      .get(`https://kitapkurdu.onrender.com/books/search`, {
        params: {
          name: search,
        },
      })
      .then((res: any) => res.data)
      .then((d: any) => {
        return Promise.all(
          d.map((e: any) => {
            const path = e.path;
            const url = e.url;
            const { _id: id } = e;
            if (url) {
              return {
                name: e.name,
                file: e.url,
                date: new Date(e.date).toLocaleDateString(),
                size: e.size,
                id,
              };
            } else {
              return fetch(
                encodeURI(
                  `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=https://disk.yandex.com.tr/d/sLURXWsHH4gDmw&path=${path}`
                )
              )
                .then((res) => res.json())
                .then((res) => {
                  return {
                    name: e.name,
                    size: bytes2Size(e.size),
                    date: new Date(e.date).toLocaleDateString(),
                    file: res.href,
                    id: e.id || e._id,
                  };
                });
            }
          })
        ).then((data: any) => {
          setBooks(data);
          setIsLoaded(true);
          setIsLoading(false);
        });
      });
  };

  return (
    <>
      <Form
        className="mx-5 mt-5 pt-5 text-center d-flex flex-column align-items-center"
        onSubmit={handleSubmit}
      >
        <FormGroup className=" justify-content-center align-items-center mx-5 d-flex flex-column flex-md-row">
          <Input
            type="text"
            className="mx-2 d-flex justify-content-center align-items-center my-2"
            style={{ maxWidth: '450px', minWidth: '250px' }}
            name="text"
            inline="true"
            id="search"
            placeholder="Example:George Orwell"
            onChange={handleChangeInput}
            data-testid="search-input"
          />

          {isLoading ? (
            <div>
              <Button
                type="submit"
                color="dark"
                className="d-flex align-items-center"
                block
              >
                <Spinner children="" className="me-2" size="sm" color="light" />{' '}
                Submit
              </Button>
            </div>
          ) : (
            <Button type="submit" color="dark" className="px-5 my-2">
              Submit
            </Button>
          )}
        </FormGroup>
      </Form>
      {isLoaded ? (
        <Table books={books} />
      ) : (
        <div style={{ textAlign: 'center', marginTop: '80px' }}>
          <img width="60%" src="book.png" alt="fd" />
        </div>
      )}
    </>
  );
};
