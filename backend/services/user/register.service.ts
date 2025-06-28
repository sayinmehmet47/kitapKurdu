import { User } from '../../models/User';
import { BadRequestError } from '../../errors/bad-request-error';
import { hashPassword } from '../../utils/bcrypt.util';
import { emailService } from '../email/emailService';
import crypto from 'crypto';

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

  // Generate email verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const newUser = new User({
    username,
    email,
    password: hash,
    isAdmin,
    emailVerificationToken: verificationToken,
    emailVerificationExpires: verificationExpires,
  });

  const savedUser = await newUser.save();

  // Send verification email
  await emailService.sendVerificationEmail(email, username, verificationToken);

  return {
    user: {
      id: savedUser.id,
      username: savedUser.username,
      email: savedUser.email,
      isEmailVerified: savedUser.isEmailVerified,
    },
  };
};
