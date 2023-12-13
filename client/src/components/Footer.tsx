import React from 'react';
import styled from 'styled-components';
import { FaGithub, FaLinkedin } from 'react-icons/fa';

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  position: fixed;
  padding: 0 20px;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 50px;

  box-shadow: 0px -1px 1px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease-in-out;
  background-color: #f5f5f6;
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: black;
  margin: 0px 20px;
`;
const IconGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  &:hover {
    cursor: pointer;
  }
`;

const Icon = styled.div`
  &:hover {
    color: #c97474;
  }
  margin: 0px 10px;
`;

const Anchor = styled.a`
  color: black;
`;

export default function Footer() {
  return (
    <Wrapper>
      <Title>Made with ❤️ by Mehmet Sayin</Title>
      <IconGroup>
        <Anchor href="https://github.com/sayinmehmet47">
          <Icon>
            <FaGithub size={25} />
          </Icon>
        </Anchor>
        <Anchor href="https://www.linkedin.com/in/sayinmehmet/">
          <Icon>
            <FaLinkedin size={25} />
          </Icon>
        </Anchor>
      </IconGroup>
    </Wrapper>
  );
}
