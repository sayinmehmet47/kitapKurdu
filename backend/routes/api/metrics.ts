import { NextFunction } from 'express';

const express = require('express');
const morgan = require('morgan');
const {
  collectDefaultMetrics,
  register,
  Counter,
  Gauge,
  Histogram,
} = require('prom-client');

const app = express();

// Customized Http Metrics (Optional)
const httpMetricsLabelNames = ['method', 'route', 'app'];

// Buckets of response time for each route grouped by seconds
const httpRequestDurationBuckets = new Histogram({
  name: 'nodejs_http_response_time',
  help: 'Response time of all requests',
  labelNames: [...httpMetricsLabelNames, 'code'],
});

// Count of all requests - gets increased by 1
const totalHttpRequestCount = new Counter({
  name: 'nodejs_http_total_count',
  help: 'Total Requests',
  labelNames: [...httpMetricsLabelNames, 'code'],
});

// Response time for each route's last request
const totalHttpRequestDuration = new Gauge({
  name: 'nodejs_http_total_duration',
  help: 'Response time of the Last Request',
  labelNames: httpMetricsLabelNames,
});

app.use(morgan('dev'));

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

module.exports = {
  metricsServer: app,
};