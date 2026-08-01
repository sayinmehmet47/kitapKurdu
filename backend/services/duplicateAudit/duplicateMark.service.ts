// duplicateMark.service.ts
import mongoose from 'mongoose';
import { BadRequestError } from '../../errors/bad-request-error';
import { NotFoundError } from '../../errors/not-found-error';
import { Books } from '../../models/Books';
import { invalidateSearchCache } from '../book/searchBooks.service';

export const MAX_DUPLICATE_BATCH = 50;

export interface MarkDuplicateInput {
  canonicalId: unknown;
  duplicateIds: unknown;
}

export interface UnmarkDuplicateInput {
  duplicateIds: unknown;
}

export interface MarkDuplicateResult {
  canonicalId: string;
  duplicateIds: string[];
  updatedCount: number;
}

export interface UnmarkDuplicateResult {
  duplicateIds: string[];
  updatedCount: number;
}

const parseCanonicalId = (value: unknown): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestError('Canonical book id is required');
  }
  const id = value.trim();
  if (!mongoose.isValidObjectId(id)) {
    throw new BadRequestError('Invalid canonical book id');
  }
  return id;
};

const parseDuplicateIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    throw new BadRequestError('duplicateIds must be an array');
  }
  if (value.length === 0) {
    throw new BadRequestError('At least one duplicate book id is required');
  }
  if (value.length > MAX_DUPLICATE_BATCH) {
    throw new BadRequestError(`At most ${MAX_DUPLICATE_BATCH} duplicates can be updated at once`);
  }

  const ids: string[] = [];
  for (const entry of value) {
    if (typeof entry !== 'string' || !entry.trim()) {
      throw new BadRequestError('Each duplicate book id must be a non-empty string');
    }
    const id = entry.trim();
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestError('Invalid duplicate book id');
    }
    if (!ids.includes(id)) {
      ids.push(id);
    }
  }
  return ids;
};

const ensureBooksExist = async (ids: string[]): Promise<void> => {
  const found = await Books.find({ _id: { $in: ids } })
    .select('_id')
    .lean();
  if (found.length !== ids.length) {
    throw new NotFoundError('One or more books were not found');
  }
};

/**
 * In-process serialization for the admin mark/unmark mutations. There is no
 * unique duplicateOf index (per the operator-approved minimal plan), so the
 * validate-then-write flow could otherwise race: two concurrent requests could
 * both pass the existence/chain/repoint checks and then repoint the same book.
 * A single module-level promise queue runs these admin operations one at a
 * time, keeping validation inside the queued function.
 */
let mutationQueue: Promise<unknown> = Promise.resolve();

const runExclusive = <T>(operation: () => Promise<T>): Promise<T> => {
  const run = mutationQueue.then(operation, operation);
  // Keep the queue alive even when a queued operation rejects.
  mutationQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
};

const markDuplicateQueued = async (input: MarkDuplicateInput): Promise<MarkDuplicateResult> => {
  const canonicalId = parseCanonicalId(input.canonicalId);
  const duplicateIds = parseDuplicateIds(input.duplicateIds);

  if (duplicateIds.includes(canonicalId)) {
    throw new BadRequestError('A book cannot be marked as its own duplicate');
  }

  const requestedIds = [canonicalId, ...duplicateIds];
  const books = await Books.find({ _id: { $in: requestedIds } })
    .select('_id duplicateOf')
    .lean();
  if (books.length !== requestedIds.length) {
    throw new NotFoundError('One or more books were not found');
  }

  const canonical = books.find((book) => String(book._id) === canonicalId);
  if (canonical?.duplicateOf) {
    throw new BadRequestError('The canonical book is already hidden as a duplicate');
  }

  // Chain guard: none of the selected duplicates may currently be the
  // canonical of another book, otherwise hiding them would strand a chain of
  // hidden books beneath another hidden book.
  const referenced = await Books.find({ duplicateOf: { $in: duplicateIds } })
    .select('_id')
    .limit(1)
    .lean();
  if (referenced.length > 0) {
    throw new BadRequestError(
      'A selected duplicate is already the canonical of another book; unmark those first'
    );
  }

  // A duplicate already hidden under a different canonical must not be
  // silently repointed; require an explicit unmark first.
  const duplicateDocs = books.filter((book) => duplicateIds.includes(String(book._id)));
  const repointCandidate = duplicateDocs.find(
    (book) => book.duplicateOf && String(book.duplicateOf) !== canonicalId
  );
  if (repointCandidate) {
    throw new BadRequestError(
      'One or more selected duplicates are already hidden under another canonical; unmark them first'
    );
  }

  // Books already hidden under this same canonical make the call idempotent;
  // only the still-public books are eligible for this pass.
  const pendingIds = duplicateDocs
    .filter((book) => !book.duplicateOf)
    .map((book) => String(book._id));

  if (pendingIds.length === 0) {
    return { canonicalId, duplicateIds, updatedCount: 0 };
  }

  const result = await Books.updateMany(
    { _id: { $in: pendingIds }, duplicateOf: null },
    { $set: { duplicateOf: canonicalId } }
  );

  // The write must have hit every eligible book. A shortfall means a selected
  // book was hidden between the read and the write; fail loudly instead of
  // silently leaving it under the wrong canonical.
  if (result.modifiedCount !== pendingIds.length) {
    throw new BadRequestError(
      'One or more selected duplicates were hidden concurrently; refresh and try again'
    );
  }

  invalidateSearchCache();

  return { canonicalId, duplicateIds, updatedCount: result.modifiedCount };
};

const unmarkDuplicateQueued = async (
  input: UnmarkDuplicateInput
): Promise<UnmarkDuplicateResult> => {
  const duplicateIds = parseDuplicateIds(input.duplicateIds);

  await ensureBooksExist(duplicateIds);

  const result = await Books.updateMany(
    { _id: { $in: duplicateIds } },
    { $set: { duplicateOf: null } }
  );

  if (result.modifiedCount > 0) {
    invalidateSearchCache();
  }

  return { duplicateIds, updatedCount: result.modifiedCount };
};

export const markDuplicateService = (input: MarkDuplicateInput): Promise<MarkDuplicateResult> =>
  runExclusive(() => markDuplicateQueued(input));

export const unmarkDuplicateService = (
  input: UnmarkDuplicateInput
): Promise<UnmarkDuplicateResult> => runExclusive(() => unmarkDuplicateQueued(input));
