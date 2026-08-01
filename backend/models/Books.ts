import type { Document } from 'mongoose';
import mongoose from 'mongoose';

export const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      index: true,
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
      index: true,
    },
    author: {
      type: String,
      default: null,
    },
    isbn: {
      type: String,
      default: null,
    },
    publisher: {
      type: String,
      default: null,
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
    // Soft-hide: when set, this book is considered a duplicate of the
    // referenced canonical book and is hidden from all public endpoints.
    // Nullable and optional on purpose - no index, migration or backfill.
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Books',
      default: null,
    },
  },
  { collection: 'ilkparti' }
);

schema.index(
  { author: 1 },
  {
    name: 'books_author_tr_strength_2',
    collation: { locale: 'tr', strength: 2 },
  }
);

schema.index(
  { isbn: 1 },
  {
    name: 'books_isbn_tr_strength_2',
    collation: { locale: 'tr', strength: 2 },
  }
);

schema.index(
  {
    name: 'text',
    description: 'text',
    category: 'text',
  },
  {
    default_language: 'turkish',
    language_override: 'language',
  }
);

export interface IBook extends Document {
  name: string;
  file: string;
  size: number;
  url: string;
  date: Date;
  uploader: mongoose.Schema.Types.ObjectId;
  category: string[];
  description: string;
  author?: string | null;
  isbn?: string | null;
  publisher?: string | null;
  imageLinks: {
    smallThumbnail: string;
    thumbnail: string;
  };
  language: 'turkish' | 'english';
  duplicateOf?: mongoose.Schema.Types.ObjectId | null;
}

export const Books = mongoose.model<IBook>('Books', schema);
