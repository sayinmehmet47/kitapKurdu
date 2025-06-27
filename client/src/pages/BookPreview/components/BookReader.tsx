import React, { useState } from 'react';
import {
  ArrowLeft,
  Download,
  FileText,
  Maximize,
  Minimize,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Button, Separator } from '@/components/ui';
import { downloadBook } from '@/helpers/downloadBook';

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => {
    if (zoom < 200) setZoom((prev) => prev + 25);
  };

  const handleZoomOut = () => {
    if (zoom > 50) setZoom((prev) => prev - 25);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleDownload = () => {
    downloadBook(bookUrl, bookName);
  };

  if (fileType === 'pdf') {
    return (
      <div
        className={`relative ${
          isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''
        }`}
      >
        {/* Reader Controls */}
        <div className="flex items-center justify-between p-4 bg-white border-b shadow-sm">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h3 className="font-semibold text-gray-900 truncate max-w-md">
              {bookName}
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[60px] text-center">
              {zoom}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="outline" size="sm" onClick={toggleFullscreen}>
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div
          className="relative"
          style={{
            height: isFullscreen ? 'calc(100vh - 73px)' : 'calc(100vh - 200px)',
          }}
        >
          <iframe
            src={`https://drive.google.com/viewerng/viewer?embedded=true&url=${encodeURIComponent(
              bookUrl
            )}`}
            className="w-full h-full border-0"
            title={`PDF reader for ${bookName}`}
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left',
            }}
          />
        </div>
      </div>
    );
  }

  // Fallback for non-PDF files
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <Button variant="outline" className="mb-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Book Details
        </Button>

        <FileText className="h-16 w-16 mx-auto text-gray-400 mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Preview Not Available
        </h2>
        <p className="text-gray-600 mb-6">
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
