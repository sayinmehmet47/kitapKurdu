import ReactGA from 'react-ga4';

import { useDispatch } from 'react-redux';

import { registerThunk } from '../../redux/authSlice';
import Layout from '../../components/Layout';
import { SyntheticEvent } from 'react';
import {
  Agreement,
  Button,
  Container,
  Form,
  Input,
  Title,
  Wrapper,
} from './Register.style';
import { toast } from 'sonner';

const Register = () => {
  const dispatch = useDispatch<any>();

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    ReactGA.event({
      category: 'engagement',
      action: 'submit_form',
      label: 'register_form',
    });
    const data = new FormData(e.target as HTMLFormElement);
    const { username, password, email, passwordRepeat } = Object.fromEntries(
      data.entries()
    );
    if (passwordRepeat === password) {
      dispatch(registerThunk({ username, password, email })).then((res) => {
        if (res.meta.requestStatus === 'rejected') {
          toast.error(res.payload);
        } else {
          console.log('Registration succeeded:', res.payload);
          toast.success('Successfully registered');
        }
      });
    }
  };

  return (
    <Layout>
      <Container>
        <Wrapper>
          <Title>CREATE AN ACCOUNT</Title>
          <Form onSubmit={handleSubmit}>
            <Input
              name="username"
              placeholder="username"
              type="name"
              required
            />
            <Input name="email" placeholder="email" type="email" required />
            <Input
              name="password"
              placeholder="password"
              type="password"
              required
            />
            <Input
              required
              name="passwordRepeat"
              placeholder="confirm password"
              type="password"
            />
            <Agreement>
              By creating an account, I consent to the processing of my personal
              data in accordance with the <b>PRIVACY POLICY</b>
            </Agreement>
            <Button type="submit">CREATE</Button>
          </Form>
        </Wrapper>
      </Container>
    </Layout>
  );
};

export default Register;
