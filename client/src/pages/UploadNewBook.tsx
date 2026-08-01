import { AlertCircle, Book, CheckCircle, FileText, Upload, X, XCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Progress,
} from '@/components/ui';
import Layout from '../components/Layout';
import {
  type QueueRejection,
  type SaveOperation,
  type UploadItem,
  useUploadQueue,
} from '../hooks/useUploadQueue';
import { useAddNewBookMutation } from '../redux/services/book.api';
import type { CloudinaryAsset } from '../services/cloudinaryUpload';
import { uploadToCloudinary } from '../services/cloudinaryUpload';

interface ManualMetadata {
  author: string;
  isbn: string;
  publisher: string;
}

const emptyManualMetadata: ManualMetadata = {
  author: '',
  isbn: '',
  publisher: '',
};

const statusLabels: Record<UploadItem['status'], string> = {
  queued: 'Queued for upload',
  uploading: 'Uploading...',
  saving: 'Saving to library...',
  succeeded: 'Uploaded successfully!',
  failed: 'Upload failed',
  cancelled: 'Upload cancelled',
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

const getStatusIcon = (status: UploadItem['status']) => {
  switch (status) {
    case 'succeeded':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'failed':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case 'uploading':
    case 'saving':
      return (
        <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      );
    case 'cancelled':
      return <XCircle className="h-5 w-5 text-gray-400" />;
    default:
      return <FileText className="h-5 w-5 text-gray-400" />;
  }
};

const summarizeRejections = (rejected: QueueRejection[]): string => {
  const counts = new Map<string, number>();
  for (const { reason } of rejected) {
    counts.set(reason, (counts.get(reason) ?? 0) + 1);
  }
  const parts: string[] = [];
  for (const [reason, count] of counts) {
    parts.push(count > 1 ? `${reason} (${count})` : reason);
  }
  return parts.join(', ');
};

const editableItemsOf = (entries: UploadItem[]) =>
  entries.filter((entry) => entry.status !== 'succeeded' && entry.status !== 'cancelled');

export default function UploadNewBook() {
  const [manualMetadata, setManualMetadata] = useState<ManualMetadata>(emptyManualMetadata);
  const manualMetadataRef = useRef<ManualMetadata>(emptyManualMetadata);
  const metadataItemIdRef = useRef<string | undefined>(undefined);
  const itemsRef = useRef<UploadItem[]>([]);
  const prevTerminalRef = useRef(false);
  const [addNewBook] = useAddNewBookMutation();

  const save = useCallback(
    (item: UploadItem, asset: CloudinaryAsset): SaveOperation => {
      // Metadata is owned by a single item id, read from refs so a later file
      // added to the queue cannot detach these values from their owner.
      const withMetadata = metadataItemIdRef.current === item.id;
      const metadata = withMetadata ? manualMetadataRef.current : emptyManualMetadata;
      const author = metadata.author.trim();
      const isbn = metadata.isbn.trim();
      const publisher = metadata.publisher.trim();

      const book = {
        name: item.file.name,
        size: String(asset.bytes),
        url: asset.secure_url,
        ...(author ? { author } : null),
        ...(isbn ? { isbn } : null),
        ...(publisher ? { publisher } : null),
      };

      const request = addNewBook(book);
      return { promise: request.unwrap().then(() => undefined) };
    },
    [addNewBook]
  );

  const {
    items,
    addFiles,
    start,
    pause,
    resume,
    cancel,
    cancelAll,
    remove,
    retry,
    isRunning,
    isPaused,
    summary,
  } = useUploadQueue({ upload: uploadToCloudinary, save });

  itemsRef.current = items;

  const editable = editableItemsOf(items);
  const metadataTargetId = editable.length === 1 ? editable[0].id : undefined;

  const updateManualMetadata = useCallback((patch: Partial<ManualMetadata>) => {
    setManualMetadata((current) => {
      const next = { ...current, ...patch };
      manualMetadataRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    if (metadataTargetId === undefined || metadataItemIdRef.current === metadataTargetId) {
      return;
    }
    // Only hand the metadata form to a new item once its previous owner is no
    // longer editable (removed or terminal). Adding another file merely hides
    // the panel and must not reset the in-flight owner's values.
    const ownerId = metadataItemIdRef.current;
    const owner =
      ownerId === undefined ? undefined : itemsRef.current.find((entry) => entry.id === ownerId);
    const ownerGone =
      ownerId === undefined ||
      owner === undefined ||
      owner.status === 'succeeded' ||
      owner.status === 'cancelled';
    if (ownerGone) {
      metadataItemIdRef.current = metadataTargetId;
      manualMetadataRef.current = emptyManualMetadata;
      setManualMetadata(emptyManualMetadata);
    }
  }, [metadataTargetId]);

  useEffect(() => {
    if (summary.isTerminal && !prevTerminalRef.current) {
      if (summary.succeeded > 0 || summary.failed > 0) {
        const parts = [
          `${summary.succeeded} uploaded`,
          `${summary.failed} failed`,
          `${summary.cancelled} cancelled`,
        ].join(', ');
        if (summary.failed > 0 || summary.cancelled > 0) {
          toast.error(`Upload batch finished: ${parts}`);
        } else {
          toast.success(`Upload batch finished: ${parts}`);
        }
      }
    }
    prevTerminalRef.current = summary.isTerminal;
  }, [summary.isTerminal, summary.succeeded, summary.failed, summary.cancelled]);

  const onDrop = useCallback(
    (droppedFiles: File[]) => {
      const result = addFiles(droppedFiles);
      if (result.rejected.length === 0) return;

      const rejectedText = `${result.rejected.length} file${result.rejected.length === 1 ? '' : 's'} rejected`;
      const summaryText =
        result.accepted > 0
          ? `${result.accepted} file${result.accepted === 1 ? '' : 's'} added, ${rejectedText}`
          : rejectedText;
      toast.error(`${summaryText}: ${summarizeRejections(result.rejected)}`);
    },
    [addFiles]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: true,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/30 dark:bg-gray-950/30 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center bg-white dark:bg-gray-800 rounded-2xl px-6 py-3 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
              <div className="bg-primary/10 p-3 rounded-xl mr-4">
                <Upload className="h-7 w-7 text-primary" />
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  Upload Books
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Share your favorite books with the community
                </p>
              </div>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Upload PDF and EPUB files to expand our digital library
            </p>
          </div>

          {/* Upload Area */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                Select Files
              </CardTitle>
              <CardDescription>
                Drag and drop your books here, or use the Browse Files button below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
                  ${
                    isDragActive
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary'
                  }
                `}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center space-y-4">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  {isDragActive ? (
                    <p className="text-lg font-medium text-primary">Drop your books here!</p>
                  ) : (
                    <>
                      <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Drag and drop your books here
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        PDF and EPUB files up to 100MB each
                      </p>
                    </>
                  )}
                  <Button variant="outline" type="button" onClick={open}>
                    Browse Files
                  </Button>
                </div>
              </div>

              {/* File Type Info */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    <strong>PDF files:</strong> Perfect for academic papers, textbooks, and
                    documents
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Book className="h-4 w-4" />
                  <AlertDescription>
                    <strong>EPUB files:</strong> Ideal for novels, stories, and reflowable content
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* File List */}
          {items.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Upload Queue</CardTitle>
                  <CardDescription>
                    {summary.succeeded} of {summary.total} files uploaded
                    {summary.failed > 0 ? ` · ${summary.failed} failed` : ''}
                    {summary.cancelled > 0 ? ` · ${summary.cancelled} cancelled` : ''}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {isRunning && !isPaused && (
                    <Button variant="outline" onClick={pause}>
                      Pause
                    </Button>
                  )}
                  {isPaused && (
                    <Button variant="outline" onClick={resume}>
                      Resume
                    </Button>
                  )}
                  {(summary.queued > 0 || summary.uploading > 0) && (
                    <Button variant="outline" onClick={cancelAll}>
                      Cancel All
                    </Button>
                  )}
                  <Button
                    onClick={start}
                    disabled={summary.queued === 0 || isRunning || isPaused}
                    className="ml-4"
                  >
                    Upload All{summary.queued > 0 ? ` (${summary.queued})` : ''}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {metadataTargetId !== undefined && (
                  <div className="mb-6 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      Optional book metadata
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      These details apply only to the single queued file.
                    </p>
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="upload-author">Author</Label>
                        <Input
                          id="upload-author"
                          value={manualMetadata.author}
                          onChange={(event) => updateManualMetadata({ author: event.target.value })}
                          maxLength={200}
                          autoComplete="off"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="upload-isbn">ISBN</Label>
                        <Input
                          id="upload-isbn"
                          value={manualMetadata.isbn}
                          onChange={(event) => updateManualMetadata({ isbn: event.target.value })}
                          maxLength={32}
                          autoComplete="off"
                          inputMode="numeric"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="upload-publisher">Publisher</Label>
                        <Input
                          id="upload-publisher"
                          value={manualMetadata.publisher}
                          onChange={(event) =>
                            updateManualMetadata({ publisher: event.target.value })
                          }
                          maxLength={200}
                          autoComplete="off"
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex-shrink-0">{getStatusIcon(item.status)}</div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {item.file.name}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {formatFileSize(item.file.size)}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {item.file.name.split('.').pop()?.toUpperCase()}
                            </Badge>
                          </div>
                        </div>

                        <p
                          className={`text-xs ${
                            item.status === 'succeeded'
                              ? 'text-green-600 dark:text-green-400'
                              : item.status === 'failed'
                                ? 'text-red-500'
                                : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {statusLabels[item.status]}
                        </p>

                        {item.status === 'uploading' && (
                          <div className="mt-2 space-y-2">
                            <Progress value={item.progress} className="h-2" />
                            <p className="text-xs text-gray-500">{item.progress}%</p>
                          </div>
                        )}

                        {item.status === 'failed' && item.error && (
                          <p className="mt-1 text-xs text-red-500">Error: {item.error}</p>
                        )}
                      </div>

                      <div className="flex-shrink-0 flex items-center space-x-2">
                        {(item.status === 'queued' || item.status === 'uploading') && (
                          <Button variant="outline" size="sm" onClick={() => cancel(item.id)}>
                            Cancel
                          </Button>
                        )}
                        {(item.status === 'failed' || item.status === 'cancelled') && (
                          <Button variant="outline" size="sm" onClick={() => retry(item.id)}>
                            Retry
                          </Button>
                        )}
                        {(item.status === 'succeeded' ||
                          item.status === 'failed' ||
                          item.status === 'cancelled') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(item.id)}
                            className="h-8 w-8 p-0"
                            aria-label={`Remove ${item.file.name}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
