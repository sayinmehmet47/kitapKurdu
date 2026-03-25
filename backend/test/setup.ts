import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';

import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User';

process.env.ACCESS_TOKEN_SECRET_KEY = 'access';
process.env.REFRESH_TOKEN_SECRET_KEY = 'refresh';

// Fix mongoose deprecation warning
mongoose.set('strictQuery', false);

let mongo: MongoMemoryServer | null = null;

beforeAll(async () => {
  const mongoUri = process.env.TEST_MONGO_URI;
  const dbName =
    process.env.TEST_MONGO_DB || `kitapkurdu-test-${process.env.JEST_WORKER_ID || '1'}`;

  if (mongoUri) {
    await mongoose.connect(mongoUri, { dbName });
    return;
  }

  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName });
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
  const hash = await bcrypt.hash('test', 10);

  const newUser = new User({
    username: 'test',
    email: 'example@gmail.com',
    password: hash,
    isAdmin,
  });

  const savedUser = await newUser.save();

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
