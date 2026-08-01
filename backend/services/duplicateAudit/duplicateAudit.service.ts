// duplicateAudit.service.ts
import { createHash } from 'node:crypto';
import { logger } from '../../logger';
import { Books } from '../../models/Books';

export type DuplicateAuditType = 'url' | 'isbn' | 'name-size' | 'title-author-language';

export type DuplicateAuditConfidence = 'exact' | 'soft';

export interface DuplicateAuditBookItem {
  bookId: string;
  name: string;
  size?: number;
  author: string | null;
  isbn: string | null;
  language: string;
}

export interface DuplicateAuditGroup {
  key: string;
  type: DuplicateAuditType;
  confidence: DuplicateAuditConfidence;
  count: number;
  books: DuplicateAuditBookItem[];
}

export type DuplicateAuditSummary = Record<DuplicateAuditType, number>;

export interface DuplicateAuditResult {
  type: DuplicateAuditType;
  summary: DuplicateAuditSummary;
  groups: DuplicateAuditGroup[];
  totalGroups: number;
  page: number;
  limit: number;
  scannedBooks: number;
  totalBooks: number;
  isTruncated: boolean;
  durationMs: number;
}

export interface DuplicateAuditQuery {
  type: DuplicateAuditType;
  page: number;
  limit: number;
}

const SCAN_LIMIT = 10_000;
const FIELD_SEPARATOR = '\u0000';
const READABLE_SEPARATOR = ' :: ';

export const DUPLICATE_AUDIT_TYPES: DuplicateAuditType[] = [
  'url',
  'isbn',
  'name-size',
  'title-author-language',
];

interface ScannedBook {
  _id: unknown;
  name?: string;
  size?: number;
  url?: string;
  isbn?: string | null;
  author?: string | null;
  language?: string;
}

const normalizeUrl = (value: string): string | null => {
  try {
    const parsed = new URL(value.trim());
    const host = parsed.hostname.toLowerCase();
    let path = parsed.pathname.toLowerCase();
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    return `${host}${path}`;
  } catch {
    return null;
  }
};

const normalizeIsbn = (value: string): string | null => {
  const digits = value.toUpperCase().replace(/[^0-9X]/g, '');
  return digits.length === 10 || digits.length === 13 ? digits : null;
};

// Turkish-safe normalization: NFKD, strip combining marks, collapse every
// dotted/dotless i variant (I/İ/ı/i) to ASCII 'i', then lowercase and filter.
// This keeps TITANIC/Titanic and Istanbul/İstanbul on the same key.
const normalizeString = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[İIı]/g, 'i')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const sha256UrlKey = (value: string): string => createHash('sha256').update(value).digest('hex');

// Internal map keys may keep the NUL separator; the key sent to clients must be
// free of control characters and human-readable (NUL breaks CSV exports).
const toDisplayKey = (key: string, type: DuplicateAuditType): string => {
  if (type === 'url' || type === 'isbn') return key;
  return key.split(FIELD_SEPARATOR).join(READABLE_SEPARATOR);
};

const splitLegacyAuthor = (name: string): { title: string; author: string } => {
  const separator = ' - ';
  const index = name.indexOf(separator);
  if (index === -1) {
    return { title: name, author: '' };
  }
  return {
    title: name.slice(index + separator.length),
    author: name.slice(0, index),
  };
};

const getTitleAndAuthor = (book: ScannedBook): { title: string; author: string } => {
  const name = typeof book.name === 'string' ? book.name.trim() : '';
  if (typeof book.author === 'string' && book.author.trim()) {
    return { title: name, author: book.author };
  }
  return splitLegacyAuthor(name);
};

const toBookItem = (book: ScannedBook): DuplicateAuditBookItem => ({
  bookId: String(book._id),
  name: typeof book.name === 'string' ? book.name : '',
  size: typeof book.size === 'number' ? book.size : undefined,
  author: typeof book.author === 'string' ? book.author : null,
  isbn: typeof book.isbn === 'string' ? book.isbn : null,
  language: typeof book.language === 'string' ? book.language : 'turkish',
});

