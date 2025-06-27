import { Request, Response } from 'express';
import {
  verifyEmail,
  resendVerificationEmail,
} from '../services/user/emailVerification.service';

export const verifyEmailController = async (req: Request, res: Response) => {
  const { token } = req.params;

  try {
    const result = await verifyEmail(token);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const resendVerificationController = async (
  req: Request,
  res: Response
) => {
  const { email } = req.body;

  try {
    const result = await resendVerificationEmail(email);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
