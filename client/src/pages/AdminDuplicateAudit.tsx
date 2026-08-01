import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Play,
  Search,
  Undo2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  type DuplicateAuditResult,
  type DuplicateAuditType,
  useLazyGetDuplicateAuditQuery,
  useMarkDuplicateMutation,
  useUnmarkDuplicateMutation,
} from '@/redux/services/duplicateAudit.api';
import type { RootState } from '@/redux/store';

const TYPE_OPTIONS: DuplicateAuditType[] = ['url', 'isbn', 'name-size', 'title-author-language'];

const TYPE_LABELS: Record<DuplicateAuditType, string> = {
  url: 'URL',
  isbn: 'ISBN',
  'name-size': 'Name + Size',
  'title-author-language': 'Title + Author + Language',
};

const PAGE_SIZE = 20;

/**
 * Escape a single CSV cell: double embedded quotes and wrap cells containing
 * quotes, commas or line breaks. Prefix cells that would be interpreted as a
 * spreadsheet formula with a single quote to prevent CSV injection.
 */
const csvEscape = (value: unknown): string => {
  let text = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  if (/[",\n\r]/.test(text)) {
    text = `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const toCsv = (report: DuplicateAuditResult): string => {
  const header = [
    'Group Key',
    'Reason',
    'Confidence',
    'Count',
    'Book ID',
    'Name',
    'Author',
    'ISBN',
    'Language',
    'Size',
  ].join(',');

  const rows = report.groups.flatMap((group) =>
    group.books.map((book) =>
      [
        group.key,
        TYPE_LABELS[group.type],
        group.confidence,
        String(group.count),
        book.bookId,
        book.name,
        book.author ?? '',
        book.isbn ?? '',
        book.language,
        book.size ?? '',
      ]
        .map(csvEscape)
        .join(',')
    )
  );

  return [header, ...rows].join('\n');
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

/** Pull the first backend error message out of an RTK Query rejection. */
const getErrorMessage = (error: unknown): string => {
  const message = (error as { data?: { errors?: { message?: string }[] } })?.data?.errors?.[0]
    ?.message;
  return message || 'Something went wrong. Please try again.';
};

const AdminDuplicateAudit = () => {
  const [type, setType] = useState<DuplicateAuditType>('url');
  const [page, setPage] = useState(1);
  const [canonicalByGroup, setCanonicalByGroup] = useState<Record<string, string>>({});
  const [selectedDuplicates, setSelectedDuplicates] = useState<Record<string, string[]>>({});

  const { user, isLoggedIn } = useSelector((state: RootState) => state.authSlice);
  const isAdmin = isLoggedIn && user.user.isAdmin;

  const [trigger, { data, isFetching, isError, error }] = useLazyGetDuplicateAuditQuery();
  const [markDuplicate, { isLoading: isMarking }] = useMarkDuplicateMutation();
  const [unmarkDuplicate, { isLoading: isUnmarking }] = useUnmarkDuplicateMutation();

  const isMutating = isMarking || isUnmarking;

  const totalPages = data ? Math.max(1, Math.ceil(data.totalGroups / data.limit)) : 1;
  const errorMessage = getErrorMessage(error);

  // Reset per-group selections whenever a new report arrives (initial run,
  // type/page change or the refetch that follows a mark/unmark mutation).
  // Kept above the admin early return so hook order is unconditional.
  useEffect(() => {
    if (!data) return;
    const nextCanonicals: Record<string, string> = {};
    const nextSelections: Record<string, string[]> = {};
    for (const group of data.groups) {
      // Sensible default canonical: the first unmarked book in the group.
      const unmarked = group.books.filter((book) => !book.duplicateOf);
      nextCanonicals[group.key] = (unmarked[0] ?? group.books[0])?.bookId ?? '';
      nextSelections[group.key] = [];
    }
    setCanonicalByGroup(nextCanonicals);
    setSelectedDuplicates(nextSelections);
  }, [data]);

  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const runAudit = (nextType = type, nextPage = 1) => {
    setType(nextType);
    setPage(nextPage);
    void trigger({ type: nextType, page: nextPage, limit: PAGE_SIZE });
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    void trigger({ type, page: nextPage, limit: PAGE_SIZE });
  };

  const rerunCurrentAudit = () => {
    void trigger({ type, page, limit: PAGE_SIZE });
  };

  const handleCanonicalChange = (groupKey: string, bookId: string) => {
    setCanonicalByGroup((prev) => ({ ...prev, [groupKey]: bookId }));
    // A book promoted to canonical can no longer be a selected duplicate.
    setSelectedDuplicates((prev) => ({
      ...prev,
      [groupKey]: (prev[groupKey] ?? []).filter((id) => id !== bookId),
    }));
  };

  const handleDuplicateToggle = (groupKey: string, bookId: string) => {
    setSelectedDuplicates((prev) => {
      const current = prev[groupKey] ?? [];
      const next = current.includes(bookId)
        ? current.filter((id) => id !== bookId)
        : [...current, bookId];
      return { ...prev, [groupKey]: next };
    });
  };

  const handleMark = async (groupKey: string) => {
    const canonicalId = canonicalByGroup[groupKey];
    const duplicateIds = selectedDuplicates[groupKey] ?? [];
    if (!canonicalId || duplicateIds.length === 0 || isMutating) return;

    const confirmed = window.confirm(
      `Mark ${duplicateIds.length} book${duplicateIds.length === 1 ? '' : 's'} as duplicates of ${canonicalId}? They will be hidden from the public site.`
    );
    if (!confirmed) return;

    try {
      const result = await markDuplicate({ canonicalId, duplicateIds }).unwrap();
      toast.success(`Marked ${result.updatedCount} book(s) as duplicates`);
      rerunCurrentAudit();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleUndo = async (bookId: string) => {
    if (isMutating) return;
    try {
      const result = await unmarkDuplicate({ duplicateIds: [bookId] }).unwrap();
      toast.success(`Restored ${result.updatedCount} book(s)`);
      rerunCurrentAudit();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const downloadJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `duplicate-audit-${data.type}.json`);
  };

  const downloadCsv = () => {
    if (!data) return;
    const blob = new Blob([toCsv(data)], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, `duplicate-audit-${data.type}.csv`);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Search className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Duplicate Audit</h1>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="duplicate-audit-type" className="text-sm font-medium">
                Audit Type
              </label>
              <Select value={type} onValueChange={(value) => setType(value as DuplicateAuditType)}>
                <SelectTrigger id="duplicate-audit-type" className="w-[240px]">
                  <SelectValue placeholder="Select audit type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {TYPE_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => runAudit(type)} disabled={isFetching || isMutating}>
              {isFetching ? <LoadingSpinner size={16} /> : <Play className="h-4 w-4" />}
              {isFetching ? 'Running…' : 'Run Audit'}
            </Button>
          </div>
        </Card>

        {isError ? (
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Audit failed</p>
                <p className="text-sm text-muted-foreground">
                  {errorMessage || 'Something went wrong. Please try again.'}
                </p>
              </div>
            </div>
          </Card>
        ) : isFetching && !data ? (
          <Card className="p-6">
            <div className="flex items-center justify-center gap-3 py-12">
              <LoadingSpinner />
              <span className="text-muted-foreground">Scanning books…</span>
            </div>
          </Card>
        ) : data ? (
          <>
            {data.isTruncated && (
              <Alert variant="destructive" className="mb-6" data-testid="truncated-warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Scan limit reached</AlertTitle>
                <AlertDescription>
                  This audit scanned {data.scannedBooks.toLocaleString()} of{' '}
                  {data.totalBooks.toLocaleString()} books. Results may be incomplete.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
              {TYPE_OPTIONS.map((option) => (
                <Card key={option} className="p-4" data-testid={`summary-${option}`}>
                  <p className="text-sm font-medium text-muted-foreground">{TYPE_LABELS[option]}</p>
                  <p className="mt-1 text-2xl font-bold">{data.summary[option]}</p>
                </Card>
              ))}
              <Card className="p-4" data-testid="summary-scanned">
                <p className="text-sm font-medium text-muted-foreground">Scanned Books</p>
                <p className="mt-1 text-2xl font-bold">{data.scannedBooks}</p>
              </Card>
              <Card className="p-4" data-testid="summary-total-groups">
                <p className="text-sm font-medium text-muted-foreground">Total Groups</p>
                <p className="mt-1 text-2xl font-bold">{data.totalGroups}</p>
              </Card>
            </div>

            {data.groups.length === 0 ? (
              <Card className="p-6">
                <p className="text-center text-muted-foreground">
                  No duplicate groups found for {TYPE_LABELS[data.type].toLowerCase()}.
                </p>
              </Card>
            ) : (
              <div className="space-y-6">
                {data.groups.map((group) => {
                  const canonicalId = canonicalByGroup[group.key] ?? '';
                  const selected = selectedDuplicates[group.key] ?? [];
                  return (
                    <Card key={group.key} data-testid={`group-${group.key}`}>
                      <div className="flex flex-wrap items-center gap-3 p-4 border-b">
                        <span className="font-mono text-xs">{group.key}</span>
                        <Badge variant={group.confidence === 'exact' ? 'success' : 'warning'}>
                          {group.confidence}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {TYPE_LABELS[group.type]}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {group.count} {group.count === 1 ? 'book' : 'books'}
                        </span>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Canonical</TableHead>
                            <TableHead>Duplicate</TableHead>
                            <TableHead>Book ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Author</TableHead>
                            <TableHead>ISBN</TableHead>
                            <TableHead>Language</TableHead>
                            <TableHead className="text-right">Size</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.books.map((book) => {
                            const isMarked = Boolean(book.duplicateOf);
                            const isCanonical = canonicalId === book.bookId;
                            return (
                              <TableRow key={`${group.key}-${book.bookId}`}>
                                <TableCell>
                                  <input
                                    type="radio"
                                    name={`canonical-${group.key}`}
                                    value={book.bookId}
                                    checked={isCanonical}
                                    onChange={() => handleCanonicalChange(group.key, book.bookId)}
                                    disabled={isMutating || isMarked}
                                    aria-label={`Set ${book.name} as canonical`}
                                  />
                                </TableCell>
                                <TableCell>
                                  <input
                                    type="checkbox"
                                    checked={selected.includes(book.bookId)}
                                    onChange={() => handleDuplicateToggle(group.key, book.bookId)}
                                    disabled={isMutating || isMarked || isCanonical}
                                    aria-label={`Select ${book.name} as duplicate`}
                                  />
                                </TableCell>
                                <TableCell className="font-mono text-xs">{book.bookId}</TableCell>
                                <TableCell>{book.name}</TableCell>
                                <TableCell>{book.author ?? '—'}</TableCell>
                                <TableCell>{book.isbn ?? '—'}</TableCell>
                                <TableCell>{book.language}</TableCell>
                                <TableCell className="text-right">{book.size ?? '—'}</TableCell>
                                <TableCell>
                                  {isMarked && book.duplicateOf ? (
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant="warning"
                                        data-testid={`marked-${book.bookId}`}
                                      >
                                        Duplicate of {book.duplicateOf}
                                      </Badge>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleUndo(book.bookId)}
                                        disabled={isMutating}
                                        aria-label={`Undo mark for ${book.name}`}
                                      >
                                        <Undo2 className="h-3.5 w-3.5" />
                                        Undo
                                      </Button>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>

                      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t">
                        <p
                          className="text-sm text-muted-foreground"
                          data-testid={`selection-count-${group.key}`}
                        >
                          {selected.length}{' '}
                          {selected.length === 1 ? 'duplicate selected' : 'duplicates selected'}
                        </p>
                        <Button
                          onClick={() => handleMark(group.key)}
                          disabled={isMutating || selected.length === 0 || !canonicalId}
                        >
                          {isMarking ? <LoadingSpinner size={16} /> : <Play className="h-4 w-4" />}
                          Mark duplicates
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={downloadJson} disabled={isFetching}>
                  <Download className="h-4 w-4" />
                  Download JSON
                </Button>
                <Button variant="outline" size="sm" onClick={downloadCsv} disabled={isFetching}>
                  <Download className="h-4 w-4" />
                  Download CSV
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Page {data.page} of {totalPages} ({data.totalGroups} groups)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(data.page - 1)}
                  disabled={isFetching || data.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(data.page + 1)}
                  disabled={isFetching || data.page >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <Card className="p-6">
            <p className="text-center text-muted-foreground">
              Run an audit to detect duplicate books. No request is sent until you click Run.
            </p>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default AdminDuplicateAudit;
