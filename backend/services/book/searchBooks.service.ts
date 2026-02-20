import NodeCache from 'node-cache';
import { Request } from 'express';
import { Books } from '../../models/Books';
import { logSearchAnalytics } from '../analytics/logSearch.service';
const cache = new NodeCache();
const normalizeTurkishText = (text: string): string => {
  if (!text) return '';
  
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  return escaped
    .toLowerCase()
    .replace(/[ıiİI]/gi, '[ıiİI]')
    .replace(/[şs]/gi, '[şs]')  
    .replace(/[ğg]/gi, '[ğg]')
    .replace(/[üu]/gi, '[üu]')
    .replace(/[öo]/gi, '[öo]')
    .replace(/[çc]/gi, '[çc]')
    .replace(/\\\s+/g, '\\s*')
    .replace(/\s+/g, '\\s*');
};

const searchBooksService = async (req: Request) => {
  const cacheKey = JSON.stringify(req.query);
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  const searchTerm = req.query.name as string;
  const normalizedSearch = normalizeTurkishText(searchTerm);

  // Log search analytics (fire-and-forget, non-blocking)
  logSearchAnalytics(searchTerm);
  
  const query = {
    $or: [
      {
        name: {
          $regex: normalizedSearch,
          $options: 'i',
        },
      },
      {
        description: {
          $regex: normalizedSearch,
          $options: 'i',
        },
      },
      {
        category: {
          $regex: normalizedSearch,
          $options: 'i',
        },
      },
    ],
  };

  const page = parseInt(String(req.query.page)) || 1;
  const limit = parseInt(String(req.query.limit)) || 10;
  const startIndex = (page - 1) * limit;

  const [count, results] = await Promise.all([
    Books.countDocuments(query, { collation: { locale: 'tr', strength: 2 } }),
    Books.find(query)
      .select(
        'name path size date url uploader category language description imageLinks'
      )
      .populate('uploader', 'username email')
      .collation({ locale: 'tr', strength: 2 })
      .skip(startIndex)
      .limit(limit)
      .lean(),
  ]);

  const endIndex = Math.min(startIndex + limit, count);

  const pagination: {
    next?: {
      page: number;
      limit: number;
    };
    total?: number;
    previous?: {
      page: number;
      limit: number;
    };
    results?: any;
  } = {
    total: count,
    results,
  };
  
  if (endIndex < count) {
    pagination.next = { page: page + 1, limit };
  }
  
  if (startIndex > 0) {
    pagination.previous = { page: page - 1, limit };
  }
  cache.set(cacheKey, pagination); // store the result in the cache

  return pagination;
};

export { searchBooksService };
