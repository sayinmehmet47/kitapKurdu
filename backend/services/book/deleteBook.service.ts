// deleteBook.service.ts
import type { Request } from 'express';
import { BadRequestError } from '../../errors/bad-request-error';
import { NotFoundError } from '../../errors/not-found-error';
import { Books } from '../../models/Books';

const deleteBook = async (req: Request) => {
  const id = req.params.id;
  // A book that is the canonical of soft-hidden duplicates must not be
  // deleted, otherwise the duplicates would point at a missing canonical.
  const hiddenDuplicateExists = await Books.exists({ duplicateOf: id });
  if (hiddenDuplicateExists) {
    throw new BadRequestError(
      'Cannot delete a book that is the canonical of hidden duplicates; unmark them first'
    );
  }

  const book = await Books.findByIdAndRemove(id);

  if (!book) {
    throw new NotFoundError('Book not found');
  }

  return book;
};

export { deleteBook };
