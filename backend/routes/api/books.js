const express = require('express');
const router = express.Router();
const Books = require('../../models/Books');

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

router.get('/search', (req, res) => {
  Books.find(
    { name: { $regex: req.body.name, $options: 'i' } },
    function (err, Books) {
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
    }
  );
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

router.post('/deleteBook', (req, res) => {
  const id = req.body.id;
  console.log(id);
  Books.findByIdAndDelete(id, (err, data) => {
    if (err) console.log(err);
    res.json(data);
  });
});

module.exports = router;
