export const MOCK_BOOK_ID = 'mock-book-id-001';
export const MOCK_BOOK_TITLE = 'Test Book Title';

export const DATA_URI_COVER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

export const mockBook = {
  _id: MOCK_BOOK_ID,
  name: MOCK_BOOK_TITLE,
  file: 'test-book.pdf',
  date: '2024-01-15T12:00:00.000Z',
  size: 1_048_576,
  category: ['Fiction', 'Science'],
  language: 'English',
  url: 'https://example.com/test-book.pdf',
  description: 'A test book for smoke testing.',
  author: 'Test Author',
  isbn: '978-1-23456-789-0',
  publisher: 'Test Publisher',
  imageLinks: {
    smallThumbnail: DATA_URI_COVER,
    thumbnail: DATA_URI_COVER,
  },
  uploader: {
    username: 'test-uploader',
    _id: 'uploader-id-001',
  },
};

export const mockSearchResponse = {
  results: [mockBook],
  total: 1,
  page: 1,
  next: { page: 2, limit: 10 },
  previous: { page: 0, limit: 10 },
};

export const mockRatingSummary = {
  success: true,
  data: { avgRating: 4.0, count: 5 },
};

export const mockReviews = {
  success: true,
  data: [] as Array<{
    _id: string;
    userId?: { username: string };
    rating: number;
    review?: string;
  }>,
};
