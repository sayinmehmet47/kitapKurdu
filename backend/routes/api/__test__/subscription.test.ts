import request from 'supertest';
import { app } from '../../../app';
import { User } from '../../../models/User';

const VALID_SUBSCRIPTION = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
  expirationTime: null,
  keys: {
    p256dh: 'test-p256dh-key',
    auth: 'test-auth-key',
  },
};

it('returns 401 for unauthenticated subscription requests', async () => {
  await request(app)
    .post('/api/subscription')
    .send({ subscription: VALID_SUBSCRIPTION })
    .expect(401);
});

it('returns 400 for malformed subscription data', async () => {
  const { accessToken } = await global.signin();

  await request(app)
    .post('/api/subscription')
    .set('Cookie', `accessToken=${accessToken}`)
    .send({ subscription: { endpoint: 'not-a-url' } })
    .expect(400);

  await request(app)
    .post('/api/subscription')
    .set('Cookie', `accessToken=${accessToken}`)
    .send({
      subscription: {
        endpoint: 'http://insecure.example.com',
        keys: { p256dh: 'x', auth: '' },
      },
    })
    .expect(400);
});

it('returns 201 and persists the subscription for the authenticated user', async () => {
  const { accessToken, sender } = await global.signin();

  const response = await request(app)
    .post('/api/subscription')
    .set('Cookie', `accessToken=${accessToken}`)
    .send({ subscription: VALID_SUBSCRIPTION })
    .expect(201);

  expect(response.body.message).toBe('Subscription added successfully.');

  const storedUser = await User.findById(sender).lean();
  expect(storedUser?.subscription).toMatchObject({
    endpoint: VALID_SUBSCRIPTION.endpoint,
    keys: {
      auth: VALID_SUBSCRIPTION.keys.auth,
      p256dh: VALID_SUBSCRIPTION.keys.p256dh,
    },
  });
});

it('returns 401 when the authenticated user document no longer exists', async () => {
  const { accessToken, sender } = await global.signin();
  await User.findByIdAndDelete(sender);

  await request(app)
    .post('/api/subscription')
    .set('Cookie', `accessToken=${accessToken}`)
    .send({ subscription: VALID_SUBSCRIPTION })
    .expect(401);
});

it('ignores a spoofed body user and stores the subscription on the authenticated user', async () => {
  const { accessToken, sender } = await global.signin();
  const otherUser = await User.create({
    username: 'spoof-target',
    email: 'spoof-target@example.com',
  });

  await request(app)
    .post('/api/subscription')
    .set('Cookie', `accessToken=${accessToken}`)
    .send({
      subscription: VALID_SUBSCRIPTION,
      user: { _id: otherUser._id },
    })
    .expect(201);

  const authenticatedUser = await User.findById(sender).lean();
  const spoofedUser = await User.findById(otherUser._id).lean();

  expect(authenticatedUser?.subscription?.endpoint).toBe(VALID_SUBSCRIPTION.endpoint);
  expect(spoofedUser?.subscription).toBeUndefined();
});
