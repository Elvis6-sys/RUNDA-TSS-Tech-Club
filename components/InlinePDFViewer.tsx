"use client";

interface InlinePDFViewerProps {
  url: string;
  title?: string;
}

export default function InlinePDFViewer({ url, title }: InlinePDFViewerProps) {
  // Use our custom PDF viewer HTML page
  const viewerUrl = `/pdf-viewer.html?file=${encodeURIComponent(url)}`;

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      {title && (
        <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-sm text-slate-300 font-semibold truncate flex-1">
            📄 {title}
          </h2>
          <a
            href={url}
            download={title || 'document.pdf'}
            className="ml-4 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-semibold transition"
            title="Download PDF"
          >
            ⬇️ Download
          </a>
        </div>
      )}

      {/* Custom PDF Viewer in iframe */}
      <iframe
        src={viewerUrl}
        className="flex-1 w-full border-0"
        title={title || 'PDF Viewer'}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '600px',
          border: 'none',
          background: '#1e293b',
        }}
      />

      {/* Status bar */}
      <div className="px-4 py-2 bg-slate-800 border-t border-slate-700 text-xs text-slate-500 flex justify-between items-center">
        <span>PDF.js Custom Viewer • Full Rendering</span>
        <span className="font-mono truncate max-w-md">{title || url.split('/').pop()?.substring(0, 50)}</span>
      </div>
    </div>
  );
}
