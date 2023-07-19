import { Request, Response } from 'express';
import 'express-async-errors';

import { json } from 'body-parser';

import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { NotFoundError } from './errors/not-found-error';
import { errorHandler } from './middleware/error-handler';

const app = express();
app.set('trust proxy', true);
app.use(json());

const books = require('./routes/api/books');
const user = require('./routes/api/user');
const messages = require('./routes/api/messages');

app.use(express.json());

require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || '').then(() => {
  console.log('Connected to MongoDB');
});
const corsOptions = {
  origin: '*',
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use('/api/books', books);
app.use('/api/user', user);
app.use('/api/messages', messages);

app.all('*', (req: Request, res: Response) => {
  throw new NotFoundError();
});

app.use(errorHandler);

if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

const listener = app.listen(process.env.PORT || 5000, () => {
  console.log(`Server started on port pro` + process.env.PORT || 5000);
});

module.exports = listener;
