import express, { Response, Request } from 'express';
import { auth } from '../../middleware/auth';
import { Messages } from '../../models/Messages';
import { body } from 'express-validator';
import { validateRequest } from '../../middleware/validate-request';
import { NotAuthorizedError } from '../../errors/not-authorized-error';
import { NotFoundError } from '../../errors/not-found-error';

const router = express.Router();

router.get('/userMessages', auth, async (req: Request, res: Response) => {
  const userMessages = await Messages.find({}).populate(
    'sender',
    'username email _id isAdmin createdAt updatedAt messages'
  );
  res.json(userMessages);
});

router.post(
  '/userMessages',
  auth,
  [
    body('text').not().isEmpty().isString().withMessage('Text is required'),
    body('sender').not().isEmpty().isString().withMessage('Sender is required'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { text, sender } = req.body;

    try {
      const userMessages = new Messages({
        text,
        date: new Date(),
        sender,
      });
      await userMessages.save();
      res.status(201).json(userMessages);
    } catch (error) {
      console.log(error);
    }
  }
);

router.delete(
  '/deleteMessage',
  auth,
  [body('id').not().isEmpty().withMessage('Id is required')],
  validateRequest,
  async (req: Request, res: Response) => {
    const { id } = req.body;
    if (!req.body.user.isAdmin) {
      throw new NotAuthorizedError();
    }

    const data = await Messages.findByIdAndRemove(id);

    if (!data) {
      throw new NotFoundError('Message not found');
    }

    res.status(201).json({ message: 'Message deleted!' });
  }
);

module.exports = router;
