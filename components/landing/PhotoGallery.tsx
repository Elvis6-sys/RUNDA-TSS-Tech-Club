"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/* ── Lightbox ─────────────────────────────────────────────────── */
function Lightbox({
  images,
  index,
  onClose,
}: {
  images: string[];
  index: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(index);

  const prev = useCallback(() => setCurrent((c) => (c - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % images.length), [images.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  return (
    <div
      className="lightbox-backdrop"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-white/10 hover:bg-white/20 p-2 text-white transition"
        aria-label="Close"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Prev */}
      <button
        onClick={(e) => { e.stopPropagation(); prev(); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/10 hover:bg-white/20 p-3 text-white transition"
        aria-label="Previous"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Image */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl max-h-[85vh] w-full px-16"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[current]}
          alt={`TSS photo ${current + 1}`}
          className="w-full h-full object-contain rounded-2xl shadow-2xl"
          style={{ maxHeight: "80vh" }}
        />
        {/* Counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 rounded-full px-4 py-1 text-xs text-white/80 font-semibold">
          {current + 1} / {images.length}
        </div>
      </div>

      {/* Next */}
      <button
        onClick={(e) => { e.stopPropagation(); next(); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/10 hover:bg-white/20 p-3 text-white transition"
        aria-label="Next"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

/* ── Main gallery ─────────────────────────────────────────────── */
export default function PhotoGallery() {
  const [images, setImages] = useState<string[]>([]);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch images from API
  useEffect(() => {
    fetch("/api/media")
      .then((r) => r.json())
      .then((data: string[]) => { setImages(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Auto-slide
  useEffect(() => {
    if (images.length < 2) return;
    autoRef.current = setInterval(() => {
      setActiveIdx((i) => (i + 1) % images.length);
    }, 4000);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [images.length]);

  const goTo = (i: number) => {
    if (autoRef.current) clearInterval(autoRef.current);
    setActiveIdx(i);
  };

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Section divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />

      <div className="container">
        {/* Heading */}
        <div className="text-center mb-12">
          <span className="level-pill bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3">
            📸 Our Community
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Life at <span className="gradient-text-green">Runda TSS</span>
          </h2>
          <p className="mt-3 text-slate-400 max-w-xl mx-auto">
            Real moments from our coding sessions, demo days, and tech events.
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && images.length === 0 && (
          <div className="text-center text-slate-500 py-12">No images found.</div>
        )}

        {!loading && images.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* ── Featured / active image ───────────────────── */}
            <div
              className="relative lg:w-2/3 rounded-3xl overflow-hidden cursor-zoom-in shadow-2xl group"
              style={{ aspectRatio: "16/10" }}
              onClick={() => setLightboxIdx(activeIdx)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[activeIdx]}
                alt={`TSS photo ${activeIdx + 1}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <div>
                  <span className="text-white font-bold text-sm">Runda TSS Tech Club</span>
                  <p className="text-slate-300 text-xs mt-0.5">Click to view full size</p>
                </div>
                <span className="rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs text-white/80">
                  {activeIdx + 1} / {images.length}
                </span>
              </div>
              {/* Expand icon */}
              <div className="absolute top-4 right-4 rounded-full bg-black/40 backdrop-blur p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
                </svg>
              </div>
            </div>

            {/* ── Thumbnail strip ───────────────────────────── */}
            <div className="lg:w-1/3 flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto pb-2 lg:pb-0 lg:max-h-[400px] scrollbar-hide">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`flex-shrink-0 relative rounded-2xl overflow-hidden transition-all duration-300 ${
                    i === activeIdx
                      ? "ring-2 ring-sky-400 shadow-lg shadow-sky-500/30 scale-100"
                      : "opacity-60 hover:opacity-90 hover:scale-[1.02]"
                  }`}
                  style={{ width: "120px", height: "80px", minWidth: "120px" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  {i === activeIdx && (
                    <div className="absolute inset-0 bg-sky-500/10" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === activeIdx
                    ? "w-6 h-2 bg-sky-400"
                    : "w-2 h-2 bg-slate-600 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox
          images={images}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </section>
  );
}
