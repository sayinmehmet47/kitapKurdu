import { Search } from './components/Search';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AddNewBook } from './components/AddNewBook';
import Layout from './components/Layout';

function App() {
  return (
    <Layout>
      <Search />
      {/* <AddNewBook /> */}
    </Layout>
  );
}

export default App;
