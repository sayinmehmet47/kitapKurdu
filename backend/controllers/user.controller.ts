import { Request, Response } from 'express';
import {
  authenticateUser,
  loginUser,
  logoutUser,
  registerUser,
} from '../services/user';

export const loginController = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const result = await loginUser(username, password);
  res.status(201).json(result);
};

export const registerController = async (req: Request, res: Response) => {
  const { username, email, password, isAdmin = false } = req.body;
  const result = await registerUser(username, email, password, isAdmin);
  res.status(201).json(result);
};

export const authController = async (req: Request, res: Response) => {
  try {
    const token = req.header('Authorization')?.split(' ')[1] || '';
    const result = await authenticateUser(req.body.user.id, token);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const logoutController = async (req: Request, res: Response) => {
  try {
    await logoutUser(req.body.user.id);
    res.status(201).json({});
  } catch (err: any) {
    res.status(500).json({ message: 'User logged out successfully' });
  }
};
