import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ redirectPath = '/login', children }) => {
  const isLoggedIn = useSelector((state) => state.authSlice.isLoggedIn);
  console.log(isLoggedIn);
  if (!isLoggedIn) {
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default PrivateRoute;
