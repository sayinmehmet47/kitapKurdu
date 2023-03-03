import React from 'react';
import { Link } from 'react-router-dom';
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
import styled from 'styled-components';
import Layout from '../components/Layout';
import useFetchRecentlyAddedBooks from '../helpers/hooks/useFetchRecentlyAddedBooks';

const Container = styled.div`
  margin-top: 55px;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

type Props = {};

const RecentlyAdded = (props: Props) => {
  const { recentlyAddedBooks, loading } = useFetchRecentlyAddedBooks();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      <Container>
        <Row lg={4} md={2} sm={2} className="d-flex justify-content-center">
          {recentlyAddedBooks.map((book) => (
            <Card className="m-2" key={book.id}>
              <div className="w-50 d-flex justify-center mx-auto mt-3">
                <CardImg
                  alt="Card image cap"
                  src={book.file?.replace('pdf', 'jpg')}
                  top
                />
              </div>
              <CardBody>
                <CardTitle tag="h5">{book.name}</CardTitle>
                <CardText>{book.size}</CardText>
              </CardBody>
              <CardFooter>
                <Button color="primary">
                  <Link to={book.file} className="text-white">
                    Download
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </Row>
      </Container>
    </Layout>
  );
};

export default RecentlyAdded;
