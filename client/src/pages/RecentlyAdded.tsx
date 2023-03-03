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
        <CardGroup>
          {recentlyAddedBooks.map((book) => (
            <Card>
              <CardImg
                alt="Card image cap"
                src={
                  //change book.url .jpg to .png
                  book.url?.replace('pdf', 'jpg')
                }
                top
                width="100%"
              />
              <CardBody>
                <CardTitle tag="h5">{book.name}</CardTitle>
                <CardSubtitle className="mb-2 text-muted" tag="h6">
                  {book.name}
                </CardSubtitle>
                <CardText>{book.size}</CardText>
                <Button>Button</Button>
              </CardBody>
            </Card>
          ))}
        </CardGroup>
      </Container>
    </Layout>
  );
};

export default RecentlyAdded;
