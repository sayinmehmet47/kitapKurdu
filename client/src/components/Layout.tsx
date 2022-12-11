import React from 'react';
import styled from 'styled-components';
import Footer from './Footer';
import Navbar from './Navbar';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  background-color: white;
  color: black;
`;
const Main = styled.div`
  overflow: hidden;
`;

export default function Layout({ children }: any) {
  return (
    <Wrapper>
      <Navbar />
      <Main>{children}</Main>
      <Footer />
    </Wrapper>
  );
}
