import Layout from '../components/Layout';
import { BookPreview } from '../components/BookPreview';
import { useGetBookByIdQuery } from '../redux/services/book.api';
import { FC } from 'react';
import { useParams } from 'react-router-dom';

export const BookPreviewPage: FC = () => {
  const router = useParams<{ bookId: string }>();
  const bookId = router.bookId;

  const { data: book, isLoading, isError } = useGetBookByIdQuery(bookId);

  const fileType = book?.url ? book.url.split('.').pop() : '';

  if (isLoading || !book) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error...</div>;
  }

  return (
    <Layout>
      <BookPreview
        bookUrl={book?.url || ''}
        fileType={fileType || ''}
        bookName={book?.name || ''}
      />
    </Layout>
  );
};
