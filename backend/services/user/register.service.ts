import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../../models/User';
import { BadRequestError } from '../../errors/bad-request-error';

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

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const newUser = new User({
    username,
    email,
    password: hash,
    isAdmin,
  });

  const savedUser = await newUser.save();

  const token = jwt.sign(
    { id: savedUser._id, isAdmin: savedUser.isAdmin },
    process.env.JWT_SECRET || '',
    { expiresIn: '4h' }
  );

  return {
    token,
    user: {
      id: savedUser.id,
      username: savedUser.username,
      email: savedUser.email,
    },
  };
};
