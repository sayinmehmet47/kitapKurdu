import type { Request } from 'express';
import NodeCache from 'node-cache';
import { Books } from '../../models/Books';
import { logSearchAnalytics } from '../analytics/logSearch.service';

const SEARCH_CACHE_TTL_SECONDS = 60;
const SEARCH_CACHE_CHECK_PERIOD_SECONDS = 60;
const cache = new NodeCache({
  stdTTL: SEARCH_CACHE_TTL_SECONDS,
  checkperiod: SEARCH_CACHE_CHECK_PERIOD_SECONDS,
});

const MAX_PAGE = 1_000_000;
const MAX_LIMIT = 100;
const MAX_QUERY_LENGTH = 200;

const getQueryString = (value: unknown, maxLength = MAX_QUERY_LENGTH): string => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, maxLength);
};

const parseBoundedPositiveInt = (value: unknown, fallback: number, maximum: number): number => {
  const parsed = Number.parseInt(getQueryString(value), 10);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, maximum);
};

const escapeRegExp = (input: string): string => input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeTurkishText = (text: string): string => {
  if (!text) return '';

  const escaped = escapeRegExp(text.toLocaleLowerCase('tr'));

  return escaped
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

  const queryTerm = getQueryString(req.query.q);
  const legacyTerm = getQueryString(req.query.name);
  const searchTerm = queryTerm || legacyTerm;
  const author = getQueryString(req.query.author);
  const isbn = getQueryString(req.query.isbn, 32);
  const publisher = getQueryString(req.query.publisher);
  const category = getQueryString(req.query.category);

  // Log search analytics (fire-and-forget, non-blocking)
  logSearchAnalytics(searchTerm);

  const filters: Record<string, unknown>[] = [];
  if (searchTerm) {
    const normalizedSearch = normalizeTurkishText(searchTerm);
    filters.push({
      $or: [
        { name: { $regex: normalizedSearch, $options: 'i' } },
        { description: { $regex: normalizedSearch, $options: 'i' } },
        { category: { $regex: normalizedSearch, $options: 'i' } },
      ],
    });
  }

  if (author) {
    filters.push({ author });
  }

  if (isbn) {
    filters.push({ isbn });
  }

  if (publisher) {
    filters.push({
      publisher: { $regex: normalizeTurkishText(publisher), $options: 'i' },
    });
  }

  if (category) {
    filters.push({
      category: { $regex: normalizeTurkishText(category), $options: 'i' },
    });
  }

  const query: Record<string, unknown> =
    filters.length === 0 ? {} : filters.length === 1 ? filters[0] : { $and: filters };

  const page = parseBoundedPositiveInt(req.query.page, 1, MAX_PAGE);
  const limit = parseBoundedPositiveInt(req.query.limit, 10, MAX_LIMIT);
  const startIndex = (page - 1) * limit;

  const [count, results] = await Promise.all([
    Books.countDocuments(query, { collation: { locale: 'tr', strength: 2 } }),
    Books.find(query)
      .select(
        'name path size date url uploader category language description imageLinks author isbn publisher'
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
    results: unknown[];
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
