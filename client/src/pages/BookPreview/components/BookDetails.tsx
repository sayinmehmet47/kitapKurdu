import React from 'react';
import { Star, User, Languages, FileText } from 'lucide-react';
import { Card, CardHeader, Badge } from '@/components/ui';
import { Book } from '@/models/book.model';

interface BookDetailsProps {
  book: Book;
  fileType: string;
}

export const BookDetails: React.FC<BookDetailsProps> = ({ book, fileType }) => {
  return (
    <Card>
      <CardHeader>
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {book.name}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              {book.uploader?.username && (
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {book.uploader.username}
                </div>
              )}
              {book.language && (
                <Badge variant="outline">
                  <Languages className="h-3 w-3 mr-1" />
                  {book.language}
                </Badge>
              )}
              <Badge variant="outline">
                <FileText className="h-3 w-3 mr-1" />
                {fileType?.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="h-4 w-4 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              4.8 (124 reviews)
            </span>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};
