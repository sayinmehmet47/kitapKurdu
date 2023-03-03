import axios from 'axios';
import { useEffect, useState } from 'react';
import { Book } from './useFetchBooks';

const useFetchRecentlyAddedBooks = () => {
  const [recentlyAddedBooks, setRecentlyAddedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentlyAddedBooks = async () => {
      const { data } = await axios.get(
        'https://kitapkurdu.onrender.com/books/recently-added'
      );
      setRecentlyAddedBooks(data);
      setLoading(false);
    };

    fetchRecentlyAddedBooks();
  }, []);

  return { recentlyAddedBooks, loading };
};

export default useFetchRecentlyAddedBooks;
