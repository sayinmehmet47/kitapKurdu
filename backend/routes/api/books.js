const express = require('express');
const router = express.Router();
const Books = require('../../models/Books');

router.get('/', async (req, res) => {
  Books.find({}, function (err, Books) {
    if (err) return done(err);

    if (Books) {
      res.json(Books);
    }
  });
});

router.get('/:name', (req, res) => {
  Books.find(
    { name: { $regex: req.params.name, $options: 'i' } },
    function (err, Books) {
      if (err) return done(err);

      if (Books) {
        res.json(Books);
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

// router.delete('/:id', (req, res) => {
//   const id = req.params.id;

//   Item.findByIdAndDelete(id, (err, data) => {
//     if (err) {
//       res.json(err);
//     } else {
//       res.json(data);
//     }
//   });
// });

module.exports = router;
