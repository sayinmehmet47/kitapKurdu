import request from 'supertest';
import { app } from '../../../app';

it('returns a 400 with an invalid email', async () => {
  return request(app)
    .post('/api/user/login')
    .send({
      username: 'test',
      password: 'password',
    })
    .expect(400);
});

it('returns a 400 with missing email and password', async () => {
  await request(app).post('/api/user/login').send({}).expect(400);
});

it('fail when a email that does not exist is supplied', async () => {
  await request(app)
    .post('/api/user/login')
    .send({
      email: 'test@test.com',
      password: 'password',
    })
    .expect(400);
});

it('fail when an incorrect password is supplied', async () => {
  await request(app)
    .post('/api/user/register')
    .send({
      username: 'test',
      email: 'test@test.com',
      password: 'password',
    })
    .expect(201);

  await request(app)
    .post('/api/user/login')
    .send({
      username: 'test@test.com',
      password: 'passwor',
    })
    .expect(400);
});

it('responds with a cookie when given valid credentials', async () => {
  await request(app)
    .post('/api/user/register')
    .send({
      email: 'test@test.com',
      password: 'password',
      username: 'test',
    })
    .expect(201);

  const response = await request(app)
    .post('/api/user/login')
    .send({
      username: 'test',
      password: 'password',
    })
    .expect(201);

  expect(response.body.token).toBeDefined();
});
