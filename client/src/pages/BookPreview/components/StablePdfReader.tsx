import { FC, useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { downloadBook } from '@/helpers/downloadBook';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

interface StablePdfReaderProps {
  bookUrl: string;
  bookName: string;
  onBack: () => void;
}

export const StablePdfReader: FC<StablePdfReaderProps> = ({
  bookUrl,
  bookName,
  onBack,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Create plugins
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: () => [],
  });

  const handleDownload = useCallback(
    () => downloadBook(bookUrl, bookName),
    [bookUrl, bookName]
  );

  // Save and restore reading progress
  useEffect(() => {
    try {
      const key = `pdf-progress:${bookUrl}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved) as { pageNumber: number };
        if (parsed?.pageNumber && parsed.pageNumber > 0) {
          setCurrentPage(parsed.pageNumber);
        }
      }
    } catch (error) {
      console.warn('Failed to load saved progress:', error);
    }
  }, [bookUrl]);

  useEffect(() => {
    try {
      const key = `pdf-progress:${bookUrl}`;
      localStorage.setItem(key, JSON.stringify({ pageNumber: currentPage }));
    } catch (error) {
      console.warn('Failed to save progress:', error);
    }
  }, [bookUrl, currentPage]);

  const handlePageChange = (e: any) => {
    setCurrentPage(e.currentPage + 1); // react-pdf-viewer uses 0-based indexing
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-background border-b shadow-sm">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="font-semibold text-foreground truncate max-w-md">
            {bookName}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="w-full h-[calc(100vh-64px)] overflow-hidden">
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <Viewer
            fileUrl={bookUrl}
            plugins={[defaultLayoutPluginInstance]}
            onPageChange={handlePageChange}
            initialPage={currentPage - 1} // Convert to 0-based indexing
          />
        </Worker>
      </div>
    </div>
  );
};

export default StablePdfReader;