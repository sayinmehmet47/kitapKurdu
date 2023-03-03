import React, { SyntheticEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import Layout from '../components/Layout';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { loginThunk } from '../redux/authSlice';
import { mobile } from '../responsive';
import User from '../components/User';

const Container = styled.div`
  width: 100vw;
  height: 100vh;
  background: linear-gradient(
      rgba(255, 255, 255, 0.5),
      rgba(255, 255, 255, 0.5)
    ),
    url('https://cdn.pixabay.com/photo/2019/05/14/21/50/storytelling-4203628_1280.jpg')
      center;
  background-size: cover;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Wrapper = styled.div`
  width: 35%;
  padding: 20px;
  background-color: #f5f5f6;
  ${mobile({ width: '75%' })}
  border-radius: 10px;
  box-shadow: 0px -1px 1px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease-in-out;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 300;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const Input = styled.input`
  flex: 1;
  min-width: 40%;
  margin: 10px 0;
  padding: 10px;
`;

const Button = styled.button`
  border: none;
  padding: 8px 20px;
  background-color: teal;
  color: white;
  cursor: pointer;
  margin-bottom: 10px;
`;

const NavLink = styled(Link)`
  margin: 5px 0px;
  font-size: 12px;
  text-decoration: underline;
  cursor: pointer;
`;

export default function Login() {
  const dispatch = useDispatch<any>();
  const { isLoggedIn, isLoading } = useSelector(
    (state: any) => state.authSlice
  );

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    const { username, password } = Object.fromEntries(data.entries());

    dispatch(loginThunk({ username, password })).then(
      (res: any) => {
        if (res.payload.token) {
          toast.success('Login successful');
        } else {
          toast.error(res.payload.response.data.error);
        }
      },
      (err: any) => {
        console.log(err);
      }
    );
  };

  return (
    <Layout>
      {!isLoading ? (
        <Container>
          {isLoggedIn ? (
            <User />
          ) : (
            <Wrapper>
              <Title>SIGN IN</Title>
              <Form onSubmit={handleSubmit}>
                <Input
                  placeholder="username"
                  type="name"
                  name="username"
                  required
                />
                <Input
                  placeholder="password"
                  type="password"
                  name="password"
                  required
                />
                <Button type="submit">LOGIN</Button>
                <NavLink to="/register">CREATE A NEW ACCOUNT</NavLink>
              </Form>
            </Wrapper>
          )}
        </Container>
      ) : (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: '60vh' }}
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      <ToastContainer />
    </Layout>
  );
}
