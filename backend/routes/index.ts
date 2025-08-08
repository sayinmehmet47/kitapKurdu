import express from 'express';
import { booksRouter } from './api/books';
import { userRouter } from './api/user';
import { messagesRouter } from './api/messages';
import { subscriptionRouter } from './api/subscription';
import { ratingsRouter } from './api/ratings';

const router = express.Router();

router.use('/books', booksRouter);
router.use('/user', userRouter);
router.use('/messages', messagesRouter);
router.use('/subscription', subscriptionRouter);
router.use('/ratings', ratingsRouter);

export default router;
