import { ReactNode, useEffect, useRef } from 'react';
import { Toaster } from 'sonner';

import NavbarComponent from './Navbar';
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
    <div className="min-h-screen bg-background">
      <Toaster />
      <NavbarComponent />
      <main className="flex-1">{children}</main>
    </div>
  );
}
