import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { loadUserThunk } from '../redux/authSlice';
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
  const dispatch = useDispatch<any>();
  useEffect(() => {
    dispatch(loadUserThunk());
  }, [dispatch]);
  return (
    <Wrapper>
      <Navbar />
      <Main>{children}</Main>
      {/* <Footer /> */}
    </Wrapper>
  );
}
