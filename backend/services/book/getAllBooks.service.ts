// getAllBooksService.ts
import { Request } from 'express';
import { Books } from '../../models/Books';
import { BooksData } from '../../routes/api/books.types';
import { apiResponse } from '../../utils/apiResponse.utils';

const getAllBooksService = async (req: Request) => {
  try {
    const page = parseInt(String(req.query.page)) || 1;
    const limit = parseInt(String(req.query.limit)) || 10;
    const language = String(req.query.language) || 'all';

    const startIndex = (page - 1) * limit;

    let query: { language?: string } = {};
    if (language !== 'all') {
      query.language = language;
    }

    const total = await Books.countDocuments(query);
    const results: BooksData = {
      results: await Books.find(
        query,
        'name path size date url uploader category language description imageLinks'
      )
        .populate('uploader', 'username email')
        .sort({ date: -1 })
        .skip(startIndex)
        .limit(limit)
        .lean(),
      total: total,
      page: page,
      next: total > startIndex + limit ? { page: page + 1 } : undefined,
      previous: startIndex > 0 ? { page: page - 1 } : undefined,
    };

    return apiResponse(200, 'success', 'Books fetched successfully', results);
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message);
    } else {
      throw new Error(String(err));
    }
  }
};

export { getAllBooksService };
