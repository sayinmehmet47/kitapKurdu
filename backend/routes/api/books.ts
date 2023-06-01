import { Error } from 'mongoose';
import { Books } from './../../models/Books';
import express, { Request, Response } from 'express';
import { User } from '../../models/User';
import { auth } from '../../middleware/auth';
const router = express.Router();
const NodeCache = require('node-cache');
const cache = new NodeCache();

router.get('/allBooks', async (req, res) => {
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
        res.json(results);
      }
    }
  );
});

router.get('/searchBooks', async (req, res) => {
  const cacheKey = JSON.stringify(req.query); // use the query as the cache key
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    console.log('Serving from cache');
    return res.json(cachedResult);
  }
  const query = {
    name: {
      // also find partial matches and turkish characters (i.e. case insensitive)
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
      .select('name path size date url uploader')
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

router.post('/addNewBook', (req, res) => {
  const ikinciParti = new Books({
    name: req.body.name,
    url: req.body.url,
    size: req.body.size,
    date: new Date(),
    uploader: req.body.uploader,
  });
  ikinciParti.save((err, data) => {
    if (err) console.log(err);
    res.json(data);
  });
});

router.get('/recently-added', (req, res) => {
  Books.find({})
    .sort({ date: -1 })
    .limit(50)
    .exec((err, data) => {
      if (err) console.log(err);
      res.json(data);
    });
});

router.post('/deleteBook', auth, (req: Request, res: Response) => {
  const id = req.body.id;

  console.log('id: ', id);

  Books.findByIdAndDelete(id, (err: any, data: any) => {
    if (err) console.log(err);
    if (!data) {
      return res.status(404).json({ msg: 'Book not found' });
    }
    res.json(data);
  });

  cache.flushAll();
});

router.post('/updateBook', (req, res) => {
  User.findOne({ username: 'mehmesayin' })
    .then((user) => {
      return Books.updateMany({}, { $set: { uploader: user?._id } });
    })
    .then((result) => {
      res.json(result);
    })
    .catch((error) => {
      console.error(error);
    });
});

module.exports = router;