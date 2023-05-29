import express from 'express';
import { auth } from '../../middleware/auth';
import { Messages } from '../../models/Messages';

const router = express.Router();

router.get('/userMessages', auth, async (req, res) => {
  const userMessages = await Messages.find({}).populate('sender');
  res.json(userMessages);
});

router.post('/userMessages', auth, async (req, res) => {
  const { text, sender } = req.body;

  const userMessages = new Messages({
    text,
    date: new Date(),
    sender,
  });
  await userMessages.save();
  res.json({ status: 'Message Sent' });
});

router.delete('/userMessages/:id', auth, async (req, res) => {
  const id = req.params.id;

  if (!req.body.user.isAdmin) {
    return res.status(401).json({ msg: 'Not authorized to delete message' });
  }

  if (!id) {
    res.status(400).json({ error: 'Missing id' });
    return;
  }

  Messages.findByIdAndDelete(
    id,
    (
      err: Error,
      data: {
        _id: string;
        text: string;
        date: Date;
        sender: string;
      }
    ) => {
      if (err) console.log(err);
      if (!data) {
        return res.status(404).json({ msg: 'Message not found' });
      }
      res.json(data);
    }
  );
});

module.exports = router;
