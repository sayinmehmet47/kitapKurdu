import { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import './App.css';

import { store } from './redux/store';
import Layout from './components/Layout';
import { PrivateRoute } from './components/privateRoute';
import { HelmetProvider } from 'react-helmet-async';

const AllBooks = lazy(() => import('./pages/AllBooks'));
const RecentlyAdded = lazy(() => import('./pages/RecentlyAdded/index'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const EmailVerificationPage = lazy(() => import('./pages/EmailVerificationPage'));
const UploadNewBook = lazy(() => import('./pages/UploadNewBook'));
const UserProfile = lazy(() => import('./components/User'));
const ShelfSpace = lazy(() => import('./pages/ShelfSpace'));
const BookPreviewPage = lazy(() => import('./pages/BookPreview'));
const BookEditPage = lazy(() => import('./pages/BookEditPage').then(m => ({ default: m.BookEditPage })));
const ContactUs = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactUs })));
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'));

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <HelmetProvider>
    <Provider store={store}>
      <BrowserRouter>
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
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
        </Suspense>
      </BrowserRouter>
    </Provider>
  </HelmetProvider>
);
