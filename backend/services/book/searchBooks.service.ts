import type { Request } from 'express';
import NodeCache from 'node-cache';
import { Books } from '../../models/Books';
import type { PublicBook, PublicUploader } from '../../routes/api/books.types';
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

const turkishCharacterPatterns: Record<string, string> = {
  i: '[ıiİI](?:\\x{0307})?',
  ı: '[ıiİI](?:\\x{0307})?',
  s: '[şsŞS](?:\\x{0327})?',
  ş: '[şsŞS](?:\\x{0327})?',
  c: '[çcÇC](?:\\x{0327})?',
  ç: '[çcÇC](?:\\x{0327})?',
  g: '[ğgĞG](?:\\x{0306})?',
  ğ: '[ğgĞG](?:\\x{0306})?',
  u: '[üuÜU](?:\\x{0308})?',
  ü: '[üuÜU](?:\\x{0308})?',
  o: '[öoÖO](?:\\x{0308})?',
  ö: '[öoÖO](?:\\x{0308})?',
};

const normalizeTurkishText = (text: string): string => {
  if (!text) return '';

  const escaped = escapeRegExp(text.normalize('NFC').toLocaleLowerCase('tr'));

  return escaped
    .replace(/[ıişsğgüuoöçc]/g, (character) => turkishCharacterPatterns[character])
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
    const normalizedAuthor = normalizeTurkishText(author);
    filters.push({
      $or: [
        { author: { $regex: normalizedAuthor, $options: 'i' } },
        {
          $expr: {
            $and: [
              {
                $eq: [{ $trim: { input: { $ifNull: ['$author', ''] } } }, ''],
              },
              {
                $gte: [{ $size: { $split: [{ $ifNull: ['$name', ''] }, ' - '] } }, 2],
              },
              {
                $regexMatch: {
                  input: {
                    $arrayElemAt: [{ $split: [{ $ifNull: ['$name', ''] }, ' - '] }, 0],
                  },
                  regex: normalizedAuthor,
                  options: 'i',
                },
              },
            ],
          },
        },
      ],
    });
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

  // Soft-hidden duplicates never surface in public search.
  query.duplicateOf = null;

  const page = parseBoundedPositiveInt(req.query.page, 1, MAX_PAGE);
  const limit = parseBoundedPositiveInt(req.query.limit, 10, MAX_LIMIT);
  const startIndex = (page - 1) * limit;

  const [count, results] = await Promise.all([
    Books.countDocuments(query, { collation: { locale: 'tr', strength: 2 } }),
    Books.find(query)
      .select(
        'name path size date url uploader category language description imageLinks author isbn publisher'
      )
      .populate<{ uploader: PublicUploader | null }>({
        path: 'uploader',
        select: '_id username',
      })
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
    results: PublicBook[];
  } = {
    total: count,
    results: results as unknown as PublicBook[],
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

/**
 * Narrow invalidator for the public search cache. Called by admin mark/unmark
 * operations so cached search results never keep soft-hidden duplicates around.
 */
export const invalidateSearchCache = (): void => {
  cache.flushAll();
};

export { searchBooksService };
