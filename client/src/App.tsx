import ReactGA from 'react-ga';
import { Search } from './components/Search';
import 'bootstrap/dist/css/bootstrap.min.css';
import Layout from './components/Layout';

ReactGA.initialize('G-6H6Q971J60');
function App() {
  return (
    <Layout>
      <Search />
    </Layout>
  );
}

export default App;
