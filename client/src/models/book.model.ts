export interface BookModel {
  next: {
    page: number;
    limit: number;
  };
  total: number;
  page: number;
  results: {
    _id: string;
    name: string;
    size: number;
    url: string;
    date: string;
    uploader?: BookUploader | string | null;
    __v: number;
    category: string;
    language: string;
    description: string;
    author?: string | null;
    isbn?: string | null;
    publisher?: string | null;
    imageLinks: {
      smallThumbnail: string;
      thumbnail: string;
    };
  }[];
}

export interface BookUploader {
  _id: string;
  username: string;
}

export interface Book {
  name: string;
  file: string;
  date: string;
  size: number;
  _id: string;
  category: string[];
  language: string;
  url?: string;
  description: string;
  author?: string | null;
  isbn?: string | null;
  publisher?: string | null;
  imageLinks: {
    smallThumbnail: string;
    thumbnail: string;
  };
  uploader?: BookUploader | string | null;
}
export interface BooksData {
  results: Book[];
  total: number;
  page?: number;
  next?: {
    page: number;
    limit: number;
  };
  previous?: {
    page: number;
    limit: number;
  };
}
