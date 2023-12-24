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
      <Toaster
        toastOptions={{
          unstyled: false,
          classNames: {
            toast: 'bg-blue-400',
            title: 'text-red-400',
            description: 'text-red-400',
            actionButton: 'bg-zinc-400',
            cancelButton: 'bg-orange-400',
            closeButton: 'bg-lime-400',
          },
        }}
      />
      <div className="flex flex-col min-h-screen bg-gradient-to-r from-gray-50 to-gray-200">
        <NavbarComponent />
        <div>{children}</div>
      </div>
    </Flowbite>
  );
}
