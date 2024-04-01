import { User } from '../../models/User';
import { BadRequestError } from '../../errors/bad-request-error';
import { NotFoundError } from '../../errors/not-found-error';
import { comparePassword } from '../../utils/bcrypt.util';

const loginUser = async (username: string, password: string) => {
  const user = await User.findOne({ username });

  if (!user) throw new BadRequestError('Invalid credentials');

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw new NotFoundError('Invalid credentials');

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
};

export { loginUser };
