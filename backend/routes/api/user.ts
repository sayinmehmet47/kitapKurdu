import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import {
  auth,
  localAuth,
  refreshTokenAuth,
  handlePassportAuth,
} from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate-request';
import passport from 'passport';
import {
  generateAccessToken,
  generateRefreshToken,
} from '../../utils/jwt.utils';

import {
  authController,
  loginController,
  logoutController,
  refreshTokenController,
  registerController,
} from '../../controllers/user.controller';
import {
  verifyEmailController,
  resendVerificationController,
} from '../../controllers/emailVerification.controller';
const router = express.Router();

router.post(
  '/login',
  [
    body('username', 'Please enter a valid username').isLength({ min: 3 }),
    body('password', 'Please enter a valid password').isLength({ min: 6 }),
  ],
  validateRequest,
  handlePassportAuth('local'),
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

router.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    session: false,
  }),
  (req: Request, res: Response) => {
    const user = req.user as any;
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.redirect(process.env.CLIENT_URL || 'http://localhost:3000');
  }
);

router.get('/auth', auth, authController);

router.post('/logout', auth, logoutController);

router.post(
  '/refresh-token',
  handlePassportAuth('refresh-token'),
  refreshTokenController
);

// Email verification routes
router.get('/verify-email/:token', verifyEmailController);
router.post(
  '/resend-verification',
  [
    body('email', 'Please enter a valid email')
      .isEmail()
      .withMessage('Email must be valid'),
  ],
  validateRequest,
  resendVerificationController
);

export { router as userRouter };
