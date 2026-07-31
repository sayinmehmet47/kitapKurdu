import { FileText, Languages, User } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { StarPicker } from '@/components/StarPicker';
import { Badge, Card, CardHeader } from '@/components/ui';
import type { Book } from '@/models/book.model';
import { useGetBookRatingSummaryQuery } from '@/redux/services/book.api';

interface BookDetailsProps {
  book: Book;
  fileType: string;
}

export const BookDetails: React.FC<BookDetailsProps> = ({ book, fileType }) => {
  const { data: summary } = useGetBookRatingSummaryQuery(book._id);
  const avg = useMemo(() => Number(summary?.data?.avgRating || 0), [summary]);
  const count = summary?.data?.count || 0;
  const uploader = book.uploader;

  return (
    <Card>
      <CardHeader>
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{book.name}</h1>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              {typeof uploader === 'object' && uploader?.username && (
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {uploader.username}
                </div>
              )}
              {book.language && (
                <Badge variant="outline" className="hidden md:flex">
                  <Languages className="h-3 w-3 mr-1" />
                  {book.language}
                </Badge>
              )}
              <Badge variant="outline" className="hidden md:flex">
                <FileText className="h-3 w-3 mr-1" />
                {fileType?.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Rating */}
          <section
            aria-label="Book rating summary"
            className="flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <StarPicker value={avg} readOnly size="sm" ariaLabel="Average rating" />
            </div>
            <span className="text-sm text-muted-foreground">
              {avg.toFixed(1)} ({count} reviews)
            </span>
          </section>
        </div>
      </CardHeader>
    </Card>
  );
};
