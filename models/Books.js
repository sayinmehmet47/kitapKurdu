const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    file: {
      type: String,
    },
    size: {
      type: Number,
    },
    url: {
      type: String,
    },
    date: {
      type: Date,
    },
  },
  { collection: 'ilkparti' }
);

module.exports = Books = mongoose.model('ilkparti', schema);
