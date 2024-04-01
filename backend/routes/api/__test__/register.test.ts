import request from 'supertest';
import { app } from '../../../app';

it('returns a 201 on successful register', async () => {
  const response = await request(app)
    .post('/api/user/register')
    .send({
      username: 'test',
      password: 'password',
      email: 'example@gmail.com',
    })
    .expect(201);

  expect(response.get('Set-Cookie')[1]).toMatch(/accessToken=/);
  expect(response.get('Set-Cookie')[0]).toMatch(/refreshToken=/);
});
it('returns a 400 with an invalid username', async () => {
  return request(app)
    .post('/api/user/register')
    .send({
      username: 'te',
      email: 'example@gmail.com',
      password: 'password',
    })
    .expect(400);
});

it('returns a 400 with an invalid password', async () => {
  return request(app)
    .post('/api/user/register')
    .send({
      email: 'test@gmail.com',
      username: 'test',
      password: 'p',
    })
    .expect(400);
});

it('returns a 400 with missing email and password', async () => {
  await request(app)
    .post('/api/user/register')
    .send({
      email: 'test@gmail.com',
    })
    .expect(400);

  await request(app)
    .post('/api/user/register')
    .send({
      password: 'password',
    })
    .expect(400);
});

it('disallows duplicate emails', async () => {
  await request(app)
    .post('/api/user/register')
    .send({
      email: 'test@test.com',
      password: 'password',
      username: 'test',
    })
    .expect(201);
  await request(app)
    .post('/api/user/register')
    .send({
      email: 'test@test',
      password: 'password',
      username: 'test',
    })
    .expect(400);
});

it('sets a token successfully', async () => {
  const response = await request(app)
    .post('/api/user/register')
    .send({
      email: 'test@test.com',
      password: 'password',
      username: 'test',
    })
    .expect(201);

  expect(response.get('Set-Cookie')[1]).toMatch(/accessToken=/);
  expect(response.get('Set-Cookie')[0]).toMatch(/refreshToken=/);
  expect(response.body.user).toBeDefined();
});
