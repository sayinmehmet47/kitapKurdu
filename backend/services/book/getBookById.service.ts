// getBookById.service.ts
import type { Request } from 'express';
import { Books } from '../../models/Books';
import type { PublicUploader } from '../../routes/api/books.types';

const getBookById = async (req: Request) => {
  const id = req.params.id;
  const book = await Books.findById(id).populate<{ uploader: PublicUploader | null }>({
    path: 'uploader',
    select: '_id username',
  });

  return book;
};

export { getBookById };
