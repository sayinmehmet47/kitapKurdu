import { useState } from 'react';
import { useSelector } from 'react-redux';
import { StarPicker } from '@/components/StarPicker';
import { Button, Card, CardContent, CardHeader, Textarea } from '@/components/ui';
import { useGetBookReviewsQuery, useRateBookMutation } from '@/redux/services/book.api';
import type { RootState } from '@/redux/store';

interface ReviewsProps {
  bookId: string;
}

interface Review {
  _id: string;
  userId?: { username?: string };
  rating: number;
  review?: string;
}

export const Reviews: React.FC<ReviewsProps> = ({ bookId }) => {
  const { data, refetch, isFetching } = useGetBookReviewsQuery(bookId);
  const { isLoggedIn } = useSelector((s: RootState) => s.authSlice);
  const [rateBook, { isLoading }] = useRateBookMutation();
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  const reviews: Review[] = data?.data ?? [];

  const submit = async () => {
    if (!isLoggedIn) return;
    await rateBook({ bookId, rating, review: text || undefined }).unwrap();
    setText('');
    refetch();
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Reviews</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoggedIn && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">Your rating:</span>
              <StarPicker value={rating} onChange={setRating} size="sm" ariaLabel="Your rating" />
            </div>
            <Textarea
              placeholder="Leave a short review (optional)"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
            />
            <Button disabled={isLoading} onClick={submit}>
              Submit
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {reviews.length ? (
            reviews.map((r) => (
              <div key={r._id} className="border-b pb-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{r.userId?.username || 'Anonymous'}</span>
                  <StarPicker value={r.rating} readOnly size="sm" />
                  <span>• {r.rating}/5</span>
                </div>
                {r.review && <div className="text-sm mt-1">{r.review}</div>}
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">
              {isFetching ? 'Loading…' : 'No reviews yet'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
