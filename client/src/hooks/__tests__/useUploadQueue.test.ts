import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CloudinaryAsset } from '../../services/cloudinaryUpload';
import type { BatchSummary, SaveOperation, UploadItem } from '../useUploadQueue';
import { CONCURRENCY, MAX_FILE_SIZE, MAX_FILES, useUploadQueue } from '../useUploadQueue';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function saveOperation(promise: Promise<void> = Promise.resolve()): SaveOperation {
  return { promise };
}

function makeFile(name: string, size = 1024, type = 'application/pdf', lastModified = 1): File {
  const file = new File(['x'], name, { type, lastModified });
  Object.defineProperty(file, 'size', { value: size, configurable: true });
  Object.defineProperty(file, 'lastModified', {
    value: lastModified,
    configurable: true,
  });
  return file;
}

const asset: CloudinaryAsset = { secure_url: 'https://cdn.test/book', bytes: 128 };

describe('useUploadQueue', () => {
  it('drains 1000 files with at most 3 concurrent uploads and a terminal summary', async () => {
    let inFlight = 0;
    let peak = 0;
    const upload = vi.fn(async (): Promise<CloudinaryAsset> => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await Promise.resolve();
      inFlight -= 1;
      return asset;
    });
    const save = vi.fn((): SaveOperation => saveOperation());

    const { result } = renderHook(() => useUploadQueue({ upload, save }));
    const files = Array.from({ length: 1000 }, (_, i) =>
      makeFile(`book-${i}.pdf`, 1024 + i, 'application/pdf', i)
    );

    await act(async () => {
      result.current.addFiles(files);
      result.current.start();
    });
    await waitFor(() => expect(result.current.summary.isTerminal).toBe(true), { timeout: 10000 });

    expect(peak).toBeLessThanOrEqual(CONCURRENCY);
    expect(upload).toHaveBeenCalledTimes(1000);
    expect(save).toHaveBeenCalledTimes(1000);
    expect(result.current.summary).toMatchObject({
      total: 1000,
      succeeded: 1000,
      failed: 0,
      cancelled: 0,
      queued: 0,
      uploading: 0,
      saving: 0,
      isTerminal: true,
    });
    expect(result.current.isRunning).toBe(false);
  });

  it('ignores a second start while the queue is running', async () => {
    const gate = deferred<CloudinaryAsset>();
    const upload = vi.fn(() => gate.promise);
    const save = vi.fn((): SaveOperation => saveOperation());

    const { result } = renderHook(() => useUploadQueue({ upload, save }));
    await act(async () => {
      result.current.addFiles([makeFile('a.pdf'), makeFile('b.pdf')]);
      result.current.start();
    });
    expect(upload).toHaveBeenCalledTimes(2);

    act(() => {
      result.current.start();
    });
    expect(upload).toHaveBeenCalledTimes(2);

    await act(async () => {
      gate.resolve(asset);
    });
    await waitFor(() => expect(result.current.summary.isTerminal).toBe(true));
    expect(upload).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('start() while paused is a no-op and does not mark the queue running', () => {
    const upload = vi.fn(async (): Promise<CloudinaryAsset> => asset);
    const save = vi.fn((): SaveOperation => saveOperation());
    const { result } = renderHook(() => useUploadQueue({ upload, save }));

    act(() => {
      result.current.addFiles([makeFile('a.pdf')]);
      result.current.pause();
    });
    act(() => {
      result.current.start();
    });

    expect(result.current.isRunning).toBe(false);
    expect(result.current.isPaused).toBe(true);
    expect(upload).not.toHaveBeenCalled();
  });

  it('rejects duplicate, unsupported, empty, oversized, and over-limit files', () => {
    const upload = vi.fn(async (): Promise<CloudinaryAsset> => asset);
    const save = vi.fn((): SaveOperation => saveOperation());
    const { result } = renderHook(() => useUploadQueue({ upload, save }));

    let rejected!: BatchSummary;
    act(() => {
      rejected = result.current.addFiles([
        makeFile('book.pdf', 1024),
        makeFile('book.pdf', 1024),
        makeFile(
          'notes.docx',
          1024,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ),
        makeFile('empty.pdf', 0, 'application/pdf'),
        makeFile('huge.pdf', MAX_FILE_SIZE + 1),
      ]);
    });
    expect(rejected.accepted).toBe(1);
    expect(rejected.rejected.map((r) => r.code)).toEqual([
      'duplicate',
      'invalid-type',
      'empty',
      'too-large',
    ]);

    let overLimit!: BatchSummary;
    act(() => {
      overLimit = result.current.addFiles(
        Array.from({ length: MAX_FILES }, (_, i) =>
          makeFile(`bulk-${i}.pdf`, 2048 + i, 'application/pdf', i)
        )
      );
    });
    expect(overLimit.accepted).toBe(MAX_FILES - 1);
    expect(overLimit.rejected.map((r) => r.code)).toEqual(['too-many']);
    expect(result.current.items).toHaveLength(MAX_FILES);
  });

  it('blocks a fourth upload while paused with 3 active and drains on resume', async () => {
    const gates = Array.from({ length: 3 }, () => deferred<CloudinaryAsset>());
    let calls = 0;
    const upload = vi.fn(() => {
      const index = calls;
      calls += 1;
      return index < 3 ? gates[index].promise : Promise.resolve(asset);
    });
    const save = vi.fn((): SaveOperation => saveOperation());

    const { result } = renderHook(() => useUploadQueue({ upload, save }));
    const files = Array.from({ length: 6 }, (_, i) =>
      makeFile(`file-${i}.pdf`, 1024, 'application/pdf', i)
    );

    await act(async () => {
      result.current.addFiles(files);
      result.current.start();
    });
    expect(upload).toHaveBeenCalledTimes(3);

    act(() => {
      result.current.pause();
    });
    await act(async () => {
      gates[0].resolve(asset);
      gates[1].resolve(asset);
      gates[2].resolve(asset);
    });

    expect(upload).toHaveBeenCalledTimes(3);
    expect(save).toHaveBeenCalledTimes(3);
    expect(result.current.summary.succeeded).toBe(3);
    expect(result.current.items.filter((i) => i.status === 'queued')).toHaveLength(3);

    act(() => {
      result.current.resume();
    });
    await waitFor(() => expect(result.current.summary.isTerminal).toBe(true));
    expect(upload).toHaveBeenCalledTimes(6);
    expect(result.current.summary.succeeded).toBe(6);
  });

  it('cancel queued never uploads and cancel active aborts its upload', async () => {
    const signals: AbortSignal[] = [];
    const uploadedNames: string[] = [];
    const upload = vi.fn((file: File, signal: AbortSignal) => {
      uploadedNames.push(file.name);
      signals.push(signal);
      const gate = deferred<CloudinaryAsset>();
      signal.addEventListener('abort', () =>
        gate.reject(new DOMException('Aborted', 'AbortError'))
      );
      return gate.promise;
    });
    const save = vi.fn((): SaveOperation => saveOperation());

    const { result } = renderHook(() => useUploadQueue({ upload, save }));
    await act(async () => {
      result.current.addFiles(
        ['a.pdf', 'b.pdf', 'c.pdf', 'd.pdf', 'e.pdf'].map((name) => makeFile(name))
      );
      result.current.start();
    });
    expect(uploadedNames).toEqual(['a.pdf', 'b.pdf', 'c.pdf']);

    const itemA = result.current.items.find((i) => i.file.name === 'a.pdf');
    const itemD = result.current.items.find((i) => i.file.name === 'd.pdf');
    if (!itemA || !itemD) throw new Error('Expected queued test items');

    act(() => {
      result.current.cancel(itemD.id);
      result.current.cancel(itemA.id);
    });
    await act(async () => {});

    expect(signals[0].aborted).toBe(true);
    expect(uploadedNames).not.toContain('d.pdf');
    expect(uploadedNames).toContain('e.pdf');
    expect(result.current.items.find((i) => i.file.name === 'a.pdf')?.status).toBe('cancelled');
    expect(result.current.items.find((i) => i.file.name === 'd.pdf')?.status).toBe('cancelled');
  });

  it('retry after a save failure reuses the cached asset without re-uploading', async () => {
    let saveCalls = 0;
    const upload = vi.fn(async (): Promise<CloudinaryAsset> => asset);
    const save = vi.fn((): SaveOperation => {
      saveCalls += 1;
      if (saveCalls === 1) return saveOperation(Promise.reject(new Error('save failed')));
      return saveOperation();
    });

    const { result } = renderHook(() => useUploadQueue({ upload, save }));
    await act(async () => {
      result.current.addFiles([makeFile('a.pdf')]);
      result.current.start();
    });

    await waitFor(() => expect(result.current.items[0].status).toBe('failed'));
    expect(result.current.items[0].error).toBe('save failed');
    expect(result.current.items[0].asset).toBe(asset);
    expect(upload).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.retry(result.current.items[0].id);
    });
    await waitFor(() => expect(result.current.items[0].status).toBe('succeeded'));
    expect(upload).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledTimes(2);
    expect(result.current.summary.isTerminal).toBe(true);
  });

  it('ignores a same-tick cancel+retry of an upload until the attempt settles, then retries', async () => {
    let calls = 0;
    const upload = vi.fn((_file: File, signal: AbortSignal) => {
      calls += 1;
      if (calls > 1) return Promise.resolve(asset);
      const gate = deferred<CloudinaryAsset>();
      signal.addEventListener('abort', () =>
        gate.reject(new DOMException('Aborted', 'AbortError'))
      );
      return gate.promise;
    });
    const save = vi.fn((): SaveOperation => saveOperation());

    const { result } = renderHook(() => useUploadQueue({ upload, save }));
    await act(async () => {
      result.current.addFiles([makeFile('a.pdf')]);
      result.current.start();
    });
    expect(result.current.items[0].status).toBe('uploading');

    act(() => {
      result.current.cancel(result.current.items[0].id);
      result.current.retry(result.current.items[0].id);
    });
    // The same-tick retry is ignored while the upload controller is still winding down.
    expect(result.current.items[0].status).toBe('cancelled');
    expect(upload).toHaveBeenCalledTimes(1);

    await act(async () => {});
    act(() => {
      result.current.retry(result.current.items[0].id);
    });
    await waitFor(() => expect(result.current.items[0].status).toBe('succeeded'));
    expect(upload).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenCalledTimes(1);
    expect(result.current.summary.isTerminal).toBe(true);
  });

  it('retries one failed item without starting other queued files while the queue is stopped', async () => {
    let aPdfSaveCalls = 0;
    const upload = vi.fn(async (): Promise<CloudinaryAsset> => asset);
    const save = vi.fn((item: UploadItem): SaveOperation => {
      if (item.file.name === 'a.pdf') {
        aPdfSaveCalls += 1;
        if (aPdfSaveCalls === 1) return saveOperation(Promise.reject(new Error('save failed')));
      }
      return saveOperation();
    });

    const { result } = renderHook(() => useUploadQueue({ upload, save }));
    await act(async () => {
      result.current.addFiles(['a.pdf', 'b.pdf', 'c.pdf'].map((name) => makeFile(name)));
      result.current.start();
    });
    await waitFor(() => expect(result.current.summary.isTerminal).toBe(true));
    expect(result.current.items.find((i) => i.file.name === 'a.pdf')?.status).toBe('failed');

    act(() => {
      result.current.addFiles(['d.pdf', 'e.pdf'].map((name) => makeFile(name)));
    });
    expect(result.current.items.filter((i) => i.status === 'queued')).toHaveLength(2);

    act(() => {
      const itemA = result.current.items.find((i) => i.file.name === 'a.pdf');
      if (!itemA) throw new Error('Expected failed test item');
      result.current.retry(itemA.id);
    });
    await waitFor(() =>
      expect(result.current.items.find((i) => i.file.name === 'a.pdf')?.status).toBe('succeeded')
    );

    // Only a.pdf was re-run; the newly queued files stay queued.
    expect(upload).toHaveBeenCalledTimes(3);
    expect(save).toHaveBeenCalledTimes(4);
    expect(result.current.items.filter((i) => i.status === 'queued')).toHaveLength(2);
    expect(result.current.items.filter((i) => i.status === 'uploading')).toHaveLength(0);
    expect(result.current.items.filter((i) => i.status === 'saving')).toHaveLength(0);
    expect(result.current.isRunning).toBe(false);
  });

  it('stops running when the last active item settles while paused', async () => {
    const gate = deferred<CloudinaryAsset>();
    const upload = vi.fn(() => gate.promise);
    const save = vi.fn((): SaveOperation => saveOperation());

    const { result } = renderHook(() => useUploadQueue({ upload, save }));
    await act(async () => {
      result.current.addFiles([makeFile('a.pdf')]);
      result.current.start();
    });
    expect(result.current.isRunning).toBe(true);
    expect(result.current.items[0].status).toBe('uploading');

    act(() => {
      result.current.pause();
    });
    expect(result.current.isPaused).toBe(true);

    await act(async () => {
      gate.resolve(asset);
    });
    await waitFor(() => expect(result.current.isRunning).toBe(false));
    expect(result.current.isPaused).toBe(true);
    expect(result.current.summary.isTerminal).toBe(true);
  });

  it('retry is a no-op while paused and only runs after resume', async () => {
    let saveCalls = 0;
    const upload = vi.fn(async (): Promise<CloudinaryAsset> => asset);
    const save = vi.fn((): SaveOperation => {
      saveCalls += 1;
      if (saveCalls === 1) return saveOperation(Promise.reject(new Error('save failed')));
      return saveOperation();
    });

    const { result } = renderHook(() => useUploadQueue({ upload, save }));
    await act(async () => {
      result.current.addFiles([makeFile('a.pdf')]);
      result.current.start();
    });
    await waitFor(() => expect(result.current.items[0].status).toBe('failed'));
    expect(result.current.isRunning).toBe(false);

    act(() => {
      result.current.pause();
      result.current.retry(result.current.items[0].id);
    });
    // While paused the stopped-path retry is a no-op: the item stays failed.
    expect(result.current.items[0].status).toBe('failed');
    expect(result.current.isPaused).toBe(true);
    expect(upload).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.resume();
      result.current.retry(result.current.items[0].id);
    });
    await waitFor(() => expect(result.current.items[0].status).toBe('succeeded'));
    expect(upload).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledTimes(2);
  });
});
