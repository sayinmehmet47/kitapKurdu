import useFetchBooks from '../helpers/hooks/useFetchBooks';
import { useState } from 'react';
import { Button, Form, FormGroup, Input, Spinner } from 'reactstrap';
import { Table } from './Table';

export const Search = () => {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  const [page, setPage] = useState(1);

  const handleChangeInput = (e: any) => {
    setSearch(e.target.value);
  };

  const { books, isLoading, setIsLoading, refresh } = useFetchBooks(
    query,
    page
  );

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    setQuery(search);
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
                <Spinner
                  color="light"
                  size="sm"
                  className="me-2"
                  data-testid="spinner"
                />
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
      {books.results.length < 1 ? (
        <div style={{ textAlign: 'center', marginTop: '80px' }}>
          <img width="60%" src="book.png" alt="fd" />
        </div>
      ) : (
        <Table
          books={books}
          setPage={setPage}
          refresh={refresh}
          isLoading={isLoading}
        />
      )}
    </>
  );
};
