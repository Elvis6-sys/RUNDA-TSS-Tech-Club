"use client";

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { trackReading } from '@/lib/xapi-service';

/**
 * PDFViewer with automatic xAPI tracking
 * Tracks reading progress, time spent, completion
 */

type PDFViewerProps = {
  pdfUrl: string;
  documentId: string;
  documentTitle: string;
  moduleCode?: string;
  onComplete?: () => void;
};

export default function PDFViewer({
  pdfUrl,
  documentId,
  documentTitle,
  moduleCode,
  onComplete
}: PDFViewerProps) {
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [progress, setProgress] = useState(0);
  const [hasTrackedCompletion, setHasTrackedCompletion] = useState(false);

  const startTimeRef = useRef(Date.now());
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fetch current user on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setCurrentUser({
            id: data.user.id,
            name: data.user.name || 'Unknown',
            email: data.user.email || ''
          });
        }
      })
      .catch(err => console.error('Failed to fetch user:', err));
  }, []);

  useEffect(() => {
    // Calculate progress
    const newProgress = (currentPage / totalPages) * 100;
    setProgress(newProgress);

    // Track completion at 90%
    if (newProgress >= 90 && !hasTrackedCompletion) {
      handleCompletion();
    }

    // Track progress periodically
    const interval = setInterval(() => {
      trackProgress(false);
    }, 30000); // Every 30 seconds

    return () => {
      clearInterval(interval);
      trackProgress(false);
    };
  }, [currentPage, totalPages, hasTrackedCompletion]);

  const trackProgress = async (completed: boolean) => {
    if (!currentUser) return;

    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

    try {
      await trackReading({
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        documentId,
        documentTitle,
        moduleCode,
        duration,
        progress: Math.floor(progress),
        completed
      });
    } catch (error) {
      console.error('[PDFViewer] Track error:', error);
    }
  };

  const handleCompletion = async () => {
    if (hasTrackedCompletion) return;

    setHasTrackedCompletion(true);
    await trackProgress(true);
    onComplete?.();
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 10, 50));
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-300 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress */}
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-gray-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-600">{Math.floor(progress)}%</span>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1 border-l pl-3">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm w-12 text-center">{zoom}%</span>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Download */}
          <a
            href={pdfUrl}
            download
            className="p-2 hover:bg-gray-100 rounded border-l pl-3"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto p-4">
        <iframe
          ref={iframeRef}
          src={`${pdfUrl}#page=${currentPage}`}
          className="w-full h-full border-0 rounded shadow-lg"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          title={documentTitle}
          onLoad={(e) => {
            // Try to detect total pages (not always possible with PDFs)
            // This is a simplified approach
            setTotalPages(10); // Placeholder - real implementation would need PDF.js
          }}
        />
      </div>
    </div>
  );
}
