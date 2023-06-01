import { BookModel } from './book.model';
import { MessagesModel } from './messages.model';

export interface UserModel {
  id: string;
  username: string;
  email: string;
  password: string;
  isAdmin: boolean;
  booksUploaded: BookModel[];
  messages: MessagesModel[];
}
