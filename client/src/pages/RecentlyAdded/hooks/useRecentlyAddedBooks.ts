import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { RootState } from '@/redux/store';
import {
  useDeleteBookMutation,
  useFetchRecentlyAddedQuery,
  useLazyFetchRecentlyAddedQuery,
} from '@/redux/services/book.api';

export const useRecentlyAddedBooks = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const { data, isLoading, error } = useFetchRecentlyAddedQuery({
    page: 1,
    limit: 16,
  });

  const [fetchMoreBooks, { isLoading: isLoadingMore }] =
    useLazyFetchRecentlyAddedQuery();
  const [deleteBook] = useDeleteBookMutation();

  const { user, isLoggedIn } = useSelector(
    (state: RootState) => state.authSlice
  );
  const isAdmin = isLoggedIn && user?.user?.isAdmin;

  const books = data?.data?.books || [];
  const hasMore = data?.data?.pagination?.hasMore || false;
  const totalBooks = data?.data?.pagination?.totalBooks || 0;

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (error) {
      console.error('Failed to fetch books:', error);
      toast.error('Failed to load books');
    }
  }, [error]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    const nextPage = currentPage + 1;

    try {
      await fetchMoreBooks({ page: nextPage, limit: 16 }).unwrap();
      setCurrentPage(nextPage);

      const newParams = new URLSearchParams(window.location.search);
      newParams.set('page', nextPage.toString());
      window.history.pushState(
        {},
        '',
        `${window.location.pathname}?${newParams}`
      );
    } catch (err) {
      console.error('Failed to load more books:', err);
      toast.error('Failed to load more books');
    }
  }, [currentPage, hasMore, isLoadingMore, fetchMoreBooks]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteBook({ id }).unwrap();
        toast.success('Book deleted successfully');
      } catch (err) {
        console.error('Failed to delete book:', err);
        toast.error('Failed to delete book');
      }
    },
    [deleteBook]
  );

  return {
    books,
    totalBooks,
    hasMore,
    isLoading,
    isLoadingMore,
    showBackToTop,
    isAdmin,
    loadMore,
    handleDelete,
  };
};
