// getAllBooksService.ts
import { Request } from 'express';
import { Books } from '../../models/Books';
import { BooksData } from '../../routes/api/books.types';
import { apiResponse } from '../../utils/apiResponse.utils';
import escapeStringRegexp from 'escape-string-regexp';

const getAllBooksService = async (req: Request) => {
  try {
    const page = parseInt(String(req.query.page)) || 1;
    const limit = parseInt(String(req.query.limit)) || 10;
    const language = String(req.query.language || 'all');
    const categoryParam = String(req.query.category || '').trim();
    const fileType = String(req.query.fileType || '').toLowerCase();
    const sortParam = String(req.query.sort || 'dateDesc');

    const startIndex = (page - 1) * limit;

    let query: Record<string, unknown> = {};
    if (language !== 'all') {
      query.language = language;
    }
    if (categoryParam) {
      const categories = categoryParam
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      if (categories.length > 0) {
        const regexes = categories.map(
          (c) => new RegExp(`${escapeStringRegexp(c)}`, 'i')
        );
        query.category = { $in: regexes };
      }
    }
    if (fileType) {
      // Match file extension at the end of URL, case-insensitive
      query.url = { $regex: new RegExp(`\\.${fileType}$`, 'i') };
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      dateDesc: { date: -1 },
      dateAsc: { date: 1 },
      nameAsc: { name: 1 },
      nameDesc: { name: -1 },
    };
    const sort = sortMap[sortParam] || sortMap.dateDesc;

    const total = await Books.countDocuments(query);
    const results: BooksData = {
      results: await Books.find(
        query,
        'name path size date url uploader category language description imageLinks'
      )
        .populate('uploader', 'username email')
        .sort(sort)
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
