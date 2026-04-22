import { useState, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Download } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { textbookPageInfo } from '@/data/textbookContent';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  initialPage?: number;
  subject?: string;
}

const toRoman = (num: number): string => {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (num >= vals[i]) {
      result += syms[i];
      num -= vals[i];
    }
  }
  return result.toLowerCase();
};

const PdfViewer = ({ url, initialPage = 1, subject }: PdfViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [scale, setScale] = useState(1.0);
  const [containerWidth, setContainerWidth] = useState(400);
  const [pageInputValue, setPageInputValue] = useState('');
  const [isEditingPage, setIsEditingPage] = useState(false);

  // Finger-drag state
  const dragX = useMotionValue(0);
  const isDragging = useRef(false);
  const containerWidthRef = useRef(400);
  // Slight opacity dim while dragging far
  const opacity = useTransform(dragX, [-300, 0, 300], [0.6, 1, 0.6]);

  const frontMatter = subject ? (textbookPageInfo[subject]?.frontMatter || 0) : 0;

  const getPageLabel = (pdfPage: number): string => {
    if (pdfPage <= frontMatter) return toRoman(pdfPage);
    return String(pdfPage - frontMatter);
  };

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(Math.min(initialPage, numPages));
  }, [initialPage]);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const observer = new ResizeObserver((entries) => {
        const w = entries[0].contentRect.width;
        setContainerWidth(w);
        containerWidthRef.current = w;
      });
      observer.observe(node);
      setContainerWidth(node.clientWidth);
      containerWidthRef.current = node.clientWidth;
    }
  }, []);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= numPages) {
      setPageNumber(page);
      // reset drag position for new page
      dragX.set(0);
    }
  };

  const handlePageInputSubmit = () => {
    const parsed = parseInt(pageInputValue);
    if (!isNaN(parsed)) {
      const pdfPage = parsed + frontMatter;
      if (pdfPage >= 1 && pdfPage <= numPages) {
        goToPage(pdfPage);
      }
    }
    setIsEditingPage(false);
    setPageInputValue('');
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${subject || 'textbook'}_Grade9.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch {
      try {
        window.open(url, '_blank');
      } catch {
        alert('Please allow downloads to save this PDF.');
      }
    }
  };

  // Animate dragX back to a target with spring, then commit page change
  const settleTo = (target: number, nextPage?: number) => {
    animate(dragX, target, {
      type: 'spring',
      stiffness: 350,
      damping: 35,
      onComplete: () => {
        if (nextPage !== undefined) {
          setPageNumber(nextPage);
          dragX.set(0);
        }
      },
    });
  };

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }
  ) => {
    isDragging.current = false;
    if (scale > 1) {
      // zoomed: don't change pages
      animate(dragX, 0, { type: 'spring', stiffness: 400, damping: 40 });
      return;
    }
    const w = containerWidthRef.current || 400;
    const dx = info.offset.x;
    const vx = info.velocity.x;

    // Threshold: 25% of width OR fast flick (>500 px/s)
    const threshold = w * 0.25;
    const flick = Math.abs(vx) > 500;

    if ((dx < -threshold || (flick && vx < 0)) && pageNumber < numPages) {
      // Next page — slide content fully out left, then commit
      settleTo(-w, pageNumber + 1);
    } else if ((dx > threshold || (flick && vx > 0)) && pageNumber > 1) {
      // Prev page — slide fully right
      settleTo(w, pageNumber - 1);
    } else {
      // Snap back
      animate(dragX, 0, { type: 'spring', stiffness: 400, damping: 40 });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Controls bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-card border-b border-border shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => goToPage(pageNumber - 1)}
            disabled={pageNumber <= 1}
            className="p-2 rounded-lg bg-muted disabled:opacity-30 active:bg-accent transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1 px-2">
            {isEditingPage ? (
              <input
                type="number"
                value={pageInputValue}
                onChange={(e) => setPageInputValue(e.target.value)}
                onBlur={handlePageInputSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handlePageInputSubmit()}
                className="w-14 text-sm font-medium text-center bg-muted rounded-md px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
                placeholder={getPageLabel(pageNumber)}
              />
            ) : (
              <button
                onClick={() => { setIsEditingPage(true); setPageInputValue(getPageLabel(pageNumber)); }}
                className="text-sm font-medium min-w-[2rem] text-center hover:bg-muted rounded px-1 py-0.5 transition-colors"
              >
                {getPageLabel(pageNumber)}
              </button>
            )}
            <span className="text-xs text-muted-foreground">/ {numPages - frontMatter}</span>
          </div>
          <button
            onClick={() => goToPage(pageNumber + 1)}
            disabled={pageNumber >= numPages}
            className="p-2 rounded-lg bg-muted disabled:opacity-30 active:bg-accent transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
            className="p-2 rounded-lg bg-muted active:bg-accent transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale(s => Math.min(3, s + 0.25))}
            className="p-2 rounded-lg bg-muted active:bg-accent transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setScale(1.0)}
            className="p-2 rounded-lg bg-muted active:bg-accent transition-colors"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
          <button
            onClick={handleDownloadPdf}
            className="p-2 rounded-lg bg-primary/20 active:bg-primary/30 transition-colors ml-1"
            title="Download PDF"
          >
            <Download className="w-4 h-4 text-primary" />
          </button>
        </div>
      </div>

      {/* PDF content with finger-drag swipe */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative"
        style={{ touchAction: scale > 1 ? 'pan-x pan-y pinch-zoom' : 'pan-y' }}
      >
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
              />
            </div>
          }
          error={
            <div className="text-center py-20 px-4">
              <p className="text-destructive text-sm">Failed to load PDF.</p>
              <p className="text-muted-foreground text-xs mt-1">Make sure the file exists in textbooks folder.</p>
            </div>
          }
        >
          <motion.div
            drag={scale > 1 ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            dragMomentum={false}
            onDragStart={() => { isDragging.current = true; }}
            onDragEnd={handleDragEnd}
            style={{ x: dragX, opacity }}
            className="h-full overflow-auto flex justify-center will-change-transform"
          >
            <Page
              pageNumber={pageNumber}
              width={containerWidth * scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </motion.div>
        </Document>
      </div>
    </div>
  );
};

export default PdfViewer;
