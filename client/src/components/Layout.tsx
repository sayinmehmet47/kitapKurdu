import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import styled from 'styled-components';
import { loadUserThunk } from '../redux/authSlice';
import NavbarComponent from './Navbar';
import { CustomFlowbiteTheme, Flowbite } from 'flowbite-react';
import { customTheme } from './ui/theme';

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
    <Flowbite theme={{ theme: customTheme }}>
      <Wrapper>
        <ToastContainer />
        <NavbarComponent />
        <Main>{children}</Main>
      </Wrapper>
    </Flowbite>
  );
}
