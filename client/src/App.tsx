import React from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { Search } from './components/Search';
import 'bootstrap/dist/css/bootstrap.min.css';
import Layout from './components/Layout';
import { ToastContainer } from 'react-toastify';

function App() {
  return (
    <Layout>
      <ToastContainer />
      <Search />
    </Layout>
  );
}

export default App;
