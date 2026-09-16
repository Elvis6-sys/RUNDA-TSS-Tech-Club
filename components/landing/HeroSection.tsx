"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";

/* ── Static image list (instant first paint, no API wait) ─────── */
const STATIC_IMAGES = [
  "/tss-images/runda-tss.jpg",
  "/tss-images/IMG-20241006-WA0079.jpg",
  "/tss-images/IMG-20241006-WA0047.jpg",
  "/tss-images/IMG-20241006-WA0051.jpg",
  "/tss-images/IMG-20241006-WA0050.jpg",
  "/tss-images/IMG-20241006-WA0033.jpg",
  "/tss-images/images.jpeg",
  "/tss-images/images (1).jpeg",
];

/* ── Positions for each floating image card ───────────────────── */
const FLOAT_CONFIG = [
  { x: 1,  y: 4,  w: 230, h: 155, rot: -12, dur: 7,  delay: 0,   opacity: 0.22 },
  { x: 74, y: 2,  w: 260, h: 175, rot:  8,  dur: 9,  delay: 1.2, opacity: 0.19 },
  { x: 58, y: 58, w: 210, h: 140, rot: -6,  dur: 8,  delay: 0.6, opacity: 0.20 },
  { x: 14, y: 62, w: 245, h: 165, rot:  14, dur: 11, delay: 2.0, opacity: 0.17 },
  { x: 81, y: 38, w: 220, h: 148, rot: -4,  dur: 10, delay: 0.8, opacity: 0.18 },
  { x: 34, y: 72, w: 235, h: 158, rot:  10, dur: 7,  delay: 1.8, opacity: 0.15 },
  { x: 64, y: 12, w: 195, h: 130, rot: -9,  dur: 12, delay: 3.0, opacity: 0.16 },
  { x: 41, y: 28, w: 255, h: 170, rot:  5,  dur: 9,  delay: 1.5, opacity: 0.13 },
];

/* ── Typing effect hook ───────────────────────────────────────── */
const WORDS = ["Coders.", "Innovators.", "Builders.", "Creators.", "Leaders."];

function useTyping(words: string[], speed = 80, pause = 1800) {
  const [text, setText] = useState("");
  const [wi, setWi] = useState(0);
  const [ci, setCi] = useState(0);
  const [del, setDel] = useState(false);

  useEffect(() => {
    const word = words[wi];
    let t: ReturnType<typeof setTimeout>;
    if (!del && ci <= word.length) {
      t = setTimeout(() => { setText(word.slice(0, ci)); setCi(c => c + 1); }, speed);
    } else if (!del && ci > word.length) {
      t = setTimeout(() => setDel(true), pause);
    } else if (del && ci >= 0) {
      t = setTimeout(() => { setText(word.slice(0, ci)); setCi(c => c - 1); }, speed / 2);
    } else {
      setDel(false);
      setWi(i => (i + 1) % words.length);
      setCi(0);
    }
    return () => clearTimeout(t);
  }, [ci, del, wi, words, speed, pause]);

  return text;
}

