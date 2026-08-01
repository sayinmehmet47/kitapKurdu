import { commonApi } from '../common.api';

export type DuplicateAuditType = 'url' | 'isbn' | 'name-size' | 'title-author-language';

export type DuplicateAuditConfidence = 'exact' | 'soft';

export interface DuplicateAuditBookItem {
  bookId: string;
  name: string;
  size?: number;
  author: string | null;
  isbn: string | null;
  language: string;
  /** Canonical book id when this book is already soft-hidden as a duplicate. */
  duplicateOf: string | null;
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

export interface DuplicateAuditQueryArgs {
  type: DuplicateAuditType;
  page?: number;
  limit?: number;
}

export interface MarkDuplicateArgs {
  canonicalId: string;
  duplicateIds: string[];
}

export interface MarkDuplicateResult {
  canonicalId: string;
  duplicateIds: string[];
  updatedCount: number;
}

export interface UnmarkDuplicateArgs {
  duplicateIds: string[];
}

export interface UnmarkDuplicateResult {
  duplicateIds: string[];
  updatedCount: number;
}

export const duplicateAuditApi = commonApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /api/duplicate-audit?type=url&page=1&limit=20
    // Lazy: only fired when an admin explicitly runs an audit.
    getDuplicateAudit: build.query<DuplicateAuditResult, DuplicateAuditQueryArgs>({
      query: ({ type, page = 1, limit = 20 }) => ({
        url: '/duplicate-audit',
        params: { type, page, limit },
      }),
      providesTags: () => [{ type: 'Audit' }],
    }),

    // POST /api/duplicate-audit/mark
    // Soft-hides the given duplicates under the canonical book. Any cached
    // audit and public book listings are refreshed so hidden books disappear
    // from the site immediately.
    markDuplicate: build.mutation<MarkDuplicateResult, MarkDuplicateArgs>({
      query: (body) => ({
        url: '/duplicate-audit/mark',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Audit' }, { type: 'Book' }],
    }),

    // POST /api/duplicate-audit/unmark
    // Restores the given books to public visibility.
    unmarkDuplicate: build.mutation<UnmarkDuplicateResult, UnmarkDuplicateArgs>({
      query: (body) => ({
        url: '/duplicate-audit/unmark',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Audit' }, { type: 'Book' }],
    }),
  }),
});

export const {
  useLazyGetDuplicateAuditQuery,
  useMarkDuplicateMutation,
  useUnmarkDuplicateMutation,
} = duplicateAuditApi;
