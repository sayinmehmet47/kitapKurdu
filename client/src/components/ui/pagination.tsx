import React from 'react';

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
    <div className="mt-2 d-flex justify-content-center">
      <button
        className="btn btn-outline-dark btn-sm"
        onClick={onPreviousClick}
        disabled={!previous}
      >
        ⬅ Previous
      </button>
      <button
        className="btn btn-outline-dark btn-sm"
        onClick={onNextClick}
        disabled={!next}
      >
        NextPage ➡
      </button>
    </div>
  );
};
