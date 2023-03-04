import { useEffect, useState } from 'react';
import axiosInstance from '../axiosInstance';
import { Book } from './useFetchBooks';

const useFetchAllBooks = (page: number) => {
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllBooks = async () => {
      try {
        const { data } = await axiosInstance.get(
          'https://kitapkurdu.onrender.com/books/allBooks',
          {
            params: {
              page,
            },
          }
        );

        setTotal(data.total);
        const processedResults = data.results.map((book: any) => {
          const file = book.url;
          const id = book._id || book.id;
          const uploader = book.uploader;
          const name = book.name;
          const size = book.size;
          const date = new Date(book.date).toLocaleDateString();

          return {
            name,
            file,
            date,
            size,
            uploader,
            id,
          };
        });

        setAllBooks(processedResults);
      } catch (error) {
        console.log(error);
      }

      setLoading(false);
    };

    fetchAllBooks();
  }, [page]);

  return { allBooks, total, loading };
};

export default useFetchAllBooks;
