import axios from 'axios';
import { fetchGoogleBooksMetadata } from '../../../services/book/googleBooksMetadata.service';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(() => {
  jest.clearAllMocks();
});

it('parses the first usable volume and prefers ISBN-13', async () => {
  mockedAxios.get.mockResolvedValue({
    data: {
      totalItems: 2,
      items: [
        { volumeInfo: {} },
        {
          volumeInfo: {
            title: 'A Book',
            authors: ['First Author', 'Second Author'],
            industryIdentifiers: [
              { type: 'ISBN_10', identifier: '0000000000' },
              { type: 'ISBN_13', identifier: '978-0000000000' },
            ],
            publisher: 'A Publisher',
            description: 'A description',
            categories: ['Fiction'],
            imageLinks: {
              smallThumbnail: 'https://example.com/small.jpg',
              thumbnail: 'https://example.com/large.jpg',
            },
            previewLink: 'https://example.com/preview',
          },
        },
      ],
    },
  } as never);

  const metadata = await fetchGoogleBooksMetadata({
    name: 'A Book',
    isbn: '978-0000000000',
  });

  expect(metadata).toEqual({
    title: 'A Book',
    author: 'First Author, Second Author',
    isbn: '978-0000000000',
    publisher: 'A Publisher',
    description: 'A description',
    categories: ['Fiction'],
    imageLinks: {
      smallThumbnail: 'https://example.com/small.jpg',
      thumbnail: 'https://example.com/large.jpg',
    },
  });
  expect(mockedAxios.get).toHaveBeenCalledWith(
    'https://www.googleapis.com/books/v1/volumes',
    expect.objectContaining({
      params: expect.objectContaining({ q: 'isbn:978-0000000000' }),
      timeout: 5000,
    })
  );
});

it('returns null for no matches and provider failures', async () => {
  mockedAxios.get.mockResolvedValue({
    data: { totalItems: 0, items: [] },
  } as never);
  await expect(fetchGoogleBooksMetadata({ name: 'Unknown book' })).resolves.toBeNull();

  mockedAxios.get.mockRejectedValue(new Error('provider unavailable'));
  await expect(fetchGoogleBooksMetadata({ name: 'Unavailable book' })).resolves.toBeNull();
});
