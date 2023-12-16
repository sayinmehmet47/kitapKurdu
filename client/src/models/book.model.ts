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
    uploader: string;
    __v: number;
    category: string;
    language: string;
    description: string;
    imageLinks: {
      smallThumbnail: string;
      thumbnail: string;
    };
  }[];
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
  imageLinks: {
    smallThumbnail: string;
    thumbnail: string;
  };
  uploader: {
    username: string;
    _id: string;
    email: string;
  };
}
export interface BooksData {
  results: Book[];
  total: number;
  page: number;
  next: {
    page: number;
  };
  previous: {
    page: number;
  };
}
