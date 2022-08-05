import { Search } from './components/Search';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AddNewBook } from './components/AddNewBook';
import { GetDownloadLink } from './components/GetDownloadLink';
import Layout from './components/Layout';

function App() {
  return (
    <Layout>
      <Search />
      {/* <AddNewBook /> */}
      <GetDownloadLink />
    </Layout>
  );
}

export default App;
