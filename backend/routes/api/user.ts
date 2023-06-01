import { AxiosError } from 'axios';
import express, { Request, Response } from 'express';

import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { User } from '../../models/User';
import bcrypt from 'bcrypt';
import { auth } from '../../middleware/auth';
import { Error } from 'mongoose';
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) throw new Error('User not found');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Incorrect password');
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || '',
      { expiresIn: '4h' }
    );

    res.status(200).json({
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
  } catch (error: any) {
    res.status(400).json({
      error: error.message,
    });
  }
});

router.post('/register', async (req, res) => {
  const { username, email, password, isAdmin } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
      msg: 'Please enter all fields',
    });
  }

  try {
    const user = await User.findOne({ email });
    if (user) throw new Error('User already exists');
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
    res.status(200).json({
      token,
      user: {
        id: savedUser.id,
        username: savedUser.username,
        email: savedUser.email,
      },
    });
  } catch (e: any) {
    res.status(400).json({ msg: e.message });
  }
});

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
