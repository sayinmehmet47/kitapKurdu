import React from 'react';
import { Button } from './button';

export interface PaginationProps {
  previous: {
    page: number;
  };
  next: {
    page: number;
  };
  setPage: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  previous,
  next,
  setPage,
}) => {
  const onPreviousClick = (e) => {
    e.preventDefault();
    setPage(previous.page);
  };

  const onNextClick = (e) => {
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