/* ── Particle canvas ──────────────────────────────────────────── */
function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const dots = Array.from({ length: 70 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      a: Math.random() * 0.4 + 0.1,
    }));

    const draw = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const d of dots) {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > canvas.width)  d.vx *= -1;
        if (d.y < 0 || d.y > canvas.height) d.vy *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56,189,248,${d.a})`;
        ctx.fill();
      }
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(56,189,248,${0.06 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full pointer-events-none z-[4] opacity-55"
    />
  );
}

/* ── Crossfade full-screen blurred background ─────────────────── */
function CrossfadeLayer({ images }: { images: string[] }) {
  const [cur, setCur] = useState(0);
  const [nxt, setNxt] = useState(1);
  const [fading, setFading] = useState(false);

  const advance = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      setCur(c => (c + 1) % images.length);
      setNxt(n => (n + 1) % images.length);
      setFading(false);
    }, 1600);
  }, [images.length]);

  useEffect(() => {
    if (images.length < 2) return;
    const id = setInterval(advance, 5500);
    return () => clearInterval(id);
  }, [images.length, advance]);

  if (!images.length) return null;

  return (
    <div className="absolute inset-0 z-[1] pointer-events-none">
      {/* Current image */}
      <div
        className="absolute inset-0 transition-opacity duration-[1600ms]"
        style={{ opacity: fading ? 0 : 0.10 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[cur]}
          alt=""
          aria-hidden
          className="w-full h-full object-cover"
          style={{ filter: "blur(55px) saturate(1.8) brightness(0.45)" }}
        />
      </div>
      {/* Next image (fades in while current fades out) */}
      <div
        className="absolute inset-0 transition-opacity duration-[1600ms]"
        style={{ opacity: fading ? 0.10 : 0 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[nxt]}
          alt=""
          aria-hidden
          className="w-full h-full object-cover"
          style={{ filter: "blur(55px) saturate(1.8) brightness(0.45)" }}
        />
      </div>
    </div>
  );
}

/* ── Floating rotated image cards ─────────────────────────────── */
function FloatingImages({ images }: { images: string[] }) {
  return (
    <div className="absolute inset-0 z-[2] overflow-hidden pointer-events-none">
      {images.slice(0, FLOAT_CONFIG.length).map((src, i) => {
        const c = FLOAT_CONFIG[i];
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${c.x}%`,
              top: `${c.y}%`,
              width: `${c.w}px`,
              height: `${c.h}px`,
            }}
          >
            {/* Float animation wrapper */}
            <div
              className="w-full h-full"
              style={{
                animation: `bgFloat ${c.dur}s ease-in-out ${c.delay}s infinite alternate`,
              }}
            >
              {/* Rotate animation wrapper */}
              <div
                className="w-full h-full"
                style={{
                  transform: `rotate(${c.rot}deg)`,
                  transition: "transform 0.3s ease",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  aria-hidden
                  className="w-full h-full object-cover rounded-2xl"
                  style={{
                    opacity: c.opacity,
                    filter: "blur(1px) saturate(1.5) brightness(0.70)",
                    boxShadow: "0 12px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
                  }}
                />
                {/* Tint overlay per card */}
                <div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background:
                      i % 2 === 0
                        ? "linear-gradient(135deg, rgba(14,165,233,0.12) 0%, transparent 100%)"
                        : "linear-gradient(135deg, rgba(139,92,246,0.10) 0%, transparent 100%)",
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Marquee badges ───────────────────────────────────────────── */
const BADGES = [
  "🇷🇼 Made for Rwanda", "⚡ Offline-Ready PWA", "🎓 RQF Aligned",
  "🌐 Bilingual EN/RW",  "🔒 Role-Gated Access", "📡 USSD Support",
  "🏆 XP & Passport",    "🎙️ Live Audio Sessions",
];

/* ── Main HeroSection ─────────────────────────────────────────── */
export default function HeroSection() {
  const typed   = useTyping(WORDS);
  const [ready, setReady]   = useState(false);
  const [images, setImages] = useState<string[]>(STATIC_IMAGES);

  useEffect(() => {
    setReady(true);
    fetch("/api/media")
      .then(r => r.json())
      .then((data: string[]) => { if (data.length > 0) setImages(data); })
      .catch(() => {});
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

      {/* ── Z0 · solid base ───────────────────────────────── */}
      <div className="absolute inset-0 bg-slate-950 z-0" />

      {/* ── Z1 · crossfade blurred full-screen image ──────── */}
      {ready && <CrossfadeLayer images={images} />}

      {/* ── Z2 · floating rotated image cards ────────────── */}
      {ready && <FloatingImages images={images} />}

      {/* ── Z3 · overlay gradient vignette ───────────────── */}
      <div className="absolute inset-0 z-[3] pointer-events-none">
        {/* Radial centre vignette — keeps text readable */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 20%, rgba(2,6,23,0.75) 65%, rgba(2,6,23,0.97) 100%)",
          }}
        />
        {/* Edge fades */}
        <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-slate-950 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-52 bg-gradient-to-t from-slate-950 to-transparent" />
        <div className="absolute inset-y-0 left-0  w-28 bg-gradient-to-r from-slate-950 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-slate-950 to-transparent" />
        {/* Dot grid */}
        <div className="absolute inset-0 bg-hero-grid bg-grid opacity-35" />
        {/* Cyan radial glow */}
        <div className="absolute inset-0 bg-radial-glow opacity-40" />
      </div>

      {/* ── Z4 · colour orbs ──────────────────────────────── */}
      <div className="absolute inset-0 z-[4] pointer-events-none overflow-hidden">
        <div
          className="orb animate-orb-drift"
          style={{
            background: "radial-gradient(circle, rgba(56,189,248,0.50), transparent 70%)",
            width: "600px", height: "600px", top: "-160px", left: "-130px",
          }}
        />
        <div
          className="orb animate-orb-drift-2"
          style={{
            background: "radial-gradient(circle, rgba(168,85,247,0.40), transparent 70%)",
            width: "480px", height: "480px", top: "20%", left: "62%",
          }}
        />
        <div
          className="orb animate-orb-drift-3"
          style={{
            background: "radial-gradient(circle, rgba(34,211,238,0.35), transparent 70%)",
            width: "360px", height: "360px", top: "60%", left: "4%",
          }}
        />
      </div>

      {/* ── Z5 · particle network canvas ─────────────────── */}
      <ParticleCanvas />

      {/* ── Z10 · foreground content ──────────────────────── */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-5xl mx-auto w-full">

        {/* Pill badge */}
        <div
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-sky-300 backdrop-blur-sm"
          style={{
            opacity: ready ? 1 : 0,
            transform: ready ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s",
          }}
        >
          <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
          Rwanda TVET Tech Club · Runda TSS
        </div>

        {/* Headline */}
        <h1
          style={{
            opacity: ready ? 1 : 0,
            transform: ready ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.7s ease 0.25s, transform 0.7s ease 0.25s",
          }}
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight"
        >
          <span className="block text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.9)]">
            We are Rwanda&apos;s
          </span>
          <span className="block gradient-text mt-2 min-h-[1.2em] drop-shadow-[0_2px_20px_rgba(56,189,248,0.35)]">
            {typed}
            <span className="animate-blink ml-0.5 text-sky-400">|</span>
          </span>
        </h1>

        {/* Sub-headline */}
        <p
          style={{
            opacity: ready ? 1 : 0,
            transform: ready ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.7s ease 0.4s, transform 0.7s ease 0.4s",
          }}
          className="mt-6 max-w-2xl text-lg sm:text-xl text-slate-300 leading-relaxed drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]"
        >
          A full-stack learning platform built for TVET students at Runda TSS — featuring
          structured curricula, competency passports, live mentoring, and offline-first
          access so no student is left behind.
        </p>

        {/* CTA buttons */}
        <div
          style={{
            opacity: ready ? 1 : 0,
            transform: ready ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.7s ease 0.55s, transform 0.7s ease 0.55s",
          }}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/auth/register"
            className="btn-shimmer group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-sky-500/40 transition-all duration-300 hover:shadow-sky-500/60 hover:scale-105 animate-glow"
          >
            Apply to Join
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
            </svg>
          </Link>
          <Link
            href="/auth/login"
            className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-8 py-4 text-sm font-bold text-slate-100 backdrop-blur-md transition-all duration-300 hover:border-sky-400/60 hover:bg-white/10 hover:scale-105"
          >
            <svg className="w-4 h-4 text-slate-400 group-hover:text-sky-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H3m12 0l-4-4m4 4l-4 4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Member Login
          </Link>
        </div>

        {/* Trust meta line */}
        <p
          style={{
            opacity: ready ? 1 : 0,
            transition: "opacity 0.7s ease 0.7s",
          }}
          className="mt-5 text-xs text-slate-500"
        >
          Free to join · RQF Level 3 / 4 / 5 · English &amp; Kinyarwanda
        </p>

        {/* Live photo thumbnail strip */}
        {ready && images.length > 0 && (
          <div
            style={{
              opacity: ready ? 1 : 0,
              transform: ready ? "translateY(0)" : "translateY(16px)",
              transition: "opacity 0.7s ease 0.9s, transform 0.7s ease 0.9s",
            }}
            className="mt-12 flex items-center gap-3 justify-center flex-wrap"
          >
            {images.slice(0, 5).map((src, i) => {
              const rots = [-3, 2, -2, 3, -1];
              return (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-xl ring-1 ring-white/10 hover:ring-sky-400/60 hover:scale-110 transition-all duration-300 shadow-lg shadow-black/60 cursor-pointer"
                  style={{
                    width: "58px",
                    height: "42px",
                    transform: `rotate(${rots[i] ?? 0}deg)`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt="TSS student"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              );
            })}
            {images.length > 5 && (
              <span className="text-xs text-slate-500 font-semibold ml-1">
                +{images.length - 5} photos
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Scroll indicator ──────────────────────────────── */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 opacity-50 animate-float-slow">
        <span className="text-[9px] uppercase tracking-widest text-slate-500">scroll</span>
        <div className="w-5 h-8 rounded-full border border-slate-600 flex items-start justify-center p-1">
          <div className="w-1 h-2 rounded-full bg-sky-400 animate-bounce" />
        </div>
      </div>

      {/* ── Marquee strip ─────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-slate-800/60 bg-slate-950/80 backdrop-blur-sm py-2.5 overflow-hidden">
        <div className="marquee-inner">
          {[...BADGES, ...BADGES].map((b, i) => (
            <span
              key={i}
              className="mx-6 whitespace-nowrap text-xs font-semibold text-slate-400 flex items-center gap-2"
            >
              {b}
              <span className="text-slate-700">·</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
