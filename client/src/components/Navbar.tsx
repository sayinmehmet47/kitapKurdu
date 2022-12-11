import React from 'react';
import styled from 'styled-components';
import { BiUser } from 'react-icons/bi';
import { Link } from 'react-router-dom';
const Wrapper = styled.nav`
  display: flex;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 50px;
  z-index: 100;
  box-shadow: 0px -1px 1px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease-in-out;
  background-color: black;
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 0 20px;
  cursor: pointer;
`;
const Right = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  height: 100%;
  padding: 0 30px;
  cursor: pointer;
`;

const AddNewBook = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin: 0px 20px;
  &:hover {
    color: #d7a4a4;
  }
`;
const User = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export default function Navbar() {
  return (
    <Wrapper>
      <Link to="/">
        <Left>
          <img src="logo-white.svg" alt="fd" height={60} width={60} />
        </Left>
      </Link>
      <Right>
        <Link to="/upload">
          <AddNewBook>Upload Book</AddNewBook>
        </Link>
        <Link to="/login">
          <User>
            <BiUser color="white" size={25} />
          </User>
        </Link>
      </Right>
    </Wrapper>
  );
}
