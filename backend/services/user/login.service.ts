import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '../../models/User';
import { BadRequestError } from '../../errors/bad-request-error';
import { NotFoundError } from '../../errors/not-found-error';

const loginUser = async (username: string, password: string) => {
  const user = await User.findOne({ username });

  if (!user) throw new BadRequestError('Invalid credentials');
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new NotFoundError('Invalid credentials');
  const token = jwt.sign(
    { id: user._id, isAdmin: user.isAdmin },
    process.env.JWT_SECRET || '',
    { expiresIn: '4h' }
  );

  return {
    token,
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
