import request from 'supertest';
import { app } from '../../../app';
import mongoose from 'mongoose';

it('return 400 with invalid body', async () => {
  const { token } = await global.signin();

  await request(app)
    .post('/api/books/addNewBook')
    .set('Authorization', `Bearer ${token}`)
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

it('should not unauthorized users can upload new book', async () => {
  await request(app)
    .post('/api/books/addNewBook')
    .send({
      name: 'test',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      size: 100,
      uploader: 'test',
    })
    .expect(401);
});

it('should  authorized users can upload new book', async () => {
  const { token, sender } = await global.signin();
  await request(app)
    .post('/api/books/addNewBook')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'test',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      size: 100,
      uploader: sender,
    })
    .expect(201);
});

it('should not member delete book', async () => {
  const { token, sender } = await global.signin();
  const book = await request(app)
    .post('/api/books/addNewBook')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'test',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      size: 100,
      uploader: sender,
    })
    .expect(201);

  await request(app)
    .post('/api/books/deleteBook')
    .set('Authorization', `Bearer ${token}`)
    .send({
      id: book.body._id,
    })
    .expect(401);
});

it('should admin delete book', async () => {
  const { token, sender } = await global.signin(true);
  const book = await request(app)
    .post('/api/books/addNewBook')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'test',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      size: 100,
      uploader: sender,
    })
    .expect(201);

  await request(app)
    .post('/api/books/deleteBook')
    .set('Authorization', `Bearer ${token}`)
    .send({
      id: book.body._id,
    })
    .expect(201);
});

it('should get all the books paginated', async () => {
  const { token, sender } = await global.signin(true);
  const book1 = await request(app)
    .post('/api/books/addNewBook')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'test-1',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      size: 100,
      uploader: sender,
    })
    .expect(201);

  const book2 = await request(app)
    .post('/api/books/addNewBook')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'test-2',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      size: 100,
      uploader: sender,
    })
    .expect(201);

  const allBooks = await request(app)
    .get('/api/books/allBooks')
    .set('Authorization', `Bearer ${token}`)
    .expect(201);

  expect(allBooks.body.total).toEqual(2);
  expect(allBooks.body.results[0].name).toEqual(book1.body.name);
  expect(allBooks.body.results[1].name).toEqual(book2.body.name);
});
