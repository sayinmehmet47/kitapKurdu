import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutThunk } from '../redux/authSlice';

export default function User() {
  const dispatch = useDispatch();

  const { username, isAdmin, email, createdAt } = useSelector(
    (state) => state.authSlice.user.user
  );

  const handleLogout = () => {
    dispatch(logoutThunk());
  };

  return (
    <div>
      <h1>{username}</h1>
      <p>{isAdmin ? 'Admin' : 'User'}</p>
      <p>{email}</p>
      <p>{new Date(createdAt).toISOString()}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
