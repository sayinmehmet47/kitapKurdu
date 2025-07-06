import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  layout?: 'pagination' | 'table';
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  layout = 'pagination',
  className,
}) => {
  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current page
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number | string) => {
    if (typeof page === 'number') {
      onPageChange(page);
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div
      className={cn('flex items-center justify-center space-x-2', className)}
    >
      {/* Previous Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="flex items-center gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>

      {/* Page Numbers */}
      <div className="flex items-center space-x-1">
        {generatePageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-3 py-2 text-gray-500">...</span>
            ) : (
              <Button
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePageClick(page)}
                className={cn(
                  'min-w-[40px]',
                  currentPage === page && 'bg-primary text-primary-foreground'
                )}
              >
                {page}
              </Button>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Next Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="flex items-center gap-2"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Legacy interface for backward compatibility
export interface LegacyPaginationProps {
  previous: {
    page: number;
  };
  next: {
    page: number;
  };
  setPage: (page: number) => void;
}

export const LegacyPagination: React.FC<LegacyPaginationProps> = ({
  previous,
  next,
  setPage,
}) => {
  const onPreviousClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setPage(previous.page);
  };

  const onNextClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setPage(next.page);
  };

  return (
    <div className="mt-2 flex gap-2 items-center justify-center pb-4">
      <Button onClick={onPreviousClick} disabled={!previous} variant="outline">
        ⬅ Previous
      </Button>
      <Button onClick={onNextClick} disabled={!next} variant="outline">
        NextPage ➡
      </Button>
    </div>
  );
};
