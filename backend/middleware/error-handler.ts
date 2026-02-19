import { NextFunction, Request, Response } from 'express';
import { CustomError } from '../errors/custom-error';
import { logger } from '../logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error with context
  const errorContext = {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    statusCode: err instanceof CustomError ? err.statusCode : 400,
    userId: (req as any).user?.id,
    timestamp: new Date().toISOString(),
  };

  logger.error('Error occurred', errorContext);

  if (err instanceof CustomError) {
    return res.status(err.statusCode).send({ errors: err.serializeErrors() });
  }

  res.status(400).send({
    errors: [{ message: 'Something went wrong' }],
  });
};
