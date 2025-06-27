
import passport from 'passport';
import { NextFunction, Request, Response } from 'express';

export const auth = passport.authenticate('jwt', { session: false });

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  auth(req, res, () => {
    if (req.user && (req.user as any).isAdmin) {
      next();
    } else {
      res.status(403).json({ msg: 'Forbidden' });
    }
  });
};
