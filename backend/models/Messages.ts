import mongoose from 'mongoose';

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

export const Messages = mongoose.model('Messages', schema);
