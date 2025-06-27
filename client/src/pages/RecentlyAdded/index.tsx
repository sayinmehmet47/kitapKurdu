import React from 'react';
import { BookOpen } from 'lucide-react';
import { Badge, LoadingSpinner } from '@/components/ui';
import Layout from '@/components/Layout';
import { BookCard } from './components/BookCard';
import { LoadMoreButton } from './components/LoadMoreButton';
import { BackToTopButton } from './components/BackToTopButton';
import { useRecentlyAddedBooks } from './hooks/useRecentlyAddedBooks';

const RecentlyAdded: React.FC = () => {
  const {
    books,
    isLoading,
    isLoadingMore,
    hasMore,
    totalBooks,
    showBackToTop,
    loadMore,
    handleDelete,
    isAdmin,
  } = useRecentlyAddedBooks();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner size={48} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/30">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Modern Header */}
          <header className="text-center mb-12">
            <div className="inline-flex items-center bg-white rounded-2xl px-6 py-3 shadow-sm border mb-6">
              <div className="bg-primary/10 p-3 rounded-xl mr-4">
                <BookOpen className="h-7 w-7 text-primary" />
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  Recently Added
                </h1>
                <p className="text-sm text-gray-600">
                  Fresh books for your library
                </p>
              </div>
            </div>

            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mb-6">
              Discover the latest additions to our collection. New books are
              added regularly for your reading pleasure.
            </p>

            <Badge variant="outline" className="text-sm px-4 py-2 bg-white">
              {totalBooks} books available
            </Badge>
          </header>

          {/* Books Content */}
          <main>
            {books.length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-white rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center shadow-sm">
                  <BookOpen className="h-16 w-16 text-gray-300" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  No recent books
                </h3>
                <p className="text-gray-600 text-lg">
                  Check back soon for new additions to our collection.
                </p>
              </div>
            ) : (
              <>
                {/* Books Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6 lg:gap-8 mb-16">
                  {books.map((book) => (
                    <BookCard
                      key={book._id}
                      book={book}
                      isAdmin={isAdmin}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>

                {/* Load More Button */}
                <LoadMoreButton
                  hasMore={hasMore}
                  isLoading={isLoadingMore}
                  onLoadMore={loadMore}
                />

                {/* End Message */}
                {!hasMore && books.length > 16 && (
                  <div className="text-center py-12">
                    <div className="bg-white rounded-2xl p-8 max-w-md mx-auto shadow-sm">
                      <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        That's all for now!
                      </h3>
                      <p className="text-gray-600">
                        You've seen all {books.length} recently added books.
                        Check back soon for more.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Back to Top Button */}
      <BackToTopButton visible={showBackToTop} />
    </Layout>
  );
};

export default RecentlyAdded;
