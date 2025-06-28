import React from 'react';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';

interface ErrorStateProps {
  onGoBack: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ onGoBack }) => {
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <div className="max-w-md mx-auto">
        <BookOpen className="h-24 w-24 mx-auto text-gray-300 mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Book Not Found</h2>
        <p className="text-gray-600 mb-6">
          The book you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={onGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Books
        </Button>
      </div>
    </div>
  );
};
