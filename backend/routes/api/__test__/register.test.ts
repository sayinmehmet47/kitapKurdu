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

  // Registration no longer sets cookies - users need email verification first
  expect(response.body.success).toBe(true);
  expect(response.body.message).toMatch(/registration successful/i);
  expect(response.body.user).toBeDefined();
  expect(response.body.user.email).toBe('example@gmail.com');
  expect(response.body.user.username).toBe('test');
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
      email: 'test@test.com', // Same email
      password: 'password',
      username: 'test2', // Different username
    })
    .expect(400);
});

it('disallows duplicate usernames', async () => {
  await request(app)
    .post('/api/user/register')
    .send({
      email: 'test1@test.com',
      password: 'password',
      username: 'test',
    })
    .expect(201);
  await request(app)
    .post('/api/user/register')
    .send({
      email: 'test2@test.com', // Different email
      password: 'password',
      username: 'test', // Same username
    })
    .expect(400);
});

it('returns user data on successful registration', async () => {
  const response = await request(app)
    .post('/api/user/register')
    .send({
      email: 'test@test.com',
      password: 'password',
      username: 'test',
    })
    .expect(201);

  // Check response structure
  expect(response.body.success).toBe(true);
  expect(response.body.user).toBeDefined();
  expect(response.body.user.id).toBeDefined();
  expect(response.body.user.email).toBe('test@test.com');
  expect(response.body.user.username).toBe('test');
  expect(response.body.user.isEmailVerified).toBe(false); // Should be false initially
});
