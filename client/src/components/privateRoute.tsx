import { ReactNode, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/redux/store';
import { loadUserThunk } from '@/redux/authSlice';
import { LoadingSpinner } from '@/components/ui/loading';

interface PrivateRouteProps {
  redirectPath?: string;
  children: ReactNode;
}

export const PrivateRoute = ({
  redirectPath = '/login',
  children,
}: PrivateRouteProps) => {
  const dispatch = useAppDispatch();
  const { isLoggedIn, isAuthLoaded, isLoading } = useAppSelector((state) => ({
    isLoggedIn: state.authSlice.isLoggedIn,
    isAuthLoaded: state.authSlice.isAuthLoaded,
    isLoading: state.authSlice.isLoading,
  }));

  const authInitialized = useRef(false);

  useEffect(() => {
    if (!authInitialized.current && !isAuthLoaded && !isLoading) {
      authInitialized.current = true;

      const initializeAuth = async () => {
        try {
          await dispatch(loadUserThunk()).unwrap();
        } catch (error) {
          console.log('Authentication check failed:', error);
        }
      };

      initializeAuth();
    }
  }, [dispatch, isAuthLoaded, isLoading]);

  if (!isAuthLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (isAuthLoaded && !isLoggedIn) {
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};
