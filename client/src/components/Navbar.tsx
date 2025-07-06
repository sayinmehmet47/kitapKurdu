import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Menu, X } from 'lucide-react';
import { RootState } from '@/redux/store';
import { UserNav } from './ui/user-avatar';
import { Button } from './ui/button';
import { ThemeToggle } from './ui/theme-toggle';
import { LoadingSpinner } from './ui/loading';
import { cn } from '@/lib/utils';

const NavLink = ({
  to,
  children,
  mobile = false,
}: {
  to: string;
  children: React.ReactNode;
  mobile?: boolean;
}) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to}>
      <Button
        variant={isActive ? 'default' : 'ghost'}
        className={cn(
          'transition-colors duration-200',
          mobile ? 'w-full justify-start' : '',
          isActive
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'text-foreground hover:text-primary hover:bg-primary/10'
        )}
      >
        {children}
      </Button>
    </Link>
  );
};

export default function NavbarComponent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { username, email } = useSelector(
    (state: RootState) => state.authSlice.user.user
  );
  const { isAuthLoaded, isLoading } = useSelector(
    (state: RootState) => state.authSlice
  );

  // Debug logging
  console.log('Navbar auth state:', {
    isAuthLoaded,
    isLoading,
    username,
    email,
  });

  // Show loading only if currently loading and auth hasn't been loaded yet
  const showLoading = isLoading && !isAuthLoaded;

  const navigationLinks = [
    { to: '/', label: 'Home' },
    { to: '/recently-added', label: 'Recently Added' },
    { to: '/upload', label: 'Upload Book' },
    { to: '/all-books', label: 'All Books' },
    { to: '/shelf-space', label: 'Shelf Space' },
    { to: '/contact-us', label: 'Contact Us' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                K
              </span>
            </div>
            <span className="text-xl font-bold text-foreground">
              KitapKurdu
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationLinks.map((link) => (
              <NavLink key={link.to} to={link.to}>
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* User Navigation & Mobile Menu Button */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Avatar */}
            <div className="flex items-center">
              {showLoading ? (
                <div className="flex items-center justify-center h-10 w-10">
                  <LoadingSpinner size={24} />
                </div>
              ) : (
                <UserNav
                  username={username}
                  email={email}
                  avatarUrl="/avatars/01.png"
                />
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-border/40">
            {navigationLinks.map((link) => (
              <NavLink key={link.to} to={link.to} mobile>
                {link.label}
              </NavLink>
            ))}
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
