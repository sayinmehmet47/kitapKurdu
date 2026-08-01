// getBookById.service.ts
import type { Request } from 'express';
import { Books } from '../../models/Books';
import type { PublicUploader } from '../../routes/api/books.types';

const getBookById = async (req: Request) => {
  const id = req.params.id;
  // Soft-hidden duplicates are invisible via public detail: a marked book is
  // treated as not found (the client renders its existing not-found state).
  const book = await Books.findOne({ _id: id, duplicateOf: null }).populate<{
    uploader: PublicUploader | null;
  }>({
    path: 'uploader',
    select: '_id username',
  });

  return book;
};

export { getBookById };
