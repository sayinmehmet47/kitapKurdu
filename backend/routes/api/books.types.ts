import type { IBook } from '../../models/Books';

export interface ImageLinks {
  smallThumbnail?: string;
  thumbnail?: string;
}

export interface IndustryIdentifier {
  type: 'ISBN_10' | 'ISBN_13' | string;
  identifier: string;
}

export interface VolumeInfo {
  title?: string;
  authors?: string[];
  industryIdentifiers?: IndustryIdentifier[];
  publisher?: string;
  description?: string;
  categories?: string[];
  imageLinks?: ImageLinks;
}

export interface Item {
  id?: string;
  volumeInfo: VolumeInfo;
}

export interface GoogleBooksResponse {
  kind?: string;
  totalItems: number;
  items?: Item[];
}

export interface BooksData {
  results: IBook[];
  total: number;
  page?: number;
  next?: {
    page: number;
    limit?: number;
  };
  previous?: {
    page: number;
    limit?: number;
  };
}
