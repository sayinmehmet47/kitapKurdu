import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcrypt';

import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User';

process.env.ACCESS_TOKEN_SECRET_KEY = 'access';
process.env.REFRESH_TOKEN_SECRET_KEY = 'refresh';

// Fix mongoose deprecation warning
mongoose.set('strictQuery', false);

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const mongoUri = mongo.getUri();
  await mongoose.connect(mongoUri, {});
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
    _id: savedUser._id,
    isAdmin: savedUser.isAdmin,
  };

  const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET_KEY!, {
    expiresIn: '85m',
  });
  const refreshToken = jwt.sign(
    payload,
    process.env.REFRESH_TOKEN_SECRET_KEY!,
    { expiresIn: '12d' }
  );

  return { accessToken, refreshToken, sender: savedUser._id };
};
