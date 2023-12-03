import mongoose from 'mongoose';

export const schema = new mongoose.Schema(
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
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    category: {
      type: [String],
      default: ['Science'],
    },
    description: {
      type: String,
    },

    imageLinks: {
      smallThumbnail: {
        type: String,
      },
      thumbnail: {
        type: String,
      },
    },

    language: {
      type: String,
      enum: ['turkish', 'english'],
      default: 'turkish',
    },
  },
  { collection: 'ilkparti' }
);

export const Books = mongoose.model('Books', schema);
