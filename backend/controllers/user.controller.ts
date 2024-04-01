import { Request, Response } from 'express';
import {
  authenticateUser,
  loginUser,
  logoutUser,
  registerUser,
} from '../services/user';
import { CustomError } from '../errors/custom-error';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.utils';
import { refreshToken } from '../services/user/auth-v2.service';

export const loginController = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const result = await loginUser(username, password);
  const accessToken = generateAccessToken(result.user);

  const refreshToken = generateRefreshToken(result.user);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });

  res.status(201).json(result);
};

export const registerController = async (req: Request, res: Response) => {
  const { username, email, password, isAdmin = false } = req.body;

  const result = await registerUser(username, email, password, isAdmin);

  const accessToken = generateAccessToken(result.user);
  const refreshToken = generateRefreshToken(result.user);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });

  res.status(201).json(result);
};

export const authController = async (req: Request, res: Response) => {
  try {
    const result = await authenticateUser(req.body.user._id);
    res.json(result);
  } catch (err) {
    if (err instanceof CustomError) {
      return res
        .status(err.statusCode)
        .json({ message: err.serializeErrors() });
    }
  }
};

export const logoutController = async (req: Request, res: Response) => {
  try {
    await logoutUser(req.body.user._id);

    res.cookie('accessToken', '', { expires: new Date(0) });
    res.cookie('refreshToken', '', { expires: new Date(0) });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    if (err instanceof CustomError) {
      return res
        .status(err.statusCode)
        .json({ message: err.serializeErrors() });
    }
  }
};

export const refreshTokenController = async (req: Request, res: Response) => {
  try {
    const result = await refreshToken(req.body.user.id);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof CustomError) {
      return res
        .status(err.statusCode)
        .json({ message: err.serializeErrors() });
    }
  }
};
