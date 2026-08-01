import request from 'supertest';
import { app } from '../../../app';
import { Books } from '../../../models/Books';
import { User } from '../../../models/User';
import { fetchGoogleBooksMetadata } from '../../../services/book/googleBooksMetadata.service';

jest.mock('../../../services/book/googleBooksMetadata.service');

const mockedFetchGoogleBooksMetadata = fetchGoogleBooksMetadata as jest.MockedFunction<
  typeof fetchGoogleBooksMetadata
>;

const DUMMY_PDF_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

const VALID_BOOK_DATA = {
  name: 'test',
  url: DUMMY_PDF_URL,
  size: 100,
};

beforeEach(() => {
  mockedFetchGoogleBooksMetadata.mockReset();
  mockedFetchGoogleBooksMetadata.mockResolvedValue(null);
});

it('return 400 with invalid body', async () => {
  const { accessToken } = await global.signin();

  await request(app)
    .post('/api/books/addNewBook')
    .set('Cookie', `accessToken=${accessToken}`)
    .send({
      title: 'test',
    })
    .expect(400)
    .expect((res) => {
      expect(res.body.errors[0].message).toEqual('Name is required');
      expect(res.body.errors[1].message).toEqual('Url is required');
      expect(res.body.errors[2].message).toEqual('Size is required');
      expect(res.body.errors).toHaveLength(3);
    });
});

it('should not allow unauthorized users to upload new book', async () => {
  await request(app).post('/api/books/addNewBook').send(VALID_BOOK_DATA).expect(401);
});

it('should allow authorized users to upload new book', async () => {
  const { accessToken, sender } = await global.signin();

  await request(app)
    .post('/api/books/addNewBook')
    .set('Cookie', `accessToken=${accessToken}`)
    .send({
      ...VALID_BOOK_DATA,
      uploader: sender,
    })
    .expect(201);
});

it('ignores a legacy uploader body value and stores the authenticated user', async () => {
  const { accessToken, sender } = await global.signin();
  const otherUser = await User.create({
    username: 'spoof-target',
    email: 'spoof-target@example.com',
  });

  const response = await request(app)
    .post('/api/books/addNewBook')
    .set('Cookie', `accessToken=${accessToken}`)
    .send({
      ...VALID_BOOK_DATA,
      uploader: otherUser._id,
    })
    .expect(201);

  const storedBook = await Books.findById(response.body._id).lean();

  expect(String(response.body.uploader)).toBe(String(sender));
  expect(String(storedBook?.uploader)).toBe(String(sender));
});

it('populates book metadata from the provider', async () => {
  mockedFetchGoogleBooksMetadata.mockResolvedValue({
    title: 'Provider title',
    author: 'Provider Author, Second Author',
    isbn: '978-0000000000',
    publisher: 'Provider Publisher',
    description: 'Provider description',
    categories: ['Science Fiction', 'Science Fiction'],
    imageLinks: {
      thumbnail: 'https://example.com/thumbnail.jpg',
    },
  });

  const { accessToken, sender } = await global.signin();
  const response = await request(app)
    .post('/api/books/addNewBook')
    .set('Cookie', `accessToken=${accessToken}`)
    .send({
      ...VALID_BOOK_DATA,
      name: 'Uploaded title',
      uploader: sender,
    })
    .expect(201);

  expect(response.body).toMatchObject({
    name: 'Uploaded title',
    author: 'Provider Author, Second Author',
    isbn: '978-0000000000',
    publisher: 'Provider Publisher',
    description: 'Provider description',
    category: ['science fiction'],
    imageLinks: {
      thumbnail: 'https://example.com/thumbnail.jpg',
    },
  });
});

it('gives manual metadata values precedence over provider values', async () => {
  mockedFetchGoogleBooksMetadata.mockResolvedValue({
    author: 'Provider Author',
    isbn: '978-0000000000',
    publisher: 'Provider Publisher',
  });

  const { accessToken, sender } = await global.signin();
  const response = await request(app)
    .post('/api/books/addNewBook')
    .set('Cookie', `accessToken=${accessToken}`)
    .send({
      ...VALID_BOOK_DATA,
      uploader: sender,
      author: '  Manual Author  ',
      isbn: ' 978-1111111111 ',
      publisher: ' Manual Publisher ',
    })
    .expect(201);

  expect(response.body).toMatchObject({
    author: 'Manual Author',
    isbn: '978-1111111111',
    publisher: 'Manual Publisher',
  });
  expect(mockedFetchGoogleBooksMetadata).toHaveBeenCalledWith({
    name: 'test',
    isbn: '978-1111111111',
  });
});

