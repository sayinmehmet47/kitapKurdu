import { useEffect, useState } from 'react';
import { Button, Form, FormGroup, Input, Spinner } from 'reactstrap';
import { Table } from './Table';
import { useLazySearchBooksQuery } from '../redux/services/book.api';

export const Search = () => {
  const [searchBook, { data: books, isLoading, isError }] =
    useLazySearchBooksQuery();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  useEffect(() => {
    if (!search) return;
    searchBook({ name: search, page });
  }, [page, searchBook]);

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    searchBook({ name: search, page });
  };

  if (isError) {
    return <div>Something went wrong</div>;
  }

  return (
    <>
      <Form
        className="mx-5 mt-5 pt-5 text-center d-flex flex-column align-items-center"
        onSubmit={handleSubmit}
      >
        <FormGroup className="justify-content-center align-items-center mx-5 d-flex flex-column flex-md-row">
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
      {books && <Table books={books} setPage={setPage} isLoading={isLoading} />}
    </>
  );
};
