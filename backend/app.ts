import { Request, Response } from 'express';
import 'express-async-errors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import routes from './routes';
import { json } from 'body-parser';

import express from 'express';
import cors from 'cors';
import path from 'path';
import { NotFoundError } from './errors/not-found-error';
import { errorHandler } from './middleware/error-handler';
import { updateMetrics } from './metrics';
import { logger } from './logger';
import winston from 'winston';
import passport from './src/config/passport';

const app = express();
app.set('trust proxy', true);
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(morgan('dev'));

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://kitapkurdu.xyz',
      'https://www.kitapkurdu.xyz',
      'https://dev.kitapkurdu.xyz',
      'https://www.dev.kitapkurdu.xyz',
      'https://staging.kitapkurdu.xyz',
      'https://www.staging.kitapkurdu.xyz',
      'https://kitapkurdu.onrender.com',
      'https://kitap-kurdu-bx87.vercel.app',
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

app.use('/api', routes);

app.get('/healthz', (req: Request, res: Response) => {
  res
    .status(200)
    .json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

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

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}
export { app };
