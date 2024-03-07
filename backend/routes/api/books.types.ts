import { IBook } from '../../models/Books';

export interface VolumeInfo {
  categories: string[];
}

export interface Item {
  volumeInfo: VolumeInfo;
}
export interface BooksData {
  results: IBook[];
  total: number;
  page: number;
  next?: {
    page: number;
  };
  previous?: {
    page: number;
  };
}
