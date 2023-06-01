import { Request, Response } from 'express';
import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();
const books = require('./routes/api/books');
const user = require('./routes/api/user');
const messages = require('./routes/api/messages');

app.use(express.json());

require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || '').then(() => {
  console.log('Connected to MongoDB');
});
const corsOptions = {
  origin: '*',
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use('/books', books);
app.use('/user', user);
app.use('/messages', messages);

if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

const listener = app.listen(process.env.PORT || 5000, () => {
  console.log(`Server started on port pro` + process.env.PORT || 5000);
});

module.exports = listener;
