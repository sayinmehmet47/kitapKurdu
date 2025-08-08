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
  const pagesContainerRef = useRef<HTMLDivElement | null>(null);

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

  // Persist last read page per book locally
  useEffect(() => {
    try {
      const key = `pdf-progress:${bookUrl}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved) as { pageNumber: number };
        if (parsed?.pageNumber && parsed.pageNumber > 0) {
          setPageNumber(parsed.pageNumber);
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookUrl]);

  useEffect(() => {
    try {
      const key = `pdf-progress:${bookUrl}`;
      localStorage.setItem(key, JSON.stringify({ pageNumber }));
    } catch {}
  }, [bookUrl, pageNumber]);

  // Simple swipe gestures for paged mode on touch devices
  const touchStartX = useRef<number | null>(null);
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartZoom = useRef<number>(1);
  const lastTapRef = useRef<number>(0);
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t0 = e.touches.item(0);
      if (t0) touchStartX.current = t0.clientX;
    }
    if (e.touches.length === 2) {
      const t0 = e.touches.item(0);
      const t1 = e.touches.item(1);
      if (t0 && t1) {
        const dx = t0.clientX - t1.clientX;
        const dy = t0.clientY - t1.clientY;
        pinchStartDist.current = Math.hypot(dx, dy);
        pinchStartZoom.current = zoom;
      }
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDist.current) {
      const t0 = e.touches.item(0);
      const t1 = e.touches.item(1);
      if (t0 && t1) {
        const dx = t0.clientX - t1.clientX;
        const dy = t0.clientY - t1.clientY;
        const dist = Math.hypot(dx, dy);
        const factor = dist / pinchStartDist.current;
        const next = Math.min(
          3,
          Math.max(
            0.6,
            parseFloat((pinchStartZoom.current * factor).toFixed(2))
          )
        );
        setZoom(next);
        e.preventDefault();
      }
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    // Double-tap to toggle zoom
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setZoom((z) => (z <= 1 ? 2 : 1));
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;

    if (touchStartX.current != null) {
      const dx = e.changedTouches[0]?.clientX - touchStartX.current;
      if (Math.abs(dx) > 50) {
        if (dx < 0) goNext();
        else goPrev();
      }
      touchStartX.current = null;
    }
    pinchStartDist.current = null;
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
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="py-6" ref={pagesContainerRef}>
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
                <div
                  key={i + 1}
                  id={`pdf-page-${i + 1}`}
                  className="mb-4 flex justify-center"
                >
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

      {/* Mobile floating page indicator */}
      {isMobile && numPages > 0 && (
        <div className="fixed top-3 right-3 z-[60] bg-black/70 text-white text-xs px-2 py-1 rounded">
          {pageNumber} / {numPages}
        </div>
      )}

      {/* Mobile bottom toolbar */}
      {isMobile && (
        <div className="fixed inset-x-0 bottom-0 z-[60] bg-background/95 border-t p-2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {!isContinuous && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={goPrev}
                disabled={!canGoPrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goNext}
                disabled={!canGoNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Page slider */}
          <input
            type="range"
            min={1}
            max={Math.max(1, numPages)}
            value={pageNumber}
            onChange={(e) => {
              const next = Number(e.target.value);
              setPageNumber(next);
              if (isContinuous) {
                // Scroll to the selected page container
                const el = document.getElementById(`pdf-page-${next}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(1)}
            title="Fit to width"
          >
            100%
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 0.6}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default PdfReader;
