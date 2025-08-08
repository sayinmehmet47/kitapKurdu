import React, { useState } from 'react';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { ReactReader } from 'react-reader';
import { Button } from '@/components/ui';
import { downloadBook } from '@/helpers/downloadBook';
import { PdfReader } from './PdfReader';

interface BookReaderProps {
  bookUrl: string;
  fileType: string;
  bookName: string;
  onBack: () => void;
}

export const BookReader: React.FC<BookReaderProps> = ({
  bookUrl,
  fileType,
  bookName,
  onBack,
}) => {
  const [location, setLocation] = useState<string | number>(0);

  const handleDownload = () => {
    downloadBook(bookUrl, bookName);
  };

  if (fileType === 'pdf') {
    return <PdfReader bookUrl={bookUrl} bookName={bookName} onBack={onBack} />;
  }

  if (fileType === 'epub') {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="flex items-center justify-between p-4 bg-background border-b shadow-sm">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h3 className="font-semibold text-foreground truncate max-w-md">
              {bookName}
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          className="relative"
          style={{
            height: 'calc(100vh - 100px)',
          }}
        >
          <ReactReader
            url={bookUrl}
            location={location}
            locationChanged={(epubcfi: string) => setLocation(epubcfi)}
            title={bookName}
            showToc={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <Button variant="outline" className="mb-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Book Details
        </Button>

        <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Preview Not Available
        </h2>
        <p className="text-muted-foreground mb-6">
          This file type ({fileType?.toUpperCase()}) can't be previewed in the
          browser.
        </p>
        <Button onClick={handleDownload} size="lg">
          <Download className="h-5 w-5 mr-2" />
          Download to Read
        </Button>
      </div>
    </div>
  );
};