it('keeps uploads successful when metadata enrichment fails', async () => {
  mockedFetchGoogleBooksMetadata.mockRejectedValue(new Error('provider unavailable'));

  const { accessToken, sender } = await global.signin();
  const response = await request(app)
    .post('/api/books/addNewBook')
    .set('Cookie', `accessToken=${accessToken}`)
    .send({
      ...VALID_BOOK_DATA,
      uploader: sender,
      author: 'Manual Author',
      isbn: '978-2222222222',
      publisher: 'Manual Publisher',
    })
    .expect(201);

  expect(response.body).toMatchObject({
    author: 'Manual Author',
    isbn: '978-2222222222',
    publisher: 'Manual Publisher',
  });
});

it('allows a normal client to upload up to three books concurrently without rate limiting', async () => {
  const { accessToken, sender } = await global.signin();

  const uploads = [1, 2, 3].map((index) =>
    request(app)
      .post('/api/books/addNewBook')
      .set('Cookie', `accessToken=${accessToken}`)
      .send({
        ...VALID_BOOK_DATA,
        name: `concurrent-upload-${index}`,
        uploader: sender,
      })
      .expect(201)
  );

  const responses = await Promise.all(uploads);

  expect(responses.map((response) => response.body.name).sort()).toEqual([
    'concurrent-upload-1',
    'concurrent-upload-2',
    'concurrent-upload-3',
  ]);
});

it('returns existing books that have no metadata', async () => {
  const { sender } = await global.signin();
  const legacyBook = await Books.create({
    name: 'legacy metadata record',
    url: DUMMY_PDF_URL,
    size: 100,
    uploader: sender,
  });
  await Books.updateOne({ _id: legacyBook._id }, { $unset: { author: 1, isbn: 1, publisher: 1 } });

  const response = await request(app)
    .get('/api/books/search')
    .query({ q: 'legacy metadata record' })
    .expect(200);

  expect(response.body.total).toBe(1);
  expect(response.body.results[0]).toMatchObject({
    name: 'legacy metadata record',
  });
  expect(response.body.results[0]).not.toHaveProperty('author');
  expect(response.body.results[0]).not.toHaveProperty('isbn');
  expect(response.body.results[0]).not.toHaveProperty('publisher');
});

