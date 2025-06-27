import { ReactNode, useEffect, useRef } from 'react';
import { Toaster } from 'sonner';

import NavbarComponent from './Navbar';
import { Flowbite } from 'flowbite-react';
import { customTheme } from './ui/theme';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { loadUserThunk } from '@/redux/authSlice';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const dispatch = useAppDispatch();
  const { isAuthLoaded, isLoading } = useAppSelector(
    (state) => state.authSlice
  );
  const authInitialized = useRef(false);

  useEffect(() => {
    if (!authInitialized.current && !isAuthLoaded && !isLoading) {
      authInitialized.current = true;

      const initializeAuth = async () => {
        try {
          await dispatch(loadUserThunk()).unwrap();
        } catch (error) {
          console.log('Authentication initialization failed:', error);
        }
      };

      initializeAuth();
    }
  }, [dispatch, isAuthLoaded, isLoading]);

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
