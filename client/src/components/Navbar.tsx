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
    <div className="mb-5">
      <Navbar>
        <Navbar.Brand
          as={Link}
          href="https://flowbite-react.com"
          hrefLang="en"
          to="/"
        >
          <img
            src="/logo-white.svg"
            className="mr-3 h-6 sm:h-9"
            alt="Flowbite React Logo"
          />
        </Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse>
          <Navbar.Link to="/" active>
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
          <UserNav
            username={username}
            email={email}
            avatarUrl="/avatars/01.png"
          />
        </Navbar.Collapse>
      </Navbar>
    </div>
  );
}
