import React from 'react';
import { LoadingSpinner } from '@/components/ui';

export const LoadingState: React.FC = () => {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <LoadingSpinner size={48} />
    </div>
  );
};
