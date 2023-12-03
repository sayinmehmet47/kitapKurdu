export interface BookModel {
  next: {
    page: number;
    limit: number;
  };
  total: number;
  page: number;
  results: {
    id: string;
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
