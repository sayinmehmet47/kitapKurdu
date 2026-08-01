import { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './App';
import './App.css';
import './accessibility.css';

import { HelmetProvider } from 'react-helmet-async';
import Layout from './components/Layout';
import { PrivateRoute } from './components/privateRoute';
import RouteAccessibilityManager from './components/RouteAccessibilityManager';
import SkipLink from './components/SkipLink';
import { LoadingSpinner } from './components/ui/loading';
import { store } from './redux/store';

const AllBooks = lazy(() => import('./pages/AllBooks'));
const RecentlyAdded = lazy(() => import('./pages/RecentlyAdded/index'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const EmailVerificationPage = lazy(() => import('./pages/EmailVerificationPage'));
const UploadNewBook = lazy(() => import('./pages/UploadNewBook'));
const UserProfile = lazy(() => import('./components/User'));
const ShelfSpace = lazy(() => import('./pages/ShelfSpace'));
const BookPreviewPage = lazy(() => import('./pages/BookPreview'));
const BookEditPage = lazy(() =>
  import('./pages/BookEditPage').then((m) => ({ default: m.BookEditPage }))
);
const ContactUs = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactUs })));
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'));
const AdminDuplicateAudit = lazy(() => import('./pages/AdminDuplicateAudit'));

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <HelmetProvider>
    <Provider store={store}>
      <BrowserRouter>
        <SkipLink />
        <RouteAccessibilityManager />
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <LoadingSpinner size={32} />
            </div>
          }
        >
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
            <Route
              path="/admin/duplicate-audit"
              element={
                <PrivateRoute>
                  <AdminDuplicateAudit />
                </PrivateRoute>
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </Provider>
  </HelmetProvider>
);
