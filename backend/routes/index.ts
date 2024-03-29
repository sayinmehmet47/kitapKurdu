import express from 'express';
import { booksRouter } from './api/books';
import { userRouter } from './api/user';
import { messagesRouter } from './api/messages';

const router = express.Router();

router.use('/books', booksRouter);
router.use('/user', userRouter);
router.use('/messages', messagesRouter);

export default router;
