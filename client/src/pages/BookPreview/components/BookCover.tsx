import React from 'react';
import { BookOpen, Download, Share2, Bookmark, Heart } from 'lucide-react';
import { Button, Card, CardContent, Separator } from '@/components/ui';

interface BookCoverProps {
  bookName: string;
  bookCoverUrl: string;
  onStartReading: () => void;
  onDownload: () => void;
  onShare: () => void;
}

export const BookCover: React.FC<BookCoverProps> = ({
  bookName,
  bookCoverUrl,
  onStartReading,
  onDownload,
  onShare,
}) => {
  return (
    <Card className="overflow-hidden shadow-xl">
      <div className="aspect-[2/3] relative">
        <img
          src={bookCoverUrl}
          alt={bookName}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = 'https://images.pexels.com/photos/8594539/pexels-photo-8594539.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
      
      <CardContent className="p-6 space-y-4">
        {/* Primary Actions */}
        <div className="space-y-3">
          <Button 
            className="w-full" 
            size="lg"
            onClick={onStartReading}
          >
            <BookOpen className="h-5 w-5 mr-2" />
            Start Reading
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={onDownload}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>

        <Separator />

        {/* Secondary Actions */}
        <div className="grid grid-cols-3 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onShare}
            className="flex items-center justify-center"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center justify-center"
          >
            <Bookmark className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center justify-center"
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
