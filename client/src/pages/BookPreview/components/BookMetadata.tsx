import React from 'react';
import { Calendar, FileText } from 'lucide-react';
import { Card, CardHeader, CardContent, Badge } from '@/components/ui';
import { Book } from '@/models/book.model';

interface BookMetadataProps {
  book: Book;
}

export const BookMetadata: React.FC<BookMetadataProps> = ({ book }) => {
  const formatFileSize = (bytes: number): string => {
    return `${Math.round(bytes / 1024 / 1024)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Book Details</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {book.size && (
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600">File Size</p>
                <p className="font-semibold">{formatFileSize(book.size)}</p>
              </div>
            </div>
          )}

          {book.date && (
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Added</p>
                <p className="font-semibold">{formatDate(book.date)}</p>
              </div>
            </div>
          )}

          {book.category && book.category.length > 0 && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600 mb-2">Categories</p>
              <div className="flex flex-wrap gap-2">
                {book.category.map((category, index) => (
                  <Badge key={index} variant="secondary">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
