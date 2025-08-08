import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui';
import { useBookPreview } from './hooks/useBookPreview';
import { Helmet } from 'react-helmet-async';
import {
  BookReader,
  BookCover,
  BookDetails,
  BookMetadata,
  BookDescription,
  AdminActions,
  ErrorState,
  LoadingState,
} from './components';

const BookPreviewPage: React.FC = () => {
  const {
    // State
    book,
    isLoading,
    isError,
    isReading,
    isAdmin,
    fileType,

    // Computed values
    bookCoverUrl,

    // Actions
    handleDownload,
    handleShare,
    handleStartReading,
    handleStopReading,
    handleGoBack,
    handleEditBook,
  } = useBookPreview();

  // Loading State
  if (isLoading) {
    return (
      <Layout>
        <LoadingState />
      </Layout>
    );
  }

  // Error State
  if (isError || !book) {
    return (
      <Layout>
        <ErrorState onGoBack={() => handleGoBack()} />
      </Layout>
    );
  }

  // Reading Mode
  if (isReading) {
    return (
      <BookReader
        bookUrl={book.url || ''}
        fileType={fileType || ''}
        bookName={book.name}
        onBack={handleStopReading}
      />
    );
  }

  // Main Book Details Page
  return (
    <Layout>
      {book && (
        <Helmet>
          <title>{`${book.name} | Book-Worm`}</title>
          <meta name="description" content={book.description} />
          <meta property="og:title" content={`${book.name} | Book-Worm`} />
          <meta property="og:description" content={book.description} />
          <meta property="og:image" content={bookCoverUrl} />
          <meta property="og:type" content="article" />
          <meta property="og:url" content={window.location.href} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={`${book.name} | Book-Worm`} />
          <meta name="twitter:description" content={book.description} />
          <meta name="twitter:image" content={bookCoverUrl} />
        </Helmet>
      )}
      <div className="min-h-screen bg-gray-50/30 dark:bg-gray-900/30">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Back Button */}
          <Button variant="ghost" className="mb-6" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Book Cover & Quick Actions */}
            <div className="lg:col-span-1">
              <BookCover
                bookName={book.name}
                bookCoverUrl={bookCoverUrl}
                onStartReading={handleStartReading}
                onDownload={handleDownload}
                onShare={handleShare}
              />
            </div>

            {/* Book Information */}
            <div className="lg:col-span-2 space-y-6">
              <BookDetails book={book} fileType={fileType || ''} />

              <BookMetadata book={book} />

              <BookDescription description={book.description} />

              <AdminActions isAdmin={isAdmin} onEditBook={handleEditBook} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookPreviewPage;
