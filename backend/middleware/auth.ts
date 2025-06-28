import passport from 'passport';
import { NextFunction, Request, Response } from 'express';

// JWT authentication middleware using Passport
export const auth = passport.authenticate('jwt', { session: false });

// Local authentication middleware for login using Passport
export const localAuth = passport.authenticate('local', { session: false });

// Refresh token authentication middleware using Passport
export const refreshTokenAuth = passport.authenticate('refresh-token', {
  session: false,
});

// Admin authorization middleware
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  auth(req, res, () => {
    if (req.user && (req.user as any).isAdmin) {
      next();
    } else {
      res.status(403).json({ msg: 'Forbidden' });
    }
  });
};

// Helper middleware to handle Passport authentication with custom responses
export const handlePassportAuth = (strategy: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
      strategy,
      { session: false },
      (err: any, user: any, info: any) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Authentication error',
            error: err.message,
          });
        }

        if (!user) {
          const message = info?.message || 'Authentication failed';
          const status = info?.status || 401;
          return res.status(status).json({
            success: false,
            message,
          });
        }

        req.user = user;
        next();
      }
    )(req, res, next);
  };
};
