import { User } from '../../models/User';
import { BadRequestError } from '../../errors/bad-request-error';
import { hashPassword } from '../../utils/bcrypt.util';

export const registerUser = async (
  username: string,
  email: string,
  password: string,
  isAdmin: boolean = false
) => {
  const user = await User.findOne({ email });

  if (user) throw new BadRequestError('User already exists');

  const existingUserByUsername = await User.findOne({ username });
  if (existingUserByUsername)
    throw new BadRequestError('User with this username already exists');

  const hash = await hashPassword(password);

  const newUser = new User({
    username,
    email,
    password: hash,
    isAdmin,
  });

  const savedUser = await newUser.save();

  return {
    user: {
      id: savedUser.id,
      username: savedUser.username,
      email: savedUser.email,
    },
  };
};
