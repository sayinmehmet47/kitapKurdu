import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcrypt';

import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User';

let mongo: MongoMemoryServer;

beforeAll(async () => {
  process.env.JWT_SECRET = 'asdfasdf';

  mongo = await MongoMemoryServer.create();
  const mongoUri = mongo.getUri();
  const connection = await mongoose.connect(mongoUri, {});
});

beforeEach(async () => {
  jest.clearAllMocks();
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  if (mongo) {
    await mongo.stop();
  }
  await mongoose.connection.close();
});

declare global {
  var signin: (isAdmin?: boolean) => Promise<any>;
}

global.signin = async (isAdmin: boolean = false) => {
  const salt = await bcrypt.genSalt(10);
  if (!salt) throw new Error('Something went wrong with bcrypt');
  const hash = await bcrypt.hash('test', salt);
  if (!hash) throw new Error('Something went wrong hashing the password');

  const newUser = new User({
    username: 'test',
    email: 'example@gmail.com',
    password: hash,
    isAdmin,
  });

  const savedUser = await newUser.save();
  if (!savedUser) throw new Error('Something went wrong saving the user');

  const payload = {
    id: savedUser._id,
    isAdmin: savedUser.isAdmin,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET!);

  return { token, sender: savedUser._id };
};
