import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { AuthProvider } from 'react-auth-kit';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import './App.css';
import PrivateRoute from './components/privateRoute';
import AllBooks from './pages/AllBooks';
import Login from './pages/Login';
import RecentlyAdded from './pages/RecentlyAdded';
import { store } from './redux/store';
import Register from './pages/Register';
import UploadNewBook from './pages/UploadNewBook';

import ShelfSpace from './pages/ShelfSpace';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <Provider store={store}>
    <AuthProvider
      authType={'cookie'}
      authName={'_auth'}
      cookieDomain={window.location.hostname}
      cookieSecure={false}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/recently-added" element={<RecentlyAdded />} />
          <Route path="/all-books" element={<AllBooks />} />

          <Route
            path="upload"
            element={
              <PrivateRoute>
                <UploadNewBook />
              </PrivateRoute>
            }
          />
          <Route
            path="shelf-space"
            element={
              <PrivateRoute>
                <ShelfSpace />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </Provider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
