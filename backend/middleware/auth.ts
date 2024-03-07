import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export const auth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token)
    return res.status(401).json({ msg: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, '' + process.env.JWT_SECRET);
    req.body.user = decoded;
    next();
  } catch (e) {
    res.status(400).json({ msg: 'Token is not valid' });
  }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token)
    return res.status(401).json({ msg: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, '' + process.env.JWT_SECRET);
    req.body.user = decoded;
    if (!req.body.user.isAdmin) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }
    next();
  } catch (e) {
    res.status(400).json({ msg: 'Token is not valid' });
  }
};
