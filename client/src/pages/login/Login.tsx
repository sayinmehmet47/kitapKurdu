import { SyntheticEvent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { toast } from 'sonner';

import { loginThunk } from '@/redux/authSlice';
import Layout from '@/components/Layout';
import User from '@/components/User';

import { Spinner } from 'flowbite-react';
import { regSw } from '@/App';
import {
  Button,
  Container,
  Form,
  Input,
  NavLink,
  Title,
  Wrapper,
} from './Login.style';

export default function Login() {
  const dispatch = useDispatch<any>();
  const { isLoggedIn, isLoading, user } = useSelector(
    (state: any) => state.authSlice
  );

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    const { username, password } = Object.fromEntries(data.entries());
    try {
      dispatch(loginThunk({ username, password }));
    } catch (error) {
      toast.error('Something went wrong');
    }
  };
  useEffect(() => {
    if (isLoggedIn) {
      toast.success('Login successful');
      regSw(user.user);
    }
  }, [isLoggedIn, user.user]);
  return (
    <Layout>
      <Container>
        {isLoggedIn ? (
          <User />
        ) : !isLoading ? (
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
        ) : (
          <Spinner />
        )}
      </Container>
    </Layout>
  );
}
