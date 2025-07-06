import React from 'react';
import { Plus } from 'lucide-react';
import { Button, LoadingSpinner } from '@/components/ui';

interface LoadMoreButtonProps {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

export const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({
  hasMore,
  isLoading,
  onLoadMore,
}) => {
  if (!hasMore) {
    return null;
  }

  return (
    <div className="flex justify-center">
      <Button
        onClick={onLoadMore}
        disabled={isLoading}
        size="lg"
        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-300 px-8 py-4 rounded-2xl font-medium"
      >
        {isLoading ? (
          <>
            <LoadingSpinner size={20} className="mr-2" />
            <span>Loading more books...</span>
          </>
        ) : (
          <>
            <Plus className="h-5 w-5 mr-2" />
            Load More Books
          </>
        )}
      </Button>
    </div>
  );
};
