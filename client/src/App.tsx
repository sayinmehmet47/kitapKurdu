import ReactGA from 'react-ga4';
import { Search } from './components/Search';
import 'bootstrap/dist/css/bootstrap.min.css';
import Layout from './components/Layout';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

ReactGA.initialize('G-R54SYJD2B8');

function App() {
  const location = useLocation();

  useEffect(() => {
    ReactGA.send('pageview');
  }, [location]);
  return (
    <Layout>
      <Search />
    </Layout>
  );
}

export default App;
