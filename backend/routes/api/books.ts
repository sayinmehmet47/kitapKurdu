import { Error } from 'mongoose';
import { Books } from './../../models/Books';
import express, { NextFunction, Request, Response } from 'express';
import { auth, isAdmin } from '../../middleware/auth';
import { NotFoundError } from '../../errors/not-found-error';
import { body } from 'express-validator';
import { validateRequest } from '../../middleware/validate-request';
import client from 'prom-client';
const router = express.Router();
const NodeCache = require('node-cache');
const cache = new NodeCache();

const register = new client.Registry();

// Create a counter metric to track the number of visitors
const visitorsCounter = new client.Counter({
  name: 'visitors_total',
  help: 'Total number of visitors to the /allBooks endpoint',
});

register.registerMetric(visitorsCounter);

router.get('/allBooks', async (req: Request, res: Response) => {
  visitorsCounter.inc(); // Increment by 1

  Books.find(
    {},
    (
      err: Error,
      Books: {
        name: string;
        path: string;
        size: number;
        date: Date;
        url: string;
        uploader: string;
      }[]
    ) => {
      if (err) throw new Error(err.message);

      if (Books) {
        const page = parseInt(String(req.query.page)) || 1;
        const limit = parseInt(String(req.query.limit)) || 10;

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const results: {
          next?: {
            page: number;
            limit: number;
          };
          total?: number;
          previous?: {
            page: number;
            limit: number;
          };
          results?: {
            name: string;
            path: string;
            size: number;
            date: Date;
            url: string;
            uploader: string;
          }[];
        } = {};

        if (endIndex < Books.length) {
          results.next = {
            page: page + 1,
            limit: limit,
          };
        }
        results.total = Books.length;

        if (startIndex > 0) {
          results.previous = {
            page: page - 1,
            limit: limit,
          };
        }

        results.results = Books.slice(startIndex, endIndex);

        console.log(results);
        res.status(201).json(results);
      }
    }
  );
});

router.get('/searchBooks', async (req: Request, res: Response) => {
  const cacheKey = JSON.stringify(req.query);
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    return res.json(cachedResult);
  }
  const query = {
    name: {
      $regex: req.query.name,
      $options: 'i',
    },
  };

  const page = parseInt(String(req.query.page)) || 1;
  const limit = parseInt(String(req.query.limit)) || 10;
  const startIndex = (page - 1) * limit;

  const [count, results] = await Promise.all([
    Books.countDocuments(query, { collation: { locale: 'tr', strength: 2 } }),
    Books.find(query)
      .select('name path size date url uploader category language')
      .populate('uploader', 'username email')
      .skip(startIndex)
      .limit(limit)
      .lean(),
  ]);

  const endIndex = Math.min(startIndex + limit, count);

  const pagination: {
    next?: {
      page: number;
      limit: number;
    };
    total?: number;
    previous?: {
      page: number;
      limit: number;
    };
    results?: any;
  } = {};
  if (endIndex < count) {
    pagination.next = {
      page: page + 1,
      limit: limit,
    };
  }
  pagination.total = count;
  if (startIndex > 0) {
    pagination.previous = {
      page: page - 1,
      limit: limit,
    };
  }
  pagination.results = results;
  cache.set(cacheKey, pagination); // store the result in the cache

  res.json(pagination);
});

router.post(
  '/addNewBook',
  [
    body('name').not().isEmpty().withMessage('Name is required'),
    body('url').not().isEmpty().withMessage('Url is required'),
    body('size').not().isEmpty().withMessage('Size is required'),
    body('uploader').not().isEmpty().withMessage('Uploader is required'),
  ],
  validateRequest,
  auth,
  (req: Request, res: Response) => {
    const books = new Books({
      name: req.body.name,
      url: req.body.url,
      size: req.body.size,
      date: new Date(),
      uploader: req.body.uploader,
    });
    books.save();

    res.status(201).json(books);
  }
);

router.get('/recently-added', (req: Request, res: Response) => {
  Books.find({})
    .sort({ date: -1 })
    .limit(50)
    .exec((err, data) => {
      if (err) console.log(err);
      res.json(data);
    });
});

router.post(
  '/deleteBook/:id',
  validateRequest,
  isAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;

    console.log('fdf', id);

    try {
      const data = await Books.findByIdAndRemove(id);

      if (!data) {
        throw new NotFoundError('Book not found');
      }

      res.status(201).json(data);
    } catch (err) {
      next(err); // Pass the error to the next error-handling middleware
    }

    cache.flushAll();
  }
);

router.post('/updateBook', (req: Request, res: Response) => {
  const id = req.body.id;
  const name = req.body.name;
  const url = req.body.url;
  const size = req.body.size;
  const uploader = req.body.uploader;
  const category = req.body.category;
  const language = req.body.language;

  Books.findById(
    id,
    (
      err: Error,
      data: {
        name: string;
        url: string;
        size: string;
        uploader: string;
        category: string[];
        language: string;
        save: (arg0: (err: any, data: any) => void) => void;
      }
    ) => {
      if (err) console.log(err);
      if (data) {
        data.name = name;
        data.url = url;
        data.size = size;
        data.uploader = uploader;
        data.category = category;
        data.language = language;

        data.save((err, data) => {
          if (err) console.log(err);
          res.status(201).json(data);
        });
      }
    }
  );
});

router.get('/getBookById/:id', (req: Request, res: Response) => {
  const id = req.params.id;

  Books.findById(
    id,
    (
      err: Error,
      data: {
        name: string;
        url: string;
        size: string;
        uploader: string;
        category: string[];
        language: string;
      }
    ) => {
      if (err) console.log(err);
      res.status(201).json(data);
    }
  );
});

module.exports = router;
