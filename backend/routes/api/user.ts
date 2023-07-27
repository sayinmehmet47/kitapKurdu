import express, { Request, Response } from 'express';

import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import { User } from '../../models/User';
import bcrypt from 'bcrypt';
import { auth } from '../../middleware/auth';
import { Error } from 'mongoose';
import { NotFoundError } from '../../errors/not-found-error';
import { validateRequest } from '../../middleware/validate-request';
import { BadRequestError } from '../../errors/bad-request-error';
const router = express.Router();

router.post(
  '/login',
  [
    body('username', 'Please enter a valid username').isLength({ min: 3 }),
    body('password', 'Please enter a valid password').isLength({ min: 6 }),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) throw new BadRequestError('Invalid credentials');

    console.log('user: ', user);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new NotFoundError('Invalid credentials');
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || '',
      { expiresIn: '4h' }
    );

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        isAdmin: user.isAdmin,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  }
);

router.post(
  '/register',
  [
    body('username', 'Please enter a valid username').isLength({ min: 3 }),
    body('email', 'Please enter a valid email')
      .isEmail()
      .withMessage('Email must be valid'),
    body('password', 'Please enter a valid password')
      .trim()
      .isLength({ min: 4, max: 20 })
      .withMessage('Password must be between 4 and 20 characters'),
    body('isAdmin', 'Please enter a valid isAdmin').isBoolean().optional(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { username, email, password, isAdmin = false } = req.body;

    const user = await User.findOne({ email });
    if (user) throw new BadRequestError('User already exists');
    const salt = await bcrypt.genSalt(10);
    if (!salt) throw new Error('Something went wrong with bcrypt');

    const hash = await bcrypt.hash(password, salt);
    if (!hash) throw new Error('Something went wrong hashing the password');

    const newUser = new User({
      username,
      email,
      password: hash,
      isAdmin,
    });

    const savedUser = await newUser.save();
    if (!savedUser) throw new Error('Something went wrong saving the user');

    const token = jwt.sign(
      { id: savedUser._id, isAdmin: savedUser.isAdmin },
      process.env.JWT_SECRET || '',
      { expiresIn: '4h' }
    );
    res.status(201).json({
      token,
      user: {
        id: savedUser.id,
        username: savedUser.username,
        email: savedUser.email,
      },
    });
  }
);

router.get('/auth', auth, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.body.user.id).select('-password');
    const token = req.header('Authorization')?.split(' ')[1];

    res.json({
      user: {
        _id: user?._id,
        username: user?.username,
        isAdmin: user?.isAdmin,
        email: user?.email,
        createdAt: user?.createdAt,
        updatedAt: user?.updatedAt,
      },
      token: token,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// router.post('/updateUser', auth, async (req, res) => {
//   Books.find({}).then((books) => {
//     User.findOne({ username: 'mehmesayin' }).then((user) => {
//       user.booksUploaded = books;
//       user.save();
//     });
//   });
// });

module.exports = router;
