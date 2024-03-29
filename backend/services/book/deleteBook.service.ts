// deleteBook.service.ts
import { Request } from 'express';
import { Books } from '../../models/Books';
import { NotFoundError } from '../../errors/not-found-error';

const deleteBook = async (req: Request) => {
  const id = req.params.id;
  const book = await Books.findByIdAndRemove(id);

  if (!book) {
    throw new NotFoundError('Book not found');
  }

  return book;
};

export { deleteBook };
