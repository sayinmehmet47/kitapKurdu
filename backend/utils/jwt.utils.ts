import jwt, { JwtPayload } from 'jsonwebtoken';

const generateAccessToken = (payload: JwtPayload) => {
  const { _id, username, email, isAdmin = false } = payload;
  return jwt.sign(
    { _id, username, email, isAdmin },
    process.env.ACCESS_TOKEN_SECRET_KEY || '',
    {
      expiresIn: '15m',
    }
  );
};

const generateRefreshToken = (payload: JwtPayload) => {
  const { _id, username, email, isAdmin = false } = payload;
  return jwt.sign(
    { _id, username, email, isAdmin },
    process.env.REFRESH_TOKEN_SECRET_KEY || '',
    {
      expiresIn: '7d',
    }
  );
};

const verifyAccessToken = (token: string) => {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY!);
};

export { generateAccessToken, generateRefreshToken, verifyAccessToken };
