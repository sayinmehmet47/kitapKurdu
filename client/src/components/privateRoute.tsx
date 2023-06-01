import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({
  redirectPath = '/login',
  children,
}: {
  redirectPath?: string;
  children: React.ReactNode;
}) => {
  const isLoggedIn = useSelector((state: any) => state.authSlice.isLoggedIn);
  console.log(isLoggedIn);
  if (!isLoggedIn) {
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default PrivateRoute;
