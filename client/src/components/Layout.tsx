import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import Marquee from 'react-fast-marquee';
import styled from 'styled-components';
import { loadUserThunk } from '../redux/authSlice';
import NavbarComponent from './Navbar';

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
      <ToastContainer />
      <NavbarComponent />
      <Marquee className="mt-5 bg-info">
        Kütüphanemize katkıda bulunarak, diğer kullanıcıların da okumasına
        yardımcı olabilirsiniz!.Kütüphanemize katki saglamak icin uploadBook
        sekmesini kullanabilirsiniz. Yeni kitap önerileriniz için bize katılın!
      </Marquee>{' '}
      <Main>{children}</Main>
    </Wrapper>
  );
}
