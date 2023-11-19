import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { pdfjs } from 'react-pdf';
import App from './App';
import './App.css';

import AllBooks from './pages/AllBooks';
import Login from './pages/Login';
import RecentlyAdded from './pages/RecentlyAdded';
import { store } from './redux/store';
import Register from './pages/Register';
import UploadNewBook from './pages/UploadNewBook';

import ShelfSpace from './pages/ShelfSpace';
import { PrivateRoute } from './components/privateRoute';
import { BookPreviewPage } from './pages/BookPreviewPage';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

root.render(
  <Provider store={store}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/recently-added" element={<RecentlyAdded />} />
        <Route path="/all-books" element={<AllBooks />} />
        <Route path="book/:bookId" element={<BookPreviewPage />} />

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
  </Provider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
