import { Search } from './components/Search';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AddNewBook } from './components/AddNewBook';
import { GetDownloadLink } from './components/GetDownloadLink';

function App() {
  return (
    <div className="App">
      <Search />
      <AddNewBook />
      <GetDownloadLink />
    </div>
  );
}

export default App;
