// recentlyAddedBooks.service.ts
import { Books } from '../../models/Books';

const getRecentlyAddedBooks = async () => {
  const books = await Books.find({}).sort({ date: -1 }).limit(50).exec();

  return books;
};

export { getRecentlyAddedBooks };
