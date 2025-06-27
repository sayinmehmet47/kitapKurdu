import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/redux/store';

interface PrivateRouteProps {
  redirectPath?: string;
  children: ReactNode;
}

export const PrivateRoute = ({
  redirectPath = '/login',
  children,
}: PrivateRouteProps) => {
  const isLoggedIn = useAppSelector((state) => state.authSlice.isLoggedIn);

  if (!isLoggedIn) {
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};
