import express, { Request, Response, CookieOptions } from 'express';
import { body } from 'express-validator';
import { auth, handlePassportAuth } from '../../middleware/auth';
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
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    // Force account selection to prevent rapid redirects
    prompt: 'select_account',
  })
);

router.get(
  '/auth/google/callback',
  (req, res, next) => {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    passport.authenticate('google', {
      failureRedirect: `${clientUrl}/login`, // Use full client URL for failure
      session: false,
    })(req, res, next);
  },
  (req: Request, res: Response) => {
    const user = req.user as any;
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as
        | 'lax'
        | 'strict'
        | 'none',
      path: '/',
      partitioned: process.env.NODE_ENV === 'production' ? true : undefined,
      domain: process.env.COOKIE_DOMAIN || undefined,
    };

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    const redirectUrl = `${clientUrl}?auth=success`;

    res.redirect(redirectUrl);
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
