import { PropsWithChildren } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps extends PropsWithChildren<any> {
  redirectPath?: string;
}

export const PrivateRoute = ({
  redirectPath = '/login',
  children,
}: PrivateRouteProps) => {
  const isLoggedIn = useSelector((state: any) => state.authSlice.isLoggedIn);

  if (!isLoggedIn) {
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};
