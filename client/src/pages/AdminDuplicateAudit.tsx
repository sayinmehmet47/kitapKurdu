import { AlertTriangle, ChevronLeft, ChevronRight, Download, Play, Search } from 'lucide-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
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

const AdminDuplicateAudit = () => {
  const [type, setType] = useState<DuplicateAuditType>('url');

  const { user, isLoggedIn } = useSelector((state: RootState) => state.authSlice);
  const isAdmin = isLoggedIn && user.user.isAdmin;

  const [trigger, { data, isFetching, isError, error }] = useLazyGetDuplicateAuditQuery();

  const totalPages = data ? Math.max(1, Math.ceil(data.totalGroups / data.limit)) : 1;
  const errorMessage = (error as { data?: { errors?: { message?: string }[] } })?.data?.errors?.[0]
    ?.message;

  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const runAudit = (nextType = type, nextPage = 1) => {
    setType(nextType);
    void trigger({ type: nextType, page: nextPage, limit: PAGE_SIZE });
  };

  const handlePageChange = (nextPage: number) => {
    void trigger({ type, page: nextPage, limit: PAGE_SIZE });
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

            <Button onClick={() => runAudit(type)} disabled={isFetching}>
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
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group Key</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Book ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>ISBN</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead className="text-right">Size</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.groups.flatMap((group) =>
                      group.books.map((book) => (
                        <TableRow key={`${group.key}-${book.bookId}`}>
                          <TableCell className="font-mono text-xs">{group.key}</TableCell>
                          <TableCell>{TYPE_LABELS[group.type]}</TableCell>
                          <TableCell>
                            <Badge variant={group.confidence === 'exact' ? 'success' : 'warning'}>
                              {group.confidence}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{book.bookId}</TableCell>
                          <TableCell>{book.name}</TableCell>
                          <TableCell>{book.author ?? '—'}</TableCell>
                          <TableCell>{book.isbn ?? '—'}</TableCell>
                          <TableCell>{book.language}</TableCell>
                          <TableCell className="text-right">{book.size ?? '—'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
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
