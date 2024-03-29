import { NextFunction } from 'express';

const express = require('express');
const morgan = require('morgan');
const { register } = require('prom-client');

const app = express();

app.use(morgan('dev'));

function updateMetrics(req: any, res: any, next: NextFunction) {
  res.addListener('finish', () => {});
  next();
}

app.get(
  '/metrics',
  async (
    req: { headers: { authorization: any } },
    res: {
      setHeader: (arg0: string, arg1: string) => void;
      send: (arg0: any) => void;
    }
  ) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
  }
);

export { app, updateMetrics };
