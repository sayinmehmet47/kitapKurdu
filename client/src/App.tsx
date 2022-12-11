import { Search } from './components/Search';
import 'bootstrap/dist/css/bootstrap.min.css';
import Layout from './components/Layout';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loadUserThunk } from './redux/authSlice';

function App() {
  return (
    <Layout>
      <Search />
    </Layout>
  );
}

export default App;
