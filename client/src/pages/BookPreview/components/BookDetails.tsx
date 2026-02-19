import React, { useMemo, useState } from 'react';
import { Star, User, Languages, FileText } from 'lucide-react';
import { Card, CardHeader, Badge } from '@/components/ui';
import { Book } from '@/models/book.model';
import {
  useGetBookRatingSummaryQuery,
  useRateBookMutation,
} from '@/redux/services/book.api';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { toast } from 'sonner';

interface BookDetailsProps {
  book: Book;
  fileType: string;
}

export const BookDetails: React.FC<BookDetailsProps> = ({ book, fileType }) => {
  const { data: summary } = useGetBookRatingSummaryQuery(book._id);
  const [rateBook] = useRateBookMutation();
  const { isLoggedIn } = useSelector((s: RootState) => s.authSlice);
  const [myRating, setMyRating] = useState<number>(0);
  const avg = useMemo(() => Number(summary?.data?.avgRating || 0), [summary]);
  const count = summary?.data?.count || 0;

  const handleRate = async (value: number) => {
    if (!isLoggedIn) return toast.error('Please sign in to rate');
    setMyRating(value);
    try {
      await rateBook({ bookId: book._id, rating: value }).unwrap();
      toast.success('Thanks for rating!');
    } catch {
      toast.error('Could not submit rating');
    }
  };
  return (
    <Card>
      <CardHeader>
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {book.name}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              {book.uploader?.username && (
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {book.uploader.username}
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
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((value) => {
                const filled = value <= (myRating || Math.round(avg));
                return (
                  <button
                    key={value}
                    type="button"
                    aria-label={`Rate ${value}`}
                    onClick={() => handleRate(value)}
                    className="p-1"
                  >
                    <Star
                      className={
                        'h-5 w-5 ' +
                        (filled
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300')
                      }
                    />
                  </button>
                );
              })}
            </div>
            <span className="text-sm text-muted-foreground">
              {avg.toFixed(1)} ({count} reviews)
            </span>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};
