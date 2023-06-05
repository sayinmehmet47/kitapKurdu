import express, { Response, Request, NextFunction } from 'express';
import { auth } from '../../middleware/auth';
import { Messages } from '../../models/Messages';
import { body } from 'express-validator';
import { validateRequest } from '../../middleware/validate-request';
import { NotAuthorizedError } from '../../errors/not-authorized-error';
import { NotFoundError } from '../../errors/not-found-error';
import { ServerError } from '../../errors/server-error';

const router = express.Router();

router.get('/userMessages', auth, async (req: Request, res: Response) => {
  const userMessages = await Messages.find({}).populate(
    'sender',
    'username email _id isAdmin createdAt updatedAt messages'
  );
  res.json(userMessages);
});

router.post('/userMessages', auth, async (req: Request, res: Response) => {
  const { text, sender } = req.body;

  const userMessages = new Messages({
    text,
    date: new Date(),
    sender,
  });
  await userMessages.save();
  res.json({ status: 'Message Sent' });
});

router.delete(
  '/deleteMessage',
  auth,
  [body('id').not().isEmpty().withMessage('Id is required')],
  validateRequest,
  async (req: Request, res: Response) => {
    const { id } = req.body.id;
    if (!req.body.user.isAdmin) {
      throw new NotAuthorizedError();
    }

    try {
      const data = await Messages.findByIdAndRemove(id);

      if (!data) {
        throw new NotFoundError('Message not found');
      }

      res.json(data);
    } catch (err) {
      throw new ServerError('An error occurred');
    }
  }
);

module.exports = router;
