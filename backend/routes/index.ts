import express from 'express';
import { analyticsRouter } from './api/analytics';
import { booksRouter } from './api/books';
import { duplicateAuditRouter } from './api/duplicateAudit';
import { messagesRouter } from './api/messages';
import { ratingsRouter } from './api/ratings';
import { subscriptionRouter } from './api/subscription';
import { userRouter } from './api/user';

const router = express.Router();

router.use('/books', booksRouter);
router.use('/user', userRouter);
router.use('/messages', messagesRouter);
router.use('/subscription', subscriptionRouter);
router.use('/ratings', ratingsRouter);
router.use('/analytics', analyticsRouter);
router.use('/duplicate-audit', duplicateAuditRouter);

export default router;
