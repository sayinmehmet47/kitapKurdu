import { Request, Response } from 'express';
import {
  createUserMessage,
  deleteMessage,
  getUserMessages,
} from '../services/message/userMessages.service';

export const getUserMessagesController = async (
  req: Request,
  res: Response
) => {
  const userMessages = await getUserMessages();
  res.json(userMessages);
};

export const createUserMessageController = async (
  req: Request,
  res: Response
) => {
  const { text, sender } = req.body;
  try {
    const userMessages = await createUserMessage(text, sender);
    res.status(201).json(userMessages);
  } catch (error) {
    console.log(error);
  }
};

export const deleteMessageController = async (req: Request, res: Response) => {
  const { id } = req.body;
  const result = await deleteMessage(id, req.body.user.isAdmin);
  res.status(201).json(result);
};
