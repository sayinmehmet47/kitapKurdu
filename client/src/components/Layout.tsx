import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Toaster } from 'sonner';

import { loadUserThunk } from '../redux/authSlice';
import NavbarComponent from './Navbar';
import { Flowbite } from 'flowbite-react';
import { customTheme } from './ui/theme';
import { Dispatch } from '@reduxjs/toolkit';

export default function Layout({ children }: any) {
  const dispatch = useDispatch<Dispatch<any>>();
  useEffect(() => {
    dispatch(loadUserThunk());
  }, [dispatch]);
  return (
    <Flowbite theme={{ theme: customTheme }}>
      <Toaster />
      <div className="flex flex-col min-h-screen bg-gray-100">
        <NavbarComponent />
        <div>{children}</div>
      </div>
    </Flowbite>
  );
}
