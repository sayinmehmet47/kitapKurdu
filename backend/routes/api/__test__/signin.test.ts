import request from 'supertest';
import { app } from '../../../app';
import { User } from '../../../models/User';

it('returns a 401 with an invalid email', async () => {
  return request(app)
    .post('/api/user/login')
    .send({
      username: 'test',
      password: 'Password123',
    })
    .expect(418);
});

it('returns a 400 with missing email and password', async () => {
  await request(app).post('/api/user/login').send({}).expect(400);
});

it('fail when a email that does not exist is supplied', async () => {
  await request(app)
    .post('/api/user/login')
    .send({
      username: 'test@test.com',
      password: 'Password123',
    })
    .expect(401);
});

it('fail when an incorrect password is supplied', async () => {
  await request(app)
    .post('/api/user/register')
    .send({
      username: 'test',
      email: 'test@test.com',
      password: 'Password123',
    })
    .expect(201);

  await User.updateOne({ email: 'test@test.com' }, { isEmailVerified: true });

  await request(app)
    .post('/api/user/login')
    .send({
      username: 'test',
      password: 'WrongPass1',
    })
    .expect(401);
});

it('fails when email is not verified', async () => {
  await request(app)
    .post('/api/user/register')
    .send({
      username: 'test',
      email: 'test@test.com',
      password: 'Password123',
    })
    .expect(201);

  await request(app)
    .post('/api/user/login')
    .send({
      username: 'test',
      password: 'Password123',
    })
    .expect(401);
});

it('responds with a cookie when given valid credentials', async () => {
  await request(app)
    .post('/api/user/register')
    .send({
      email: 'test@test.com',
      password: 'Password123',
      username: 'test',
    })
    .expect(201);

  await User.updateOne({ email: 'test@test.com' }, { isEmailVerified: true });

  const response = await request(app)
    .post('/api/user/login')
    .send({
      username: 'test',
      password: 'Password123',
    })
    .expect(200);

  const cookies = response.get('Set-Cookie');
  if (cookies) {
    expect(cookies[1]).toMatch(/accessToken=/);
    expect(cookies[0]).toMatch(/refreshToken=/);
  } else {
    throw new Error('Cookies are not set');
  }

  expect(response.body.success).toBe(true);
  expect(response.body.message).toBe('Login successful');
  expect(response.body.user).toBeDefined();
  expect(response.body.user.email).toBe('test@test.com');
});
