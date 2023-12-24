import { useDispatch, useSelector } from 'react-redux';
import { logoutThunk } from '../redux/authSlice';
import { Dispatch } from '@reduxjs/toolkit';
import { RootState } from 'redux/store';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
} from '@/components';

export default function User() {
  const dispatch = useDispatch<Dispatch<any>>();

  const { username, isAdmin, email } = useSelector(
    (state: RootState) => state.authSlice.user.user
  );

  const handleLogout = () => {
    dispatch(logoutThunk());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role:</CardTitle>
        <CardDescription className="text-base">
          {isAdmin ? 'Admin' : 'User'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CardTitle>Username:</CardTitle>
        <CardDescription className="text-base">{username}</CardDescription>
      </CardContent>
      <CardContent>
        <CardTitle>Email:</CardTitle>
        <CardDescription className="text-base">{email}</CardDescription>
      </CardContent>
      <CardFooter className="justify-center">
        <Button variant="destructive" onClick={handleLogout}>
          Logout
        </Button>
      </CardFooter>
    </Card>
  );
}
