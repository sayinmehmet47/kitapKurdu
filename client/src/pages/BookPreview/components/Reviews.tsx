import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Textarea,
} from '@/components/ui';
import {
  useGetBookReviewsQuery,
  useRateBookMutation,
} from '@/redux/services/book.api';

interface ReviewsProps {
  bookId: string;
}

export const Reviews: React.FC<ReviewsProps> = ({ bookId }) => {
  const { data, refetch, isFetching } = useGetBookReviewsQuery(bookId);
  const { isLoggedIn } = useSelector((s: RootState) => s.authSlice);
  const [rateBook, { isLoading }] = useRateBookMutation();
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);

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
              <label className="text-sm">Your rating:</label>
              <Input
                type="number"
                min={1}
                max={5}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-20"
              />
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
          {data?.data?.length ? (
            data.data.map((r: any) => (
              <div key={r._id} className="border-b pb-2">
                <div className="text-sm text-muted-foreground">
                  {r.userId?.username || 'Anonymous'} • {r.rating}/5
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
