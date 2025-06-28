// ⚠️ DEPRECATED: This middleware is no longer used
// Refresh token authentication is now handled by Passport.js
// See: backend/src/config/passport.ts - RefreshTokenStrategy
// Use: handlePassportAuth('refresh-token') from middleware/auth.ts instead

import { NextFunction, Request, Response } from 'express';

/**
 * @deprecated This middleware is deprecated. Use Passport.js refresh token strategy instead.
 * Import { handlePassportAuth } from './auth' and use handlePassportAuth('refresh-token')
 */
export const refreshToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.warn(
    '⚠️ DEPRECATED: refreshToken middleware is deprecated. Use Passport.js refresh token strategy instead.'
  );

  return res.status(500).json({
    success: false,
    message:
      'This middleware is deprecated. Please use Passport.js refresh token strategy.',
    migration:
      'Use handlePassportAuth("refresh-token") from middleware/auth.ts',
  });
};
