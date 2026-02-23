import request from 'supertest';
import { app } from '../../../app';

const DUMMY_PDF_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

const VALID_BOOK_DATA = {
  name: 'test',
  url: DUMMY_PDF_URL,
  size: 100,
  uploader: 'test',
};

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
      expect(res.body.errors[3].message).toEqual('Uploader is required');
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
