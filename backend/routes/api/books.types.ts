import type { Types } from 'mongoose';
import type { IBook } from '../../models/Books';

export interface PublicUploader {
  _id: Types.ObjectId;
  username: string;
}

export type PublicBook = Omit<IBook, 'uploader'> & {
  uploader?: PublicUploader | null;
};

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
  results: PublicBook[];
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
