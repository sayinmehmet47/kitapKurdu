import axios from 'axios';
import { useEffect, useState } from 'react';
import bytes2Size from '../bytes2Size';

export type Book = {
  name: string;
  file: string;
  date: string;
  size: string;
  id: string;
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

  useEffect(() => {
    if (!query) return;

    const fetchBooks = async () => {
      try {
        setIsLoading(true);
        const { data } = await axios.get(
          `https://kitapkurdu.onrender.com/books/search?name=${query}&page=${page}`
        );

        const processedResults = await Promise.all(
          data.results.map(async (book: any) => {
            const path = book.path;
            const url = book.url;
            const id = book._id || book.id;

            if (url) {
              return {
                name: book.name,
                file: book.url,
                date: new Date(book.date).toLocaleDateString(),
                size: book.size,
                id,
              };
            } else {
              const res = await fetch(
                encodeURI(
                  `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=https://disk.yandex.com.tr/d/sLURXWsHH4gDmw&path=${path}`
                )
              );
              const { href } = await res.json();
              return {
                name: book.name,
                size: bytes2Size(book.size),
                date: new Date(book.date).toLocaleDateString(),
                file: href,
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
  }, [query, page]);

  return { books, isLoading, isLoaded, setIsLoading };
};

export default useFetchBooks;
