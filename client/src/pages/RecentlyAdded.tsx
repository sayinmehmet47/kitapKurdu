import React from 'react';
import {
  Button,
  Card,
  CardBody,
  CardGroup,
  CardImg,
  CardSubtitle,
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
        <Row lg={4} md={2} sm={1} className="d-flex justify-content-center">
          {recentlyAddedBooks.map((book) => (
            <Card className="m-2">
              <div className="w-50 d-flex justify-center mx-auto mt-3">
                <CardImg
                  alt="Card image cap"
                  src={
                    //change book.url .jpg to .png
                    book.url?.replace('pdf', 'jpg')
                  }
                  top
                />
              </div>
              <CardBody>
                <CardTitle tag="h5">{book.name}</CardTitle>
                <CardSubtitle className="mb-2 text-muted" tag="h6">
                  {book.name}
                </CardSubtitle>
                <CardText>{book.size}</CardText>
              </CardBody>
            </Card>
          ))}
        </Row>
      </Container>
    </Layout>
  );
};

export default RecentlyAdded;
