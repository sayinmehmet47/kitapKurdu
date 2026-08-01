import axios from 'axios';
import { logger } from '../../logger';
import type {
  GoogleBooksResponse,
  ImageLinks,
  IndustryIdentifier,
  Item,
  VolumeInfo,
} from '../../routes/api/books.types';
import { scheduleGoogleBooksMetadata } from './uploadWorkLimiters';

const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';
const GOOGLE_BOOKS_TIMEOUT_MS = 5000;

export interface GoogleBooksMetadataQuery {
  name?: string;
  isbn?: string;
}

export interface BookMetadata {
  title?: string;
  author?: string;
  isbn?: string;
  publisher?: string;
  description?: string;
  categories?: string[];
  imageLinks?: ImageLinks;
}

const asTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
};

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(asTrimmedString).filter((item): item is string => Boolean(item));
};

const asIndustryIdentifier = (value: unknown): IndustryIdentifier | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<IndustryIdentifier>;
  const type = asTrimmedString(candidate.type);
  const identifier = asTrimmedString(candidate.identifier);

  if (!type || !identifier) {
    return null;
  }

  return { type, identifier };
};

const getImageLinks = (value: unknown): ImageLinks | undefined => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const candidate = value as Partial<ImageLinks>;
  const smallThumbnail = asTrimmedString(candidate.smallThumbnail);
  const thumbnail = asTrimmedString(candidate.thumbnail);

  if (!smallThumbnail && !thumbnail) {
    return undefined;
  }

  return {
    ...(smallThumbnail ? { smallThumbnail } : {}),
    ...(thumbnail ? { thumbnail } : {}),
  };
};

const parseVolumeInfo = (volumeInfo: VolumeInfo): BookMetadata => {
  const authors = asStringArray(volumeInfo.authors);
  const identifiers = (
    Array.isArray(volumeInfo.industryIdentifiers) ? volumeInfo.industryIdentifiers : []
  )
    .map(asIndustryIdentifier)
    .filter((item): item is IndustryIdentifier => Boolean(item));
  const isbn13 = identifiers.find((item) => item.type.toUpperCase() === 'ISBN_13')?.identifier;
  const isbn10 = identifiers.find((item) => item.type.toUpperCase() === 'ISBN_10')?.identifier;

  const metadata: BookMetadata = {};
  const title = asTrimmedString(volumeInfo.title);
  const author = authors.length > 0 ? authors.join(', ') : undefined;
  const publisher = asTrimmedString(volumeInfo.publisher);
  const description = asTrimmedString(volumeInfo.description);
  const categories = asStringArray(volumeInfo.categories);
  const imageLinks = getImageLinks(volumeInfo.imageLinks);

  if (title) metadata.title = title;
  if (author) metadata.author = author;
  if (isbn13 || isbn10) metadata.isbn = isbn13 || isbn10;
  if (publisher) metadata.publisher = publisher;
  if (description) metadata.description = description;
  if (imageLinks) metadata.imageLinks = imageLinks;

  if (categories.length > 0) {
    metadata.categories = categories;
  }

  return metadata;
};

const getUsableMetadata = (items: Item[] | undefined): BookMetadata | null => {
  if (!Array.isArray(items)) {
    return null;
  }

  for (const item of items) {
    if (!item?.volumeInfo || typeof item.volumeInfo !== 'object') {
      continue;
    }

    const metadata = parseVolumeInfo(item.volumeInfo);
    if (Object.keys(metadata).length > 0) {
      return metadata;
    }
  }

  return null;
};

const fetchGoogleBooksMetadata = async (
  query: GoogleBooksMetadataQuery
): Promise<BookMetadata | null> => {
  const isbn = asTrimmedString(query.isbn);
  const name = asTrimmedString(query.name);
  const searchQuery = isbn ? `isbn:${isbn}` : name;

  if (!searchQuery) {
    return null;
  }

  try {
    const params: Record<string, string> = { q: searchQuery };
    if (process.env.GOOGLE_BOOKS_API_KEY) {
      params.key = process.env.GOOGLE_BOOKS_API_KEY;
    }

    const response = await scheduleGoogleBooksMetadata(() =>
      axios.get<GoogleBooksResponse>(GOOGLE_BOOKS_API_URL, {
        params,
        timeout: GOOGLE_BOOKS_TIMEOUT_MS,
      })
    );

    return getUsableMetadata(response.data?.items);
  } catch (error) {
    logger.error('Failed to fetch book metadata from Google Books API', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
};

export { fetchGoogleBooksMetadata };
