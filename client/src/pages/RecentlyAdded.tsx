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
import Loading from '../components/Loading';
import styled from 'styled-components';
import Layout from '../components/Layout';
import { useFetchRecentlyAddedQuery } from '../redux/services/book.api';

const Container = styled.div`
  margin-top: 55px;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

type Props = {};

const RecentlyAdded = (props: Props) => {
  const { data: recentlyAddedBooks, isLoading } = useFetchRecentlyAddedQuery();
  console.log('test');

  if (isLoading || !recentlyAddedBooks) {
    return <Loading />;
  }

  return (
    <Layout>
      <Container>
        <Row lg={5} md={3} sm={3} className="d-flex justify-content-center">
          {recentlyAddedBooks?.map((book) => (
            <Card className="m-2" key={book.id}>
              <div className="w-50 d-flex justify-center mx-auto mt-3">
                <CardImg
                  alt="Card image cap"
                  src={
                    book.url?.includes('pdf')
                      ? book.url?.replace('pdf', 'jpg')
                      : 'https://images.pexels.com/photos/8594539/pexels-photo-8594539.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
                  }
                  top
                />
              </div>
              <CardBody>
                <CardTitle tag="h5">{book.name}</CardTitle>
                <CardText>{book.size}</CardText>
              </CardBody>
              <CardFooter>
                {book.url && (
                  <Button color="primary">
                    <Link to={book?.url} className="text-white">
                      Download
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </Row>
      </Container>
    </Layout>
  );
};

export default RecentlyAdded;
