import { Error } from 'mongoose';
import express, { NextFunction, Request, Response } from 'express';
import { auth, isAdmin } from '../../middleware/auth';
import { NotFoundError } from '../../errors/not-found-error';
import { body } from 'express-validator';
import { validateRequest } from '../../middleware/validate-request';
import axios from 'axios';
import Bottleneck from 'bottleneck';
import { Books, IBook } from '../../models/Books';
const router = express.Router();
const NodeCache = require('node-cache');
const cache = new NodeCache();

interface VolumeInfo {
  categories: string[];
}

interface Item {
  volumeInfo: VolumeInfo;
}
export interface BooksData {
  results: IBook[];
  total: number;
  page: number;
  next?: {
    page: number;
  };
  previous?: {
    page: number;
  };
}

router.get('/allBooks', async (req: Request, res: Response) => {
  try {
    const page = parseInt(String(req.query.page)) || 1;
    const limit = parseInt(String(req.query.limit)) || 10;

    const startIndex = (page - 1) * limit;

    const total = await Books.countDocuments();
    const results: BooksData = {
      results: await Books.find().skip(startIndex).limit(limit),
      total: total,
      page: page,
      next: total > startIndex + limit ? { page: page + 1 } : undefined,
      previous: startIndex > 0 ? { page: page - 1 } : undefined,
    };

    res.status(201).json(results);
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message);
    } else {
      throw new Error(String(err));
    }
  }
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
      .select(
        'name path size date url uploader category language description imageLinks'
      )
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
  async (req: Request, res: Response) => {
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        req.body.name
      )}`
    );

    const categories = new Set(
      response.data.items
        .slice(0, 10)
        .filter((item: Item) => item.volumeInfo.categories)
        .flatMap((item: Item) => item.volumeInfo.categories)
        .map((category: string) => category.toLowerCase())
    );

    const convertedCategories = Array.from(categories);

    const { description, imageLinks } = response.data.items[0].volumeInfo;

    const books = new Books({
      name: req.body.name,
      url: req.body.url,
      size: req.body.size,
      date: new Date(),
      uploader: req.body.uploader,
      category: convertedCategories,
      description,
      imageLinks,
    });

    await books.save();

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

router.post('/updateBook/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const name = req.body.name;
  const language = req.body.language;

  Books.findById(
    id,
    (
      err: Error,
      data: {
        name: string;
        language: string;
        save: (arg0: (err: any, data: any) => void) => void;
      }
    ) => {
      if (err) console.log(err);
      if (data) {
        data.name = name;
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
        description: string;
        imageLinks: {
          smallThumbnail: string;
          thumbnail: string;
        };
      }
    ) => {
      if (err) console.log(err);
      res.status(201).json(data);
    }
  );
});

const limiter = new Bottleneck({
  minTime: 200, // Minimum time between subsequent tasks in ms. Adjust this value to fit the rate limit of the API.
});

router.post('/updateCategories', async (req: Request, res: Response) => {
  const books = await Books.find({}).lean();

  const updatePromises = books.map((book) => {
    return limiter.schedule(async () => {
      if (book.name) {
        const response = await axios.get(
          `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
            book.name
          )}`
        );

        const categories = new Set(
          response.data.items
            .slice(0, 10)
            .filter((item: Item) => item.volumeInfo.categories)
            .flatMap((item: Item) => item.volumeInfo.categories)
            .map((category: string) => category.toLowerCase())
        );

        const convertedCategories = Array.from(categories);
        const { description, imageLinks } = response.data.items[0].volumeInfo;

        console.log('book', book.name);

        return Books.findByIdAndUpdate(book._id, {
          category: convertedCategories,
          description,
          imageLinks,
        });
      }
    });
  });

  await Promise.all(updatePromises);

  res.status(200).send('Categories updated');
});

module.exports = router;
