import passport from 'passport';
import { NextFunction, Request, Response } from 'express';
import { logger } from '../logger';

// JWT authentication middleware using Passport
export const auth = passport.authenticate('jwt', { session: false });

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
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`Starting ${strategy} authentication`);
    }

    passport.authenticate(
      strategy,
      { session: false },
      (err: any, user: any, info: any) => {
        if (err) {
          logger.error(`${strategy} authentication error`, {
            strategy,
            error: err.message,
            stack: err.stack
          });
          return res.status(500).json({
            success: false,
            message: 'Authentication error',
            error: err.message,
          });
        }

        if (!user) {
          const message = info?.message || 'Authentication failed';
          const status = info?.status || 401;
          if (process.env.NODE_ENV !== 'production') {
            logger.info(`${strategy} authentication failed`, {
              strategy,
              message,
              status,
              info
            });
          }
          return res.status(status).json({
            success: false,
            message,
          });
        }

        if (process.env.NODE_ENV !== 'production') {
          logger.info(`${strategy} authentication success`, {
            strategy,
            userId: user._id,
            username: user.username
          });
        }
        req.user = user;
        next();
      }
    )(req, res, next);
  };
};
