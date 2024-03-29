// getBookById.service.ts
import { Request } from 'express';
import { Books } from '../../models/Books';

const getBookById = async (req: Request) => {
  const id = req.params.id;
  const book = await Books.findById(id);

  return book;
};

export { getBookById };
