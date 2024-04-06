import { User } from '../../models/User';
import util from 'util';
import { BadRequestError } from '../../errors/bad-request-error';
import { NotFoundError } from '../../errors/not-found-error';
import { comparePassword } from '../../utils/bcrypt.util';
import { logger } from '../../logger';

const loginUser = async (username: string, password: string) => {
  try {
    const user = await User.findOne({ username });

    if (!user) {
      logger.error(`Login attempt failed for username: ${username}`);
      throw new BadRequestError('Invalid credentials');
    } 

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      logger.error(`Invalid password for username: ${username}`);
      throw new NotFoundError('Invalid credentials');
    }

    logger.info(`User ${username} logged in successfully`);

    return {
      user: {
        _id: user._id,
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

    logger.error(`Unexpected error during login for username: ${username}: ${util.inspect(error)}`);;
    throw new Error('Unexpected error occurred during login');
  }
};

export { loginUser };
