import { useCallback, useMemo, useReducer, useRef, useState } from 'react';
import type { CloudinaryAsset } from '../services/cloudinaryUpload';
import type {
  QueueRejection,
  UploadItem,
  UploadQueueAction,
  UploadQueueSummary,
} from './uploadQueueState';
import {
  getBatchSummary,
  UPLOAD_CONCURRENCY,
  uploadQueueReducer,
  validateFiles,
} from './uploadQueueState';

export type {
  QueueRejection,
  RejectionCode as RejectionReason,
  UploadItem,
  UploadQueueSummary,
  UploadStatus,
} from './uploadQueueState';
export {
  MAX_UPLOAD_FILE_SIZE as MAX_FILE_SIZE,
  MAX_UPLOAD_FILES as MAX_FILES,
  UPLOAD_CONCURRENCY as CONCURRENCY,
} from './uploadQueueState';

export interface SaveOperation {
  promise: Promise<void>;
}

export interface BatchSummary {
  accepted: number;
  rejected: QueueRejection[];
}

export interface UseUploadQueueOptions {
  upload: (
    file: File,
    signal: AbortSignal,
    onProgress: (percent: number) => void
  ) => Promise<CloudinaryAsset>;
  save: (item: UploadItem, asset: CloudinaryAsset) => SaveOperation;
}

export interface UseUploadQueueResult {
  items: UploadItem[];
  addFiles: (files: File[]) => BatchSummary;
  start: () => void;
  pause: () => void;
  resume: () => void;
  cancel: (id: string) => void;
  cancelAll: () => void;
  remove: (id: string) => void;
  retry: (id: string) => void;
  isRunning: boolean;
  isPaused: boolean;
  summary: UploadQueueSummary;
}

function conciseError(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Upload failed';
}

