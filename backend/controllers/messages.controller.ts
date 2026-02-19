import { NextFunction, Request, Response } from 'express';
import {
  createUserMessage,
  deleteMessage,
  getUserMessages,
} from '../services/message/userMessages.service';

export const getUserMessagesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userMessages = await getUserMessages();
    res.json(userMessages);
  } catch (err) {
    next(err);
  }
};

export const createUserMessageController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { text, sender } = req.body;
    const userMessages = await createUserMessage(text, sender);
    res.status(201).json(userMessages);
  } catch (err) {
    next(err);
  }
};

export const deleteMessageController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.body;
    const user = req.user as any;
    const result = await deleteMessage(id, user.isAdmin);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
