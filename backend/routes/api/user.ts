import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { auth } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate-request';

import {
  authController,
  loginController,
  logoutController,
  registerController,
} from '../../controllers/user.controller';
const router = express.Router();

router.post(
  '/login',
  [
    body('username', 'Please enter a valid username').isLength({ min: 3 }),
    body('password', 'Please enter a valid password').isLength({ min: 6 }),
  ],
  validateRequest,
  loginController
);

router.post(
  '/register',
  [
    body('username', 'Please enter a valid username').isLength({ min: 3 }),
    body('email', 'Please enter a valid email')
      .isEmail()
      .withMessage('Email must be valid'),
    body('password', 'Please enter a valid password')
      .trim()
      .isLength({ min: 6, max: 20 })
      .withMessage('Password must be between 4 and 20 characters'),
    body('isAdmin', 'Please enter a valid isAdmin').isBoolean().optional(),
  ],
  validateRequest,
  registerController
);

router.get('/auth', auth, authController);

router.post('/logout', auth, logoutController);

export { router as userRouter };
