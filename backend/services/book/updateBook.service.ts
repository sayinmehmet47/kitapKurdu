// updateBook.service.ts
import { Request } from 'express';
import { Books } from '../../models/Books';

const updateBook = async (req: Request) => {
  const id = req.params.id;
  const name = req.body.name;
  const language = req.body.language;

  const book = await Books.findById(id);

  if (book) {
    book.name = name;
    book.language = language;
    await book.save();
  }

  return book;
};

export { updateBook };