it('searches metadata and keywords with AND filters', async () => {
  await Books.insertMany([
    {
      name: 'Kayıp Zaman',
      description: 'Bir roman ve tarih anlatısı',
      category: ['roman', 'tarih'],
      author: 'Orhan Pamuk',
      isbn: '978-975-1234567',
      publisher: 'İletişim',
      url: DUMMY_PDF_URL,
      size: 100,
    },
    {
      name: 'Başka Zaman',
      description: 'Bilim kurgu',
      category: ['bilim'],
      author: 'Başka Yazar',
      isbn: '978-975-7654321',
      publisher: 'Başka Yayın',
      url: DUMMY_PDF_URL,
      size: 100,
    },
    {
      name: 'Türkçe Yazar',
      author: 'Şahin Çelik',
      url: DUMMY_PDF_URL,
      size: 100,
    },
    {
      name: 'Legacy Author - Title Only Token',
      url: DUMMY_PDF_URL,
      size: 100,
    },
    {
      name: 'Legacy Author - Null Title',
      author: null,
      url: DUMMY_PDF_URL,
      size: 100,
    },
    {
      name: 'Legacy Author - Empty Title',
      author: '',
      url: DUMMY_PDF_URL,
      size: 100,
    },
    {
      name: 'Legacy Author - Whitespace Title',
      author: '   ',
      url: DUMMY_PDF_URL,
      size: 100,
    },
    {
      name: 'Legacy Prefix - Populated Title',
      author: 'Actual Author',
      url: DUMMY_PDF_URL,
      size: 100,
    },
    {
      name: 'Authorless title without separator',
      url: DUMMY_PDF_URL,
      size: 100,
    },
  ]);

  const keyword = await request(app).get('/api/books/search').query({ q: 'KAYIP' }).expect(200);
  expect(keyword.body.total).toBe(1);

  const author = await request(app)
    .get('/api/books/search')
    .query({ author: 'orhan pamuk' })
    .expect(200);
  expect(author.body.total).toBe(1);
  expect(author.body.results[0].name).toBe('Kayıp Zaman');

  const partialAuthor = await request(app)
    .get('/api/books/search')
    .query({ author: 'pamuk' })
    .expect(200);
  expect(partialAuthor.body.total).toBe(1);
  expect(partialAuthor.body.results[0].author).toBe('Orhan Pamuk');

  const normalizedAuthor = await request(app)
    .get('/api/books/search')
    .query({ author: 'sahin celik' })
    .expect(200);
  expect(normalizedAuthor.body.total).toBe(1);
  expect(normalizedAuthor.body.results[0].name).toBe('Türkçe Yazar');

  const escapedAuthor = await request(app)
    .get('/api/books/search')
    .query({ author: '.*' })
    .expect(200);
  expect(escapedAuthor.body.total).toBe(0);

  const legacyAuthorFilter = await request(app)
    .get('/api/books/search')
    .query({ author: 'legacy' })
    .expect(200);
  expect(legacyAuthorFilter.body.total).toBe(4);
  expect(legacyAuthorFilter.body.results.map((book: { name: string }) => book.name)).toEqual(
    expect.arrayContaining([
      'Legacy Author - Title Only Token',
      'Legacy Author - Null Title',
      'Legacy Author - Empty Title',
      'Legacy Author - Whitespace Title',
    ])
  );

  const titleOnlyAuthorFilter = await request(app)
    .get('/api/books/search')
    .query({ author: 'title only' })
    .expect(200);
  expect(titleOnlyAuthorFilter.body.total).toBe(0);

  const authorlessTitleFilter = await request(app)
    .get('/api/books/search')
    .query({ author: 'authorless' })
    .expect(200);
  expect(authorlessTitleFilter.body.total).toBe(0);

  const populatedPrefixAuthorFilter = await request(app)
    .get('/api/books/search')
    .query({ author: 'legacy prefix' })
    .expect(200);
  expect(populatedPrefixAuthorFilter.body.total).toBe(0);

  const isbn = await request(app)
    .get('/api/books/search')
    .query({ isbn: '978-975-1234567' })
    .expect(200);
  expect(isbn.body.results[0].name).toBe('Kayıp Zaman');

  const publisher = await request(app)
    .get('/api/books/search')
    .query({ publisher: 'iletişim' })
    .expect(200);
  expect(publisher.body.results[0].name).toBe('Kayıp Zaman');

  const category = await request(app)
    .get('/api/books/search')
    .query({ category: 'roman' })
    .expect(200);
  expect(category.body.results[0].name).toBe('Kayıp Zaman');

  const combined = await request(app)
    .get('/api/books/search')
    .query({
      q: 'KAYIP',
      author: 'ORHAN PAMUK',
      publisher: 'İLETİŞİM',
      category: 'ROMAN',
    })
    .expect(200);
  expect(combined.body.total).toBe(1);
  expect(combined.body.results[0].name).toBe('Kayıp Zaman');

  const legacyRoute = await request(app)
    .get('/api/books/searchBooks')
    .query({ name: 'KAYIP' })
    .expect(200);
  expect(legacyRoute.body.results[0].name).toBe('Kayıp Zaman');
});

it('matches NFD-decomposed legacy author names with plain queries', async () => {
  const ihsanBookName = 'I\u0307hsan Oktay Anar - Puslu Kıtalar Atlası';
  const sahinCelikBookName = 'S\u0327ahin C\u0327elik - Kayıp Zaman';

  await Books.insertMany([
    {
      name: ihsanBookName,
      url: DUMMY_PDF_URL,
      size: 100,
    },
    {
      name: sahinCelikBookName,
      url: DUMMY_PDF_URL,
      size: 100,
    },
  ]);

  const ihsan = await request(app).get('/api/books/search').query({ author: 'ihsan' }).expect(200);
  expect(ihsan.body.total).toBe(1);
  expect(ihsan.body.results[0].name).toBe(ihsanBookName);

  const sahin = await request(app).get('/api/books/search').query({ author: 'sahin' }).expect(200);
  expect(sahin.body.total).toBe(1);
  expect(sahin.body.results[0].name).toBe(sahinCelikBookName);

  const celik = await request(app).get('/api/books/search').query({ author: 'celik' }).expect(200);
  expect(celik.body.total).toBe(1);
  expect(celik.body.results[0].name).toBe(sahinCelikBookName);
});

it('paginates metadata searches with bounded page and limit values', async () => {
  await Books.insertMany(
    ['One', 'Two', 'Three'].map((name) => ({
      name: `Pagination ${name}`,
      author: 'Pagination Author',
      url: DUMMY_PDF_URL,
      size: 100,
    }))
  );

  const response = await request(app)
    .get('/api/books/search')
    .query({ author: 'pagination author', page: 2, limit: 1 })
    .expect(200);

  expect(response.body.total).toBe(3);
  expect(response.body.results).toHaveLength(1);
  expect(response.body.previous).toEqual({ page: 1, limit: 1 });
  expect(response.body.next).toEqual({ page: 3, limit: 1 });
});

