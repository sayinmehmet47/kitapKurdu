import express, { Request, Response } from 'express';
import { User } from '../../models/User';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  const sub = req.body.subscription;
  const user = req.body.user;

  if (!sub || !user) {
    return res
      .status(400)
      .json({ message: 'Missing subscription information.' });
  }

  User.findByIdAndUpdate(user._id, {
    $set: { subscription: sub },
  }).catch((e) => console.error(e));

  res.status(201).json({ message: 'Subscription added successfully.' });
});

module.exports = router;
