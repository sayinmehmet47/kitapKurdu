import type { CloudinaryAsset } from '../services/cloudinaryUpload';

export const UPLOAD_CONCURRENCY = 3;
export const MAX_UPLOAD_FILES = 1000;
export const MAX_UPLOAD_FILE_SIZE = 100 * 1024 * 1024;

export type UploadStatus = 'queued' | 'uploading' | 'saving' | 'succeeded' | 'failed' | 'cancelled';

export type RejectionCode = 'invalid-type' | 'too-large' | 'too-many' | 'duplicate' | 'empty';

export interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
  asset?: CloudinaryAsset;
}

export interface UploadQueueState {
  items: UploadItem[];
  isPaused: boolean;
}

export interface QueueRejection {
  file: File;
  reason: string;
  code: RejectionCode;
}

export interface AddFilesResult {
  accepted: UploadItem[];
  rejected: QueueRejection[];
}

export interface UploadQueueSummary {
  total: number;
  queued: number;
  uploading: number;
  saving: number;
  succeeded: number;
  failed: number;
  cancelled: number;
  isTerminal: boolean;
}

export type UploadQueueAction =
  | { type: 'add'; items: UploadItem[] }
  | { type: 'patchItem'; id: string; patch: Partial<UploadItem> }
  | { type: 'remove'; id: string }
  | { type: 'pause' }
  | { type: 'resume' };

export function uploadQueueReducer(
  state: UploadQueueState,
  action: UploadQueueAction
): UploadQueueState {
  switch (action.type) {
    case 'add':
      return { ...state, items: [...state.items, ...action.items] };
    case 'patchItem':
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.id ? { ...item, ...action.patch } : item
        ),
      };
    case 'remove':
      return { ...state, items: state.items.filter((item) => item.id !== action.id) };
    case 'pause':
      return { ...state, isPaused: true };
    case 'resume':
      return { ...state, isPaused: false };
  }
}

let fallbackIdCounter = 0;
function createStableId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  fallbackIdCounter += 1;
  return `upload-${fallbackIdCounter}`;
}

function getExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase();
}

function isSupportedFile(file: File): boolean {
  const mime = file.type.toLowerCase();
  const extension = getExtension(file.name);
  return (
    mime === 'application/pdf' ||
    mime === 'application/epub+zip' ||
    extension === 'pdf' ||
    extension === 'epub'
  );
}

function fileKey(name: string, size: number, lastModified: number): string {
  return `${name}:${size}:${lastModified}`;
}

function reject(rejected: QueueRejection[], file: File, code: RejectionCode, reason: string): void {
  rejected.push({ file, reason, code });
}

export function validateFiles(existingItems: UploadItem[], files: File[]): AddFilesResult {
  const accepted: UploadItem[] = [];
  const rejected: QueueRejection[] = [];
  const seen = new Set<string>();
  let count = 0;

  for (const item of existingItems) {
    if (item.status === 'cancelled') continue;
    seen.add(fileKey(item.file.name, item.file.size, item.file.lastModified));
    count += 1;
  }

  for (const file of files) {
    if (!isSupportedFile(file)) {
      reject(rejected, file, 'invalid-type', 'Only PDF and EPUB files are supported');
      continue;
    }
    if (file.size <= 0) {
      reject(rejected, file, 'empty', 'File is empty');
      continue;
    }
    if (file.size > MAX_UPLOAD_FILE_SIZE) {
      reject(rejected, file, 'too-large', 'File exceeds the 100 MB limit');
      continue;
    }
    if (count >= MAX_UPLOAD_FILES) {
      reject(rejected, file, 'too-many', `Upload queue is limited to ${MAX_UPLOAD_FILES} files`);
      continue;
    }
    const key = fileKey(file.name, file.size, file.lastModified);
    if (seen.has(key)) {
      reject(
        rejected,
        file,
        'duplicate',
        'A file with the same name, size and modified time is already queued'
      );
      continue;
    }
    seen.add(key);
    count += 1;
    accepted.push({
      id: createStableId(),
      file,
      status: 'queued',
      progress: 0,
    });
  }

  return { accepted, rejected };
}

export function getBatchSummary(items: UploadItem[]): UploadQueueSummary {
  const summary: UploadQueueSummary = {
    total: items.length,
    queued: 0,
    uploading: 0,
    saving: 0,
    succeeded: 0,
    failed: 0,
    cancelled: 0,
    isTerminal: false,
  };
  for (const item of items) {
    summary[item.status] += 1;
  }
  const completed = summary.succeeded + summary.failed + summary.cancelled;
  summary.isTerminal = summary.total > 0 && completed === summary.total;
  return summary;
}
