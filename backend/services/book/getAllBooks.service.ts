// getAllBooksService.ts
import { Request } from 'express';
import { Books } from '../../models/Books';
import { BooksData } from '../../routes/api/books.types';
import { apiResponse } from '../../utils/apiResponse.utils';
import { logger } from '../../logger';

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const getAllBooksService = async (req: Request) => {
  try {
    const page = parseInt(String(req.query.page)) || 1;
    const limit = parseInt(String(req.query.limit)) || 10;
    const language = String(req.query.language || 'all');
    const categoryParam = String(req.query.category || '').trim();
    const fileType = String(req.query.fileType || '').toLowerCase();
    const sortParam = String(req.query.sort || 'dateDesc');
    const searchParam = String(req.query.search || '').trim();

    const startIndex = (page - 1) * limit;

    let query: Record<string, unknown> = {};
    if (language !== 'all') {
      query.language = language;
    }
    if (fileType) {
      // Match file extension at the end of URL, case-insensitive
      query.url = { $regex: new RegExp(`\\.${fileType}$`, 'i') };
    }

    // Handle search and category filters together
    const searchConditions: any[] = [];
    const categoryConditions: any[] = [];

    if (searchParam) {
      // Try text search first, fallback to regex search
      const textSearch = { $text: { $search: searchParam } };
      const regexSearch = new RegExp(escapeRegExp(searchParam), 'i');
      searchConditions.push(
        textSearch,
        { name: regexSearch },
        { description: regexSearch },
        { category: regexSearch }
      );
    }

    if (categoryParam) {
      const categories = categoryParam
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      if (categories.length > 0) {
        const regexes = categories.map(
          (c) => new RegExp(`${escapeRegExp(c)}`, 'i')
        );
        categoryConditions.push({ category: { $in: regexes } });
      }
    }

    // Combine search and category conditions
    if (searchConditions.length > 0 && categoryConditions.length > 0) {
      // Both search and category filters - use AND logic
      query.$and = [{ $or: searchConditions }, { $or: categoryConditions }];
    } else if (searchConditions.length > 0) {
      // Only search
      query.$or = searchConditions;
    } else if (categoryConditions.length > 0) {
      // Only category
      query.$or = categoryConditions;
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      dateDesc: { date: -1 },
      dateAsc: { date: 1 },
      nameAsc: { name: 1 },
      nameDesc: { name: -1 },
    };
    const sort = sortMap[sortParam] || sortMap.dateDesc;

    // Debug logging for final query
    if (process.env.NODE_ENV !== 'production') {
      logger.info('MongoDB query', { query: JSON.stringify(query, null, 2) });
    }

    const total = await Books.countDocuments(query);

    let books: any[] = [];
    if (sortParam === 'ratingDesc' || sortParam === 'ratingAsc') {
      const ratingSort = sortParam === 'ratingAsc' ? 1 : -1;
      const pipeline: any[] = [
        { $match: query },
        {
          $lookup: {
            from: 'ratings',
            localField: '_id',
            foreignField: 'bookId',
            as: 'ratings',
          },
        },
        { $addFields: { avgRating: { $avg: '$ratings.rating' } } },
        { $sort: { avgRating: ratingSort, date: -1 } },
        { $skip: startIndex },
        { $limit: limit },
        {
          $project: {
            name: 1,
            path: 1,
            size: 1,
            date: 1,
            url: 1,
            uploader: 1,
            category: 1,
            language: 1,
            description: 1,
            imageLinks: 1,
          },
        },
      ];
      books = await Books.aggregate(pipeline);
      // populate uploader after aggregation
      await Books.populate(books, {
        path: 'uploader',
        select: 'username email',
      });
    } else {
      books = await Books.find(
        query,
        'name path size date url uploader category language description imageLinks'
      )
        .populate('uploader', 'username email')
        .sort(sort)
        .skip(startIndex)
        .limit(limit)
        .lean();
    }

    const results: BooksData = {
      results: books as any,
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
