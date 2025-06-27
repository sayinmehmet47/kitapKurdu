import { useEffect, ReactNode } from 'react';
import { Toaster } from 'sonner';

import { loadUserThunk } from '../redux/authSlice';
import NavbarComponent from './Navbar';
import { Flowbite } from 'flowbite-react';
import { customTheme } from './ui/theme';
import { useAppDispatch } from '@/redux/store';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const loadUser = async () => {
      try {
        await dispatch(loadUserThunk()).unwrap();
      } catch (error) {
        // Silently handle authentication errors
        console.log('Authentication check failed:', error);
      }
    };

    loadUser();
  }, [dispatch]);

  return (
    <div>
      <Toaster />
      <Flowbite theme={{ theme: customTheme }}>
        <div className="flex flex-col min-h-screen bg-gradient-to-r from-gray-50 to-gray-200">
          <NavbarComponent />
          <div>{children}</div>
        </div>
      </Flowbite>
    </div>
  );
}