it('should not allow non-admin members to delete books', async () => {
  const { accessToken, sender } = await global.signin();

  const book = await request(app)
    .post('/api/books/addNewBook')
    .set('Cookie', `accessToken=${accessToken}`)
    .send({
      ...VALID_BOOK_DATA,
      uploader: sender,
    })
    .expect(201);

  await request(app)
    .post(`/api/books/deleteBook/${book.body._id}`)
    .set('Cookie', `accessToken=${accessToken}`)
    .send({
      id: book.body._id,
    })
    .expect(403);
});

it('should allow admin users to delete books', async () => {
  const { accessToken, sender } = await global.signin(true);
  const book = await request(app)
    .post('/api/books/addNewBook')
    .set('Cookie', `accessToken=${accessToken}`)
    .send({
      ...VALID_BOOK_DATA,
      uploader: sender,
    })
    .expect(201);

  await request(app)
    .post(`/api/books/deleteBook/${book.body._id}`)
    .set('Cookie', `accessToken=${accessToken}`)
    .expect(200);
});

it('should block deleting a book that is the canonical of hidden duplicates', async () => {
  const { accessToken } = await global.signin(true);
  const canonical = await Books.create({
    name: 'Canonical Book',
    url: DUMMY_PDF_URL,
    size: 100,
  });
  const duplicate = await Books.create({
    name: 'Hidden Duplicate',
    url: DUMMY_PDF_URL,
    size: 100,
    duplicateOf: canonical._id,
  });

  await request(app)
    .post(`/api/books/deleteBook/${canonical._id}`)
    .set('Cookie', `accessToken=${accessToken}`)
    .expect(400);

  // Neither the canonical nor its hidden duplicate was removed.
  expect(await Books.exists({ _id: canonical._id })).toBeTruthy();
  expect(await Books.exists({ _id: duplicate._id })).toBeTruthy();

  // Once the duplicate is unmarked the canonical can be deleted.
  await Books.updateOne({ _id: duplicate._id }, { $set: { duplicateOf: null } });
  await request(app)
    .post(`/api/books/deleteBook/${canonical._id}`)
    .set('Cookie', `accessToken=${accessToken}`)
    .expect(200);
});

it('should get all books paginated', async () => {
  const { accessToken, sender } = await global.signin();
  const book1 = await request(app)
    .post('/api/books/addNewBook')
    .set('Cookie', `accessToken=${accessToken}`)
    .send({
      ...VALID_BOOK_DATA,
      name: 'test-1',
      uploader: sender,
    })
    .expect(201);

  const book2 = await request(app)
    .post('/api/books/addNewBook')
    .set('Cookie', `accessToken=${accessToken}`)
    .send({
      ...VALID_BOOK_DATA,
      name: 'test-2',
      uploader: sender,
      language: 'all',
    })
    .expect(201);

  const allBooks = await request(app)
    .get(`/api/books/allBooks/?page=0&language=`)
    .set('Cookie', `accessToken=${accessToken}`)
    .expect(200);

  expect(allBooks.body.data.total).toEqual(2);
  expect(allBooks.body.data.results[0].name).toEqual(book2.body.name);
  expect(allBooks.body.data.results[1].name).toEqual(book1.body.name);
});

it('returns only safe uploader attribution from public book endpoints', async () => {
  const { sender } = await global.signin();
  const book = await Books.create({
    name: 'safe uploader attribution book',
    url: DUMMY_PDF_URL,
    size: 100,
    uploader: sender,
  });
  const uploaderId = String(sender);

  const expectSafeUploader = (uploader: unknown) => {
    expect(uploader).toEqual({ _id: uploaderId, username: 'test' });
    expect(uploader).not.toHaveProperty('email');
  };

  const search = await request(app)
    .get('/api/books/search')
    .query({ q: 'safe uploader attribution book' })
    .expect(200);
  expectSafeUploader(search.body.results[0].uploader);

  const allBooks = await request(app)
    .get('/api/books/allBooks')
    .query({ language: 'all', page: 1, limit: 10 })
    .expect(200);
  expectSafeUploader(allBooks.body.data.results[0].uploader);

  const ratingSortedBooks = await request(app)
    .get('/api/books/allBooks')
    .query({ language: 'all', page: 1, limit: 10, sort: 'ratingDesc' })
    .expect(200);
  expectSafeUploader(ratingSortedBooks.body.data.results[0].uploader);

  const recentlyAdded = await request(app)
    .get('/api/books/recently-added')
    .query({ page: 1, limit: 10 })
    .expect(200);
  expectSafeUploader(recentlyAdded.body.data.books[0].uploader);

  const detail = await request(app).get(`/api/books/getBookById/${book._id}`).expect(200);
  expectSafeUploader(detail.body.uploader);
});
