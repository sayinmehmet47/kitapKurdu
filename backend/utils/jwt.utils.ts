import jwt, { type JwtPayload } from 'jsonwebtoken';

// Validate JWT secrets at module load time
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET_KEY;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET_KEY;

if (!ACCESS_TOKEN_SECRET) {
  throw new Error('ACCESS_TOKEN_SECRET_KEY environment variable is required');
}

if (!REFRESH_TOKEN_SECRET) {
  throw new Error('REFRESH_TOKEN_SECRET_KEY environment variable is required');
}

// Cookie max-ages must stay aligned with the JWT expirations below so cookie
// lifetimes cannot drift from token lifetimes.
export const ACCESS_TOKEN_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours
export const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const generateAccessToken = (payload: JwtPayload) => {
  const { _id, username, email, isAdmin = false } = payload;
  return jwt.sign({ _id, username, email, isAdmin }, ACCESS_TOKEN_SECRET, {
    expiresIn: '8h',
  });
};

const generateRefreshToken = (payload: JwtPayload) => {
  const { _id, username, email, isAdmin = false } = payload;
  return jwt.sign({ _id, username, email, isAdmin }, REFRESH_TOKEN_SECRET, {
    expiresIn: '7d',
  });
};

const verifyAccessToken = (token: string) => {
  return jwt.verify(token, ACCESS_TOKEN_SECRET);
};

export { generateAccessToken, generateRefreshToken, verifyAccessToken };
