import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Download,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { downloadBook } from '@/helpers/downloadBook';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PdfReaderProps {
  bookUrl: string;
  bookName: string;
  onBack: () => void;
}

export const PdfReader: FC<PdfReaderProps> = ({
  bookUrl,
  bookName,
  onBack,
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1); // 100% by default
  const [loadError, setLoadError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(
    typeof window !== 'undefined' ? Math.min(window.innerWidth, 1024) : 800
  );

  const isMobile =
    typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const isContinuous = isMobile;

  const onDocumentLoadSuccess = useCallback((pdf: { numPages: number }) => {
    setNumPages(pdf.numPages);
    setPageNumber(1);
  }, []);

  const handleZoomIn = useCallback(
    () => setZoom((z) => Math.min(z + 0.2, 3)),
    []
  );
  const handleZoomOut = useCallback(
    () => setZoom((z) => Math.max(z - 0.2, 0.6)),
    []
  );
  const canGoPrev = useMemo(() => pageNumber > 1, [pageNumber]);
  const canGoNext = useMemo(
    () => pageNumber < numPages,
    [pageNumber, numPages]
  );

  const goPrev = useCallback(() => {
    if (canGoPrev) setPageNumber((p) => p - 1);
  }, [canGoPrev]);

  const goNext = useCallback(() => {
    if (canGoNext) setPageNumber((p) => p + 1);
  }, [canGoNext]);

  const handleDownload = useCallback(
    () => downloadBook(bookUrl, bookName),
    [bookUrl, bookName]
  );

  // Track container width to fit page to viewport
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const w = containerRef.current.getBoundingClientRect().width;
        setContainerWidth(w);
      } else if (typeof window !== 'undefined') {
        setContainerWidth(window.innerWidth);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Simple swipe gestures for paged mode on touch devices
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 0.6}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-sm w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
          >
            <Plus className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-2" />

          <Button
            variant="outline"
            size="sm"
            onClick={goPrev}
            disabled={!canGoPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            {pageNumber} / {numPages || '-'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goNext}
            disabled={!canGoNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-2" />

          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Viewer */}
      <div
        ref={containerRef}
        className="w-full h-[calc(100vh-64px)] overflow-auto flex items-start justify-center bg-muted/20"
        onTouchStart={!isContinuous ? onTouchStart : undefined}
        onTouchEnd={!isContinuous ? onTouchEnd : undefined}
      >
        <div className="py-6">
          <Document
            file={bookUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(err) =>
              setLoadError(err?.message || 'Failed to load PDF')
            }
            loading={
              <div className="p-8 text-sm text-muted-foreground">
                Loading PDF…
              </div>
            }
            error={
              <div className="p-8 text-sm text-red-500">
                {loadError || 'Unable to display PDF. Try downloading instead.'}
              </div>
            }
            onSourceError={(err) =>
              setLoadError(err?.message || 'Failed to fetch PDF')
            }
          >
            {isContinuous ? (
              // Continuous scroll mode for mobile
              Array.from({ length: numPages || 0 }, (_, i) => (
                <div key={i + 1} className="mb-4 flex justify-center">
                  <Page
                    pageNumber={i + 1}
                    width={Math.min(1200, containerWidth - 24) * zoom}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                  />
                </div>
              ))
            ) : (
              // Paged mode with swipe on touch
              <Page
                pageNumber={pageNumber}
                width={Math.min(1200, containerWidth - 24) * zoom}
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            )}
          </Document>
        </div>
      </div>
    </div>
  );
};

export default PdfReader;
