import { type ReactNode, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { loadUserThunk } from '@/redux/authSlice';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import Footer from './Footer';
import NavbarComponent from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isAuthLoaded, isLoading } = useAppSelector((state) => state.authSlice);
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
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster />
      <NavbarComponent />
      <main
        id="main-content"
        data-route-path={location.pathname}
        tabIndex={-1}
        className="flex-1 scroll-mt-16"
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
