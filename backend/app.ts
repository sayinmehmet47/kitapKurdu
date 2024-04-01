import { Request, Response } from 'express';
import 'express-async-errors';
const cookieParser = require('cookie-parser');

import routes from './routes';
import { json } from 'body-parser';

import express from 'express';
import cors from 'cors';
import path from 'path';
import { NotFoundError } from './errors/not-found-error';
import { errorHandler } from './middleware/error-handler';
import { updateMetrics } from './metrics';

const app = express();

app.set('trust proxy', true);
app.use(json());
app.use(cookieParser());
app.use(express.json());

app.use(
  cors({
    origin: ['http://localhost:3000', 'https://www.kitapkurdu.xyz'],
    credentials: true,
  })
);

app.use('/api', routes);

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
