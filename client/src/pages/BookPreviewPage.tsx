import { useGetBookByIdQuery } from '../redux/services/book.api';
import { FC } from 'react';
import { useParams } from 'react-router-dom';
import { Spinner } from 'flowbite-react';
import { BookPreview } from 'components';
export const BookPreviewPage: FC = () => {
  const router = useParams<{ bookId: string }>();
  const bookId = router.bookId;

  const { data: book, isLoading, isError } = useGetBookByIdQuery(bookId);

  const fileType = book?.url ? book.url.split('.').pop() : '';

  if (isError) {
    return <div>Error...</div>;
  }

  return (
    <div>
      {isLoading ? (
        <div className="h-screen w-full grid place-items-center">
          <Spinner />
        </div>
      ) : (
        <BookPreview
          bookUrl={book?.url || ''}
          fileType={fileType || ''}
          bookName={book?.name || ''}
        />
      )}
    </div>
  );
};
