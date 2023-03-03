const express = require('express');
const router = express.Router();
const NodeCache = require('node-cache');
const cache = new NodeCache();
const Books = require('../../models/Books');
const User = require('../../models/User');

router.get('/allBooks', async (req, res) => {
  Books.find({}, function (err, Books) {
    if (err) return done(err);

    if (Books) {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;

      const results = {};

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
  });
});

router.get('/search', async (req, res) => {
  const cacheKey = JSON.stringify(req.query); // use the query as the cache key
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    console.log('Serving from cache');
    return res.json(cachedResult);
  }
  const query = {
    name: {
      $regex: req.query.name,
      $options: 'i',
    },
  };
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;

  const [count, results] = await Promise.all([
    Books.countDocuments(query, { collation: { locale: 'tr', strength: 2 } }),
    Books.find(query)
      .select('name path size date url') // only return name and author fields
      .skip(startIndex)
      .limit(limit)
      .lean(), // return plain JS objects instead of Mongoose documents
  ]);

  const endIndex = Math.min(startIndex + limit, count);

  const pagination = {};
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
  });
  ikinciParti.save((err, data) => {
    if (err) console.log(err);
    res.json(data);
  });
});

router.post('/uploadBooks', (req, res) => {});

router.post('/deleteBook', (req, res) => {
  const id = req.body.id;
  console.log(id);
  Books.findByIdAndDelete(id, (err, data) => {
    if (err) console.log(err);
    res.json(data);
  });

  // invalidate the cache
  cache.flushAll();
});

// router.post('/updateBook', (req, res) => {
//   User.findOne({ username: 'mehmesayin' })
//     .then((user) => {
//       return Books.updateMany({}, { $set: { uploader: user._id } });
//     })
//     .then((result) => {
//       console.log(`Updated ${result.nModified} documents`);
//     })
//     .catch((error) => {
//       console.error(error);
//     });
// });

module.exports = router;
