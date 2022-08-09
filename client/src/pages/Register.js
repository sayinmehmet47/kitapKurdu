import styled from 'styled-components';
import { mobile } from '../responsive';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { registerThunk } from '../redux/authSlice';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from '../components/Layout';

const Container = styled.div`
  width: 100vw;
  height: 100vh;
  background: linear-gradient(
      rgba(255, 255, 255, 0.5),
      rgba(255, 255, 255, 0.5)
    ),
    url('https://cdn.pixabay.com/photo/2016/09/10/17/18/book-1659717_1280.jpg')
      center;
  background-size: cover;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Wrapper = styled.div`
  border-radius: 5px;
  width: 40%;
  padding: 20px;
  background-color: white;
  ${mobile({ width: '75%' })}
  box-shadow: 0px -1px 1px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease-in-out;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 300;
`;

const Form = styled.form`
  display: flex;
  flex-wrap: wrap;
`;

const Input = styled.input`
  flex: 1;
  min-width: 40%;
  margin: 20px 10px 0px 0px;
  padding: 10px;
`;

const Agreement = styled.span`
  font-size: 12px;
  margin: 20px 0px;
`;

const Button = styled.button`
  width: 40%;
  border: none;
  padding: 15px 20px;
  background-color: teal;
  color: white;
  cursor: pointer;
`;

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const { username, password, email, passwordRepeat } = Object.fromEntries(
      data.entries()
    );
    if (passwordRepeat === password) {
      dispatch(registerThunk({ username, password, email })).then(
        (res) => {
          if (res.payload.data) {
            toast.success('Successfully registered');
            setTimeout(() => {
              navigate('/upload');
            }, 1000);
          } else {
            toast.error(res.payload.response.data.msg);
          }
        },
        (err) => {
          console.log(err);
        }
      );
    } else {
      alert('Passwords do not match');
    }
  };

  return (
    <Layout>
      <Container>
        <ToastContainer />

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
