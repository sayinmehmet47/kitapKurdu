import request from 'supertest';
import { app } from '../../../app';

it('returns a 201 on successful register', async () => {
  const response = await request(app)
    .post('/api/user/register')
    .send({
      username: 'test',
      password: 'Password123',
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
      password: 'Password123',
    })
    .expect(400);
});

it('returns a 400 with an invalid password', async () => {
  return request(app)
    .post('/api/user/register')
    .send({
      email: 'test@gmail.com',
      username: 'test',
      password: 'short',
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
      password: 'Password123',
    })
    .expect(400);
});

it('disallows duplicate emails', async () => {
  await request(app)
    .post('/api/user/register')
    .send({
      email: 'test@test.com',
      password: 'Password123',
      username: 'test',
    })
    .expect(201);
  await request(app)
    .post('/api/user/register')
    .send({
      email: 'test@test.com', // Same email
      password: 'Password123',
      username: 'test2', // Different username
    })
    .expect(400);
});

it('disallows duplicate usernames', async () => {
  await request(app)
    .post('/api/user/register')
    .send({
      email: 'test1@test.com',
      password: 'Password123',
      username: 'test',
    })
    .expect(201);
  await request(app)
    .post('/api/user/register')
    .send({
      email: 'test2@test.com', // Different email
      password: 'Password123',
      username: 'test', // Same username
    })
    .expect(400);
});

it('returns user data on successful registration', async () => {
  const response = await request(app)
    .post('/api/user/register')
    .send({
      email: 'test@test.com',
      password: 'Password123',
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
