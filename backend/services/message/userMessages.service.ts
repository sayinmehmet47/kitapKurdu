import { NotAuthorizedError } from '../../errors/not-authorized-error';
import { NotFoundError } from '../../errors/not-found-error';
import { Messages } from '../../models/Messages';

export const getUserMessages = async () => {
  return await Messages.find({}).populate(
    'sender',
    'username email _id isAdmin createdAt updatedAt messages'
  );
};

export const createUserMessage = async (text: string, sender: string) => {
  const userMessages = new Messages({
    text,
    date: new Date(),
    sender,
  });
  await userMessages.save();
  return userMessages;
};

export const deleteMessage = async (id: string, isAdmin: boolean) => {
  if (!isAdmin) {
    throw new NotAuthorizedError();
  }

  const data = await Messages.findByIdAndRemove(id);

  if (!data) {
    throw new NotFoundError('Message not found');
  }

  return { message: 'Message deleted!' };
};
