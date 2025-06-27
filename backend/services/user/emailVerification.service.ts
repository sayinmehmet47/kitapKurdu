import { User } from '../../models/User';
import { BadRequestError } from '../../errors/bad-request-error';
import { NotFoundError } from '../../errors/not-found-error';
import { logger } from '../../logger';

export const verifyEmail = async (token: string) => {
  try {
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired verification token');
    }

    // Update user as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    logger.info(`Email verified successfully for user: ${user.username}`);

    return {
      message: 'Email verified successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    };
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }
    logger.error('Email verification error:', error);
    throw new Error('Failed to verify email');
  }
};

export const resendVerificationEmail = async (email: string) => {
  try {
    const user = await User.findOne({ email });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestError('Email is already verified');
    }

    // Generate new verification token
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;

    await user.save();

    // Send verification email
    const { emailService } = require('../email/emailService');
    await emailService.sendVerificationEmail(
      email,
      user.username,
      verificationToken
    );

    logger.info(`Verification email resent to: ${email}`);

    return {
      message: 'Verification email sent successfully',
    };
  } catch (error) {
    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Resend verification email error:', error);
    throw new Error('Failed to resend verification email');
  }
};
