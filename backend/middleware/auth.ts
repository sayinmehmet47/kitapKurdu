import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import status from 'http-status-codes';
import { apiResponse } from '../utils/apiResponse.utils';
import { verifyAccessToken, verifyRefreshToken } from '../utils/jwt.utils';
import { CustomError } from '../errors/custom-error';
import cookie from 'cookie';
import { logger } from '../logger';

export interface AuthRequest extends Request {
  user?: string | jwt.JwtPayload;
}

export const auth = (req: Request, res: Response, next: NextFunction) => {
  const cookies = cookie.parse(req.headers.cookie || '');
  const accessToken = cookies.accessToken;

  if (!accessToken) {
    logger.error('No token, authorization denied');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = verifyAccessToken(accessToken);
    req.body.user = decoded;
    if (!req.body.user.isAdmin) {
      req.body.user.isAdmin = false;
    }
    next();
  } catch (e) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const cookies = cookie.parse(req.headers.cookie || '');
  const accessToken = cookies.accessToken;

  if (!accessToken) {
    logger.error('No token, authorization denied');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = verifyAccessToken(accessToken);
    req.body.user = decoded;
    if (!req.body.user.isAdmin) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }
    next();
  } catch (e) {
    res.status(400).json({ msg: 'Token is not valid' });
  }
};

export const refreshToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      throw apiResponse(
        status.BAD_REQUEST,
        'BAD_REQUEST',
        'Refresh token is required'
      );

    req.user = verifyRefreshToken(refreshToken);
    next();
  } catch (e) {
    if (e instanceof CustomError) {
      if (e.name === 'JsonWebTokenError') {
        return res
          .status(status.UNAUTHORIZED)
          .json(
            apiResponse(
              status.UNAUTHORIZED,
              'UNAUTHORIZED',
              'Invalid refresh token. Please login again.'
            )
          );
      }
      if (e.name === 'TokenExpiredError') {
        return res
          .status(status.UNAUTHORIZED)
          .json(
            apiResponse(
              status.UNAUTHORIZED,
              'UNAUTHORIZED',
              'Refresh token expired. Please login again.'
            )
          );
      }

      return res
        .status(e.statusCode)
        .json(apiResponse(e.statusCode, e.name, e.message));
    }
  }
};
