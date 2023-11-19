import React, { useState } from 'react';

import { Link } from 'react-router-dom';
import { BiUser } from 'react-icons/bi';
import {
  NavbarBrand,
  NavbarToggler,
  Collapse,
  Nav,
  NavItem,
  NavbarText,
  Navbar,
} from 'reactstrap';

export default function NavbarComponent(args: any) {
  const [collapsed, setCollapsed] = useState(true);
  const toggleNavbar = () => setCollapsed(!collapsed);
  return (
    <div className="mb-5">
      <Navbar color="dark" fixed="top" expand="md">
        <div className="cursor-pointer">
          <Link to="/">
            <img src="logo-white.svg" alt="fd" height={60} width={90} />
          </Link>
        </div>
        <NavbarToggler onClick={toggleNavbar} />
        <Collapse navbar isOpen={!collapsed}>
          <Nav className="me-auto" navbar>
            <div className="d-md-flex">
              <NavItem className="px-md-5 ">
                <Link to="/recently-added" className="text-white nav-link">
                  Recently Added
                </Link>
              </NavItem>
              <NavItem className="px-md-4">
                <Link to="/upload" className="text-white nav-link">
                  Upload Book
                </Link>
              </NavItem>
              <NavItem className="px-md-4">
                <Link to="/all-books" className="text-white nav-link">
                  All Books
                </Link>
              </NavItem>
              <NavItem className="px-md-4">
                <Link to="/shelf-space" className="text-white nav-link">
                  Shelf Space
                </Link>
              </NavItem>
            </div>
          </Nav>
          <NavbarText className="me-3">
            <Link to="/login">
              <BiUser color="white" size={25} />
            </Link>
          </NavbarText>
        </Collapse>
      </Navbar>
    </div>
  );
}
