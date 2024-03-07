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
    <div>
      <Toaster />
      <Flowbite theme={{ theme: customTheme }}>
        <div className="flex flex-col min-h-screen bg-gradient-to-r from-gray-50 to-gray-200">
          <NavbarComponent />
          <div>{children}</div>
        </div>
      </Flowbite>
    </div>
  );
}