export function useUploadQueue(options: UseUploadQueueOptions): UseUploadQueueResult {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const [state, dispatch] = useReducer(uploadQueueReducer, { items: [], isPaused: false });
  const stateRef = useRef(state);

  const commit = useCallback((action: UploadQueueAction) => {
    stateRef.current = uploadQueueReducer(stateRef.current, action);
    dispatch(action);
  }, []);
  const patch = useCallback(
    (id: string, patch: Partial<UploadItem>) => commit({ type: 'patchItem', id, patch }),
    [commit]
  );
  const [isRunning, setIsRunning] = useState(false);
  const runningRef = useRef(false);
  const controllersRef = useRef(new Map<string, AbortController>());
  const activeRef = useRef(0);
  const pumpRef = useRef<() => void>(() => {});
  const runItemRef = useRef<(id: string) => void>(() => {});
  const runItem = useCallback(
    async (id: string) => {
      const current = () => stateRef.current.items.find((entry) => entry.id === id);
      try {
        let item = current();
        if (!item) return;
        if (item.asset) patch(id, { status: 'saving' });
        else {
          patch(id, { status: 'uploading' });
          const controller = new AbortController();
          controllersRef.current.set(id, controller);
          try {
            const onProgress = (percent: number) => {
              const rounded = Math.round(percent);
              if (current()?.progress !== rounded) {
                patch(id, { progress: rounded });
              }
            };
            const asset = await optionsRef.current.upload(item.file, controller.signal, onProgress);
            if (current()?.status !== 'cancelled') {
              patch(id, { status: 'saving', asset, progress: 100 });
            }
          } catch (error) {
            if (current()?.status !== 'cancelled') {
              patch(id, { status: 'failed', error: conciseError(error) });
            }
            return;
          } finally {
            controllersRef.current.delete(id);
          }
        }
        item = current();
        if (!item || item.status === 'cancelled' || !item.asset) return;
        try {
          const operation = optionsRef.current.save(item, item.asset);
          await operation.promise;
          patch(id, { status: 'succeeded', progress: 100 });
        } catch (error) {
          patch(id, { status: 'failed', error: conciseError(error) });
        }
      } finally {
        activeRef.current = Math.max(0, activeRef.current - 1);
        pumpRef.current();
      }
    },
    [patch]
  );
  const pump = useCallback(() => {
    if (!runningRef.current) return;
    // Settle `running` even while paused: once the active items finish (and
    // nothing is queued), the queue is no longer running. The paused check is
    // done below so a queue paused with only in-flight items stops cleanly.
    if (activeRef.current === 0 && !stateRef.current.items.some((e) => e.status === 'queued')) {
      runningRef.current = false;
      setIsRunning(false);
    }
    if (stateRef.current.isPaused) return;
    while (activeRef.current < UPLOAD_CONCURRENCY) {
      const next = stateRef.current.items.find((entry) => entry.status === 'queued');
      if (!next) break;
      activeRef.current += 1;
      void runItemRef.current(next.id);
    }
  }, []);
  pumpRef.current = pump;
  runItemRef.current = runItem;
  const addFiles = useCallback(
    (files: File[]) => {
      const result = validateFiles(stateRef.current.items, files);
      if (result.accepted.length > 0) commit({ type: 'add', items: result.accepted });
      if (runningRef.current) pumpRef.current();
      return { accepted: result.accepted.length, rejected: result.rejected };
    },
    [commit]
  );
  const start = useCallback(() => {
    if (runningRef.current || stateRef.current.isPaused) return;
    runningRef.current = true;
    setIsRunning(true);
    pumpRef.current();
  }, []);
  const pause = useCallback(() => commit({ type: 'pause' }), [commit]);
  const resume = useCallback(() => {
    commit({ type: 'resume' });
    if (runningRef.current) pumpRef.current();
  }, [commit]);
  const cancel = useCallback(
    (id: string) => {
      const item = stateRef.current.items.find((entry) => entry.id === id);
      if (!item) return;
      if (item.status === 'queued' || item.status === 'uploading') {
        patch(id, { status: 'cancelled' });
      }
      if (item.status === 'uploading') {
        controllersRef.current.get(id)?.abort();
      }
    },
    [patch]
  );
  const cancelAll = useCallback(() => {
    for (const entry of stateRef.current.items) {
      if (entry.status === 'uploading') {
        patch(entry.id, { status: 'cancelled' });
        controllersRef.current.get(entry.id)?.abort();
      } else if (entry.status === 'queued') {
        patch(entry.id, { status: 'cancelled' });
      }
    }
    pumpRef.current();
  }, [patch]);
  const remove = useCallback(
    (id: string) => {
      const item = stateRef.current.items.find((entry) => entry.id === id);
      if (!item || item.status === 'uploading' || item.status === 'saving') return;
      controllersRef.current.delete(id);
      commit({ type: 'remove', id });
      pumpRef.current();
    },
    [commit]
  );
  const retry = useCallback(
    (id: string) => {
      const item = stateRef.current.items.find((entry) => entry.id === id);
      if (!item || (item.status !== 'failed' && item.status !== 'cancelled')) return;
      // No-op while the previous attempt is still winding down: its upload
      // controller is only removed in that attempt's `finally`, so a cancel
      // followed by a same-tick retry must not race it.
      if (controllersRef.current.has(id)) return;
      // No-op while paused: nothing may start until the queue is resumed.
      if (stateRef.current.isPaused) return;
      patch(id, { status: 'queued', progress: item.asset ? item.progress : 0, error: undefined });
      // Whole queue already running: the normal pump picks the item up.
      if (runningRef.current) {
        pumpRef.current();
        return;
      }
      // Queue stopped: run just this item. The running flag stays off so the
      // pump (called when the attempt settles) will not start other queued
      // files; active accounting is still shared with a later full start.
      activeRef.current += 1;
      void runItemRef.current(id);
    },
    [patch]
  );
  const summary = useMemo(() => getBatchSummary(state.items), [state.items]);
  return {
    items: state.items,
    addFiles,
    start,
    pause,
    resume,
    cancel,
    cancelAll,
    remove,
    retry,
    isRunning,
    isPaused: state.isPaused,
    summary,
  };
}
