import axios from 'axios';
import { useEffect, useState } from 'react';
import axiosInstance from '../axiosInstance';
import bytes2Size from '../bytes2Size';
import { Book } from './useFetchBooks';

const useFetchRecentlyAddedBooks = () => {
  const [recentlyAddedBooks, setRecentlyAddedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentlyAddedBooks = async () => {
      try {
        const { data } = await axios.get(
          'https://kitapkurdu.onrender.com/books/recently-added'
        );

        const processedResults = await Promise.all(
          data.map(async (book: any) => {
            const path = book.path;
            const url = book.url;
            const id = book._id || book.id;
            const uploader = book.uploader;

            if (url) {
              return {
                name: book.name,
                file: book.url,
                date: new Date(book.date).toLocaleDateString(),
                size: book.size,
                uploader,
                id,
              };
            } else {
              const res = await axiosInstance.get(
                encodeURI(
                  `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=https://disk.yandex.com.tr/d/sLURXWsHH4gDmw&path=${path}`
                )
              );
              const { href } = await res.data;
              return {
                name: book.name,
                size: bytes2Size(book.size),
                date: new Date(book.date).toLocaleDateString(),
                file: href,
                uploader,
                id,
              };
            }
          })
        );
        setRecentlyAddedBooks(processedResults);
      } catch (error) {
        console.log(error);
      }

      setLoading(false);
    };

    fetchRecentlyAddedBooks();
  }, []);

  return { recentlyAddedBooks, loading };
};

export default useFetchRecentlyAddedBooks;
