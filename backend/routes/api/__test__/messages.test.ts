import request from 'supertest';
import { app } from '../../../app';
import e from 'express';

it('returns a 400 with a invalid sender', async () => {
  const { token, sender } = await global.signin();

  return request(app)
    .post('/api/messages/userMessages')
    .set('Authorization', `Bearer ${token}`)
    .send({
      sender,
    })
    .expect(400);
});

it('returns a 400 with a invalid text', async () => {
  const { token, sender } = await global.signin();

  return request(app)
    .post('/api/messages/userMessages')
    .set('Authorization', `Bearer ${token}`)
    .send({
      sender,
    })
    .expect(400);
});

it('returns a 201 with a valid sender and text', async () => {
  const { token, sender } = await global.signin();

  const response = await request(app)
    .post('/api/messages/userMessages')
    .set('Authorization', `Bearer ${token}`)
    .send({
      sender,
      text: 'test',
    })
    .expect(201);

  expect(response.body.text).toEqual('test');
  expect(response.body.sender).toEqual(decodeURI(encodeURI(sender)));
});

it('should not member delete message', async () => {
  const { token, sender } = await global.signin();

  const response = await request(app)
    .post('/api/messages/userMessages')
    .set('Authorization', `Bearer ${token}`)
    .send({
      sender,
      text: 'test',
    })
    .expect(201);

  await request(app)
    .delete('/api/messages/deleteMessage')
    .set('Authorization', `Bearer ${token}`)
    .send({
      id: response.body._id,
    })
    .expect(401);
});

it('should admin  delete message', async () => {
  const { token, sender } = await global.signin(true);

  const response = await request(app)
    .post('/api/messages/userMessages')
    .set('Authorization', `Bearer ${token}`)
    .send({
      sender,
      text: 'test',
    })
    .expect(201);

  await request(app)
    .delete('/api/messages/deleteMessage')
    .set('Authorization', `Bearer ${token}`)
    .send({
      id: response.body._id,
    })
    .expect(201);
});
