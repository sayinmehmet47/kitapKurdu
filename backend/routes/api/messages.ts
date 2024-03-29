import express from 'express';
import { auth } from '../../middleware/auth';

import { body } from 'express-validator';
import { validateRequest } from '../../middleware/validate-request';

import {
  createUserMessageController,
  deleteMessageController,
  getUserMessagesController,
} from '../../controllers/messages.controller';

const router = express.Router();

router.get('/userMessages', auth, getUserMessagesController);

router.post(
  '/userMessages',
  auth,
  [
    body('text').not().isEmpty().isString().withMessage('Text is required'),
    body('sender').not().isEmpty().isString().withMessage('Sender is required'),
  ],
  validateRequest,
  createUserMessageController
);

router.delete(
  '/deleteMessage',
  auth,
  [body('id').not().isEmpty().withMessage('Id is required')],
  validateRequest,
  deleteMessageController
);

export { router as messagesRouter };
