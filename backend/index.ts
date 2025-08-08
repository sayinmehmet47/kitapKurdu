import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import { DatabaseConnectionError } from './errors/database-connection-error';
import { myCronJob } from './cronJob';
import { checkEnvVariables } from './checkvariables';

const start = async () => {
  // Ensure both access and refresh token secrets exist
  if (!process.env.ACCESS_TOKEN_SECRET_KEY) {
    throw new Error('ACCESS_TOKEN_SECRET_KEY must be defined');
  }
  if (!process.env.REFRESH_TOKEN_SECRET_KEY) {
    throw new Error('REFRESH_TOKEN_SECRET_KEY must be defined');
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI must be defined');
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    if (error instanceof DatabaseConnectionError) {
      throw new DatabaseConnectionError();
    }
  }
  myCronJob(); // Start the cron job

  app.listen(process.env.PORT || 5000, () => {
    checkEnvVariables();
    console.log(`Server started on port` + process.env.PORT || 5000);
  });
};

start();
