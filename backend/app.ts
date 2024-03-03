import { Request, Response } from 'express';
import 'express-async-errors';
const { updateMetrics } = require('./metrics');

import { json } from 'body-parser';

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
const subscription = require('./routes/api/subscription');

app.use(express.json());

const corsOptions = {
  origin: '*',
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use('/api/books', books);
app.use('/api/user', user);
app.use('/api/messages', messages);
app.use('/api/subscription', subscription);

app.use(updateMetrics);

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
export { app };
