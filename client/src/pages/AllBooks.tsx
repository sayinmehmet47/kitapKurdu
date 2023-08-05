import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Pagination from '@mui/material/Pagination';
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardImg,
  CardText,
  CardTitle,
  Row,
} from 'reactstrap';
import Loading from '../components/Loading';
import styled from 'styled-components';
import Layout from '../components/Layout';
import { useFetchAllBooksQuery } from '../redux/services/book.api';

const Container = styled.div`
  margin-top: 55px;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const AllBooks = () => {
  const [page, setPage] = useState(1);
  const { data: bookData, isLoading, isFetching } = useFetchAllBooksQuery(page);

  const handleChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  if (isLoading || isFetching) {
    console.log('loading!!');
    return <Loading />;
  }

  return (
    <Layout>
      <Container>
        <Row lg={6} md={4} sm={3} className="d-flex justify-content-center">
          {bookData?.results.map((book) => (
            <Card className="m-2" key={book.id}>
              <div className="w-50 d-flex justify-center mx-auto mt-3">
                <CardImg
                  alt="Card image cap"
                  src={
                    book.url?.includes('pdf')
                      ? book.url?.replace('pdf', 'jpg')
                      : book.url?.includes('epub')
                      ? 'https://images.pexels.com/photos/8594539/pexels-photo-8594539.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
                      : 'https://images.pexels.com/photos/7829649/pexels-photo-7829649.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
                  }
                  top
                />
              </div>
              <CardBody>
                <CardTitle tag="h5">{book.name}</CardTitle>
                <CardText>{book.size}</CardText>
              </CardBody>
              <CardFooter>
                <Button color="primary">
                  <Link to={book.url} className="text-white">
                    Download
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </Row>
      </Container>
      {bookData && (
        <div className="d-flex justify-content-center mt-4 mb-4">
          <Pagination
            count={Math.ceil(bookData?.total / 10)}
            color="primary"
            boundaryCount={2}
            page={page}
            onChange={handleChange}
          />
        </div>
      )}
    </Layout>
  );
};

export default AllBooks;