const computeKeys = (book: ScannedBook): Record<DuplicateAuditType, string | null> => {
  const normalizedName = normalizeString(typeof book.name === 'string' ? book.name : '');
  const normalizedIsbn = normalizeIsbn(typeof book.isbn === 'string' ? book.isbn : '');
  const normalizedUrl = normalizeUrl(typeof book.url === 'string' ? book.url : '');
  const size = typeof book.size === 'number' && Number.isFinite(book.size) ? book.size : null;
  const { title, author } = getTitleAndAuthor(book);
  const normalizedTitle = normalizeString(title);
  const normalizedAuthor = normalizeString(author);
  const language = typeof book.language === 'string' ? book.language.toLowerCase() : 'turkish';

  return {
    url: normalizedUrl,
    isbn: normalizedIsbn,
    'name-size':
      normalizedName && size !== null ? `${normalizedName}${FIELD_SEPARATOR}${size}` : null,
    'title-author-language': normalizedTitle
      ? `${normalizedTitle}${FIELD_SEPARATOR}${normalizedAuthor}${FIELD_SEPARATOR}${language}`
      : null,
  };
};

const buildGroupMaps = (
  books: ScannedBook[]
): Record<DuplicateAuditType, Map<string, DuplicateAuditBookItem[]>> => {
  const groupMaps: Record<DuplicateAuditType, Map<string, DuplicateAuditBookItem[]>> = {
    url: new Map(),
    isbn: new Map(),
    'name-size': new Map(),
    'title-author-language': new Map(),
  };

  for (const book of books) {
    const keys = computeKeys(book);
    const item = toBookItem(book);
    for (const type of DUPLICATE_AUDIT_TYPES) {
      const key = keys[type];
      if (!key) continue;
      const bucket = groupMaps[type].get(key);
      if (bucket) {
        bucket.push(item);
      } else {
        groupMaps[type].set(key, [item]);
      }
    }
  }

  return groupMaps;
};

const buildGroups = (
  groupMaps: Record<DuplicateAuditType, Map<string, DuplicateAuditBookItem[]>>
): Record<DuplicateAuditType, DuplicateAuditGroup[]> => {
  const result = {} as Record<DuplicateAuditType, DuplicateAuditGroup[]>;
  for (const type of DUPLICATE_AUDIT_TYPES) {
    const groups: DuplicateAuditGroup[] = [];
    for (const [key, books] of groupMaps[type]) {
      if (books.length < 2) continue;
      groups.push({
        key: type === 'url' ? sha256UrlKey(key) : toDisplayKey(key, type),
        type,
        confidence: type === 'title-author-language' ? 'soft' : 'exact',
        count: books.length,
        books,
      });
    }
    result[type] = groups.sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
  }
  return result;
};

export const runDuplicateAuditService = async (
  query: DuplicateAuditQuery
): Promise<DuplicateAuditResult> => {
  const startedAt = Date.now();

  const scanned = (await Books.find()
    .select('_id name size url isbn author language')
    .limit(SCAN_LIMIT)
    .lean()) as unknown as ScannedBook[];
  const scannedBooks = scanned.length;
  // Count the full collection so callers know when the hard scan bound hid books.
  const totalBooks = await Books.countDocuments();
  const isTruncated = totalBooks > scannedBooks;

  const allGroups = buildGroups(buildGroupMaps(scanned));

  const summary: DuplicateAuditSummary = {
    url: allGroups.url.length,
    isbn: allGroups.isbn.length,
    'name-size': allGroups['name-size'].length,
    'title-author-language': allGroups['title-author-language'].length,
  };

  const selected = allGroups[query.type];
  const startIndex = (query.page - 1) * query.limit;
  const groups = selected.slice(startIndex, startIndex + query.limit);

  const durationMs = Date.now() - startedAt;
  logger.info('Duplicate audit completed', {
    durationMs,
    scannedBooks,
    totalBooks,
    isTruncated,
    groupCounts: summary,
  });

  return {
    type: query.type,
    summary,
    groups,
    totalGroups: selected.length,
    page: query.page,
    limit: query.limit,
    scannedBooks,
    totalBooks,
    isTruncated,
    durationMs,
  };
};
