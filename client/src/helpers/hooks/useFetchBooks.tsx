import { useEffect, useState } from 'react';
import axiosInstance from '../axiosInstance';
import bytes2Size from '../bytes2Size';

export type Book = {
  name: string;
  file: string;
  date: string;
  size: string;
  id: string;
  url?: string;
  uploader: {
    username: string;
    _id: string;
    email: string;
  };
};

export type BooksData = {
  results: Book[];
  total: number;
  next: {
    page: number;
  };
  previous: {
    page: number;
  };
};

export type UseFetchBooksResult = {
  books: BooksData;
  isLoading: boolean;
  isLoaded: boolean;
  setIsLoading: (loading: boolean) => void;
  refresh: () => void;
};

const useFetchBooks = (query: string, page: number): UseFetchBooksResult => {
  const [books, setBooks] = useState<BooksData>({
    results: [],
    total: 0,
    next: {
      page: 1,
    },
    previous: {
      page: 1,
    },
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [refreshVar, setRefreshVar] = useState(false);

  const refresh = () => {
    setRefreshVar((v) => !v);
  };

  useEffect(() => {
    if (!query) return;

    const fetchBooks = async () => {
      try {
        setIsLoading(true);
        const { data } = await axiosInstance.get(
          `https://kitapkurdu.onrender.com/books/search?name=${query}&page=${page}`
        );

        const processedResults = await Promise.all(
          data.results.map(async (book: any) => {
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

        setBooks({
          results: processedResults,
          total: data.total,
          next: data.next,
          previous: data.previous,
        });
        setIsLoaded(true);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, [query, page, refreshVar]);

  return { books, isLoading, isLoaded, setIsLoading, refresh };
};

export default useFetchBooks;