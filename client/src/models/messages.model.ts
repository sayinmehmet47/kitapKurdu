import { UserModel } from './user.model';

export interface MessagesModel {
  _id: string;
  text: string;
  sender: UserModel;
}
