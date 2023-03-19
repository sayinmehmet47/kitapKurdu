const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    text: {
      type: String,
    },
    date: {
      type: Date,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { collection: 'messages' }
);

module.exports = Messages = mongoose.model('Messages', schema);
