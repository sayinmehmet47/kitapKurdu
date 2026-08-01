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

export const duplicateAuditApi = commonApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /api/duplicate-audit?type=url&page=1&limit=20
    // Lazy: only fired when an admin explicitly runs an audit.
    getDuplicateAudit: build.query<DuplicateAuditResult, DuplicateAuditQueryArgs>({
      query: ({ type, page = 1, limit = 20 }) => ({
        url: '/duplicate-audit',
        params: { type, page, limit },
      }),
    }),
  }),
});

export const { useLazyGetDuplicateAuditQuery } = duplicateAuditApi;
