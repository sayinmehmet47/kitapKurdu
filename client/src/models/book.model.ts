export interface BookModel {
  next: {
    page: number;
    limit: number;
  };
  total: number;
  results: {
    id: string;
    name: string;
    size: number;
    url: string;
    date: string;
    uploader: string;
    __v: number;
  }[];
}
