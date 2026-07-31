import express, { type Request, type Response } from 'express';
import { body } from 'express-validator';
import { NotAuthorizedError } from '../../errors/not-authorized-error';
import { auth } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate-request';
import { User } from '../../models/User';

const router = express.Router();

// Reject null, primitives and arrays so nested field access stays safe.
const isNonArrayObject = (value: unknown): boolean =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

router.post(
  '/',
  auth,
  [
    body('subscription').custom(isNonArrayObject).withMessage('Subscription must be an object'),
    body('subscription.endpoint')
      .isString()
      .withMessage('Endpoint must be a string')
      .bail()
      .isLength({ max: 2048 })
      .withMessage('Endpoint must be at most 2048 characters')
      .bail()
      .isURL({ protocols: ['https'], require_protocol: true, require_host: true })
      .withMessage('Endpoint must be a valid HTTPS URL'),
    body('subscription.keys').custom(isNonArrayObject).withMessage('Keys must be an object'),
    body('subscription.keys.auth')
      .isString()
      .withMessage('Auth key must be a string')
      .bail()
      .trim()
      .notEmpty()
      .withMessage('Auth key is required')
      .bail()
      .isLength({ max: 512 })
      .withMessage('Auth key must be at most 512 characters'),
    body('subscription.keys.p256dh')
      .isString()
      .withMessage('P256dh key must be a string')
      .bail()
      .trim()
      .notEmpty()
      .withMessage('P256dh key is required')
      .bail()
      .isLength({ max: 512 })
      .withMessage('P256dh key must be at most 512 characters'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const userId = (req.user as { _id: string })._id;

    const updatedUser = await User.findByIdAndUpdate(userId, {
      $set: { subscription: req.body.subscription },
    });

    if (!updatedUser) {
      throw new NotAuthorizedError();
    }

    res.status(201).json({ message: 'Subscription added successfully.' });
  }
);

export { router as subscriptionRouter };
