import jwt from 'jsonwebtoken';
import {
  ACCESS_TOKEN_MAX_AGE_MS,
  generateAccessToken,
  generateRefreshToken,
  REFRESH_TOKEN_MAX_AGE_MS,
} from '../jwt.utils';

const payload = {
  _id: 'test-id',
  username: 'test',
  email: 'test@test.com',
  isAdmin: false,
};

describe('jwt.utils token lifetimes', () => {
  it('issues access tokens that expire exactly 8 hours after issue', () => {
    const token = generateAccessToken(payload);
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    const lifetimeSeconds = (decoded.exp as number) - (decoded.iat as number);

    expect(lifetimeSeconds).toBe(8 * 60 * 60);
    expect(lifetimeSeconds).toBe(ACCESS_TOKEN_MAX_AGE_MS / 1000);
  });

  it('issues refresh tokens that expire exactly 7 days after issue', () => {
    const token = generateRefreshToken(payload);
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    const lifetimeSeconds = (decoded.exp as number) - (decoded.iat as number);

    expect(lifetimeSeconds).toBe(7 * 24 * 60 * 60);
    expect(lifetimeSeconds).toBe(REFRESH_TOKEN_MAX_AGE_MS / 1000);
  });

  it('keeps cookie max-ages aligned with token lifetimes', () => {
    expect(ACCESS_TOKEN_MAX_AGE_MS).toBe(8 * 60 * 60 * 1000);
    expect(REFRESH_TOKEN_MAX_AGE_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });
});
