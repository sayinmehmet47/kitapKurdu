import { Request, Response } from 'express';
import { logoutUser, registerUser } from '../services/user';
import { CustomError } from '../errors/custom-error';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.utils';

// Login controller using Passport Local Strategy
export const loginController = async (req: Request, res: Response) => {
  try {
    // User is already authenticated by Passport Local Strategy
    const user = req.user as any;

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const registerController = async (req: Request, res: Response) => {
  try {
    const { username, email, password, isAdmin = false } = req.body;

    const result = await registerUser(username, email, password, isAdmin);

    // For registration, we don't automatically log in the user
    // They need to verify their email first
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      user: result.user,
    });
  } catch (error) {
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.serializeErrors(),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const authController = async (req: Request, res: Response) => {
  try {
    // User is already authenticated by Passport JWT Strategy
    const user = req.user as any;

    res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const logoutController = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user?._id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    await logoutUser(userId);

    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    if (err instanceof CustomError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        errors: err.serializeErrors(),
      });
    }

    return res.status(500).json({
      success: false,
      message: 'An error occurred during logout',
    });
  }
};

// Refresh token controller using Passport Refresh Token Strategy
export const refreshTokenController = async (req: Request, res: Response) => {
  try {
    // User is already authenticated by Passport Refresh Token Strategy
    const user = req.user as any;

    // Generate new access token
    const newAccessToken = generateAccessToken(user);

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Token refresh failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
