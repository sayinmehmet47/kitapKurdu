import { User } from '../../models/User';
import util from 'util';
import { BadRequestError } from '../../errors/bad-request-error';
import { NotFoundError } from '../../errors/not-found-error';
import { comparePassword } from '../../utils/bcrypt.util';
import { logger } from '../../logger';

const loginUser = async (usernameOrEmail: string, password?: string) => {
  try {
    // Allow login with either username or email
    const user = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    });

    if (!user || !user.password) {
      logger.error(`Login attempt failed for: ${usernameOrEmail}`);
      throw new BadRequestError('Invalid credentials');
    }

    if (!password) {
      throw new BadRequestError('Invalid credentials');
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      logger.error(`Invalid password for: ${usernameOrEmail}`);
      throw new BadRequestError('Invalid credentials');
    }

    if (user.isEmailVerified === false && user.password && !user.googleId) {
      throw new BadRequestError(
        'Please verify your email address before signing in'
      );
    }

    logger.info(`User ${usernameOrEmail} logged in successfully`);

    return {
      user: {
        id: user._id.toString(),
        username: user.username,
        isAdmin: user.isAdmin,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  } catch (error) {
    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      throw error;
    }

    logger.error(
      `Unexpected error during login for: ${usernameOrEmail}: ${util.inspect(
        error
      )}`
    );
    throw new Error('Unexpected error occurred during login');
  }
};

export { loginUser };
