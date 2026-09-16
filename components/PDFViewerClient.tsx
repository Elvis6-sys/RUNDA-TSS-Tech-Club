"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, ZoomIn, ZoomOut, Maximize } from "lucide-react";

export default function PDFViewerClient({
  pdfPath,
  moduleName,
}: {
  pdfPath: string;
  moduleName: string;
}) {
  const router = useRouter();
  const [zoom, setZoom] = useState(100);
  const pdfUrl = `/api/curriculum/pdf?path=${encodeURIComponent(pdfPath)}`;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = pdfPath.split("/").pop() || "curriculum.pdf";
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col">
      {/* Header Bar */}
      <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">{moduleName}</h1>
            <p className="text-xs text-slate-400">Curriculum Document</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="px-3 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg min-w-[70px] text-center">
            {zoom}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition ml-2"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-hidden bg-slate-900">
        <div className="w-full h-full flex items-center justify-center p-4">
          <div
            className="bg-white rounded-lg shadow-2xl overflow-hidden"
            style={{
              width: `${zoom}%`,
              height: "100%",
              maxWidth: "1200px",
            }}
          >
            {/* Use object tag for better PDF rendering in Electron */}
            <object
              data={pdfUrl}
              type="application/pdf"
              className="w-full h-full"
              title={moduleName}
            >
              {/* Fallback for browsers that don't support object tag */}
              <embed
                src={pdfUrl}
                type="application/pdf"
                className="w-full h-full"
              />
              {/* Final fallback */}
              <div className="p-8 text-center">
                <p className="text-slate-700 mb-4">
                  Unable to display PDF. Please download the file.
                </p>
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-500"
                >
                  Download PDF
                </button>
              </div>
            </object>
          </div>
        </div>
      </div>
    </div>
  );
}
