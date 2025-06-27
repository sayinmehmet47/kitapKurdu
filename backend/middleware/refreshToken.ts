
import { NextFunction, Request, Response } from 'express';
import { verifyRefreshToken } from '../utils/jwt.utils';
import { apiResponse } from '../utils/apiResponse.utils';
import status from 'http-status-codes';
import { CustomError } from '../errors/custom-error';

export const refreshToken = (
  req: Request,
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

    req.body.user = verifyRefreshToken(refreshToken);
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
