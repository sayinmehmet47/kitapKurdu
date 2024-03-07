import { Navbar } from 'flowbite-react';
import { UserNav } from './ui/user-avatar';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

export default function NavbarComponent() {
  const { username, email } = useSelector(
    (state: RootState) => state.authSlice.user.user
  );

  return (
    <Navbar className="py-6">
      <Navbar.Brand as={Link} hrefLang="en" to="/">
        <img src="/logo-white.svg" className="h-6" alt="Flowbite React Logo" />
      </Navbar.Brand>
      <Navbar.Toggle />
      <Navbar.Collapse>
        <Navbar.Link to="/" as={Link} active={window.location.pathname === '/'}>
          Home
        </Navbar.Link>
        <Navbar.Link
          as={Link}
          to="/recently-added"
          active={window.location.pathname === '/recently-added'}
        >
          Recently Added
        </Navbar.Link>
        <Navbar.Link
          as={Link}
          to="/upload"
          active={window.location.pathname === '/upload'}
        >
          Upload Book
        </Navbar.Link>
        <Navbar.Link
          as={Link}
          to="/all-books"
          active={window.location.pathname === '/all-books'}
        >
          All Books
        </Navbar.Link>
        <Navbar.Link
          as={Link}
          to="/shelf-space"
          active={window.location.pathname === '/shelf-space'}
        >
          Shelf Space
        </Navbar.Link>
        <Navbar.Link
          as={Link}
          to="/contact-us"
          active={window.location.pathname === '/contact-us'}
        >
          Contact Us
        </Navbar.Link>
        <Navbar.Link className="h-full md:h-4 flex items-center cursor-pointer">
          <UserNav
            username={username}
            email={email}
            avatarUrl="/avatars/01.png"
          />
        </Navbar.Link>
      </Navbar.Collapse>
    </Navbar>
  );
}
