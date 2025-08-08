import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useGetBookByIdQuery } from '@/redux/services/book.api';
import { downloadBook } from '@/helpers/downloadBook';
import { shareLink } from '@/helpers/shareLink';

export const useBookPreview = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const [isReading, setIsReading] = useState(false);

  const { user, isLoggedIn } = useSelector(
    (state: RootState) => state.authSlice
  );
  const isAdmin = isLoggedIn && user?.user?.isAdmin;

  const { data: book, isLoading, isError } = useGetBookByIdQuery(bookId);

  const fileType = useMemo(() => {
    return book?.url ? book.url.split('.').pop()?.toLowerCase() || '' : '';
  }, [book?.url]);

  const handleDownload = () => {
    if (book?.url && book?.name) {
      downloadBook(book.url, book.name);
      toast.success('Download started');
    }
  };

  const handleShare = () => {
    if (!book) return;
    const origin = window.location.origin;
    const url = `${origin}/og/book/${book._id}`;
    shareLink({
      title: book.name,
      text: book.description || `Check out this book: ${book.name}`,
      url,
    });
  };

  const handleStartReading = () => {
    setIsReading(true);
  };

  const handleStopReading = () => {
    setIsReading(false);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleEditBook = () => {
    if (book?._id) {
      navigate(`/book/edit/${book._id}`);
    }
  };

  const getBookCoverUrl = () => {
    if (book?.url?.includes('pdf')) {
      return book.url.replace('pdf', 'jpg');
    }
    return (
      book?.imageLinks?.thumbnail ||
      'https://images.pexels.com/photos/8594539/pexels-photo-8594539.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
    );
  };

  return {
    // State
    book,
    isLoading,
    isError,
    isReading,
    isAdmin,
    fileType,

    // Computed values
    bookCoverUrl: getBookCoverUrl(),

    // Actions
    handleDownload,
    handleShare,
    handleStartReading,
    handleStopReading,
    handleGoBack,
    handleEditBook,
  };
};
