import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import './App.css';

import AllBooks from './pages/AllBooks';
import RecentlyAdded from './pages/RecentlyAdded/index';
import { store } from './redux/store';
import AuthPage from './pages/AuthPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import UploadNewBook from './pages/UploadNewBook';
import UserProfile from './components/User';
import Layout from './components/Layout';

import ShelfSpace from './pages/ShelfSpace';
import { PrivateRoute } from './components/privateRoute';
import BookPreviewPage from './pages/BookPreview';
import { BookEditPage } from './pages/BookEditPage';
import { ContactUs } from './pages/ContactPage';
import AdminAnalytics from './pages/AdminAnalytics';
import { HelmetProvider } from 'react-helmet-async';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <HelmetProvider>
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/recently-added" element={<RecentlyAdded />} />
          <Route path="/all-books" element={<AllBooks />} />
          <Route path="/book/:bookId" element={<BookPreviewPage />} />
          <Route path="/book/edit/:bookId" element={<BookEditPage />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Layout>
                  <UserProfile />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <PrivateRoute>
                <UploadNewBook />
              </PrivateRoute>
            }
          />
          <Route
            path="/shelf-space"
            element={
              <PrivateRoute>
                <ShelfSpace />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <PrivateRoute>
                <AdminAnalytics />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </Provider>
  </HelmetProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
