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
  },
  { collection: 'ilkparti' }
);

module.exports = Books = mongoose.model('ilkparti', schema);
