"use client";

import { useEffect, useRef, useState } from "react";

const TESTIMONIALS = [
  {
    name: "Amina Uwimana",
    role: "L4 Student · Software Development",
    avatar: "AU",
    color: "from-sky-500 to-blue-600",
    quote:
      "Before this platform, I had no way to track what I&apos;d learned. Now I have a real Skills Passport with verified competencies. It changed how I think about my own progress.",
    stars: 5,
  },
  {
    name: "Jean-Pierre Habimana",
    role: "L3 Student · Web Development",
    avatar: "JH",
    color: "from-violet-500 to-purple-600",
    quote:
      "The offline-first design is a game changer for me. Even during load-shedding, I can still read my lessons and complete challenges. My streak has not broken in 3 weeks!",
    stars: 5,
  },
  {
    name: "Claudine Mukamana",
    role: "L5 Student · Full-Stack Track",
    avatar: "CM",
    color: "from-emerald-500 to-teal-600",
    quote:
      "The live audio sessions with mentors bring the classroom energy online. Being able to ask questions in real time from home is something I never had before.",
    stars: 5,
  },
  {
    name: "Eric Nshimiyimana",
    role: "Alumni · Class of 2025",
    avatar: "EN",
    color: "from-orange-500 to-red-500",
    quote:
      "I graduated but I&apos;m still on the platform helping L4 students verify their skills. The community here keeps giving back — that&apos;s what TVET should look like.",
    stars: 5,
  },
  {
    name: "Grace Ingabire",
    role: "L4 Student · Backend Track",
    avatar: "GI",
    color: "from-pink-500 to-rose-600",
    quote:
      "Weekly challenges push me to apply what I learn, not just memorize it. The XP system makes it feel like a game — but the skills are completely real.",
    stars: 5,
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i < count ? "text-yellow-400" : "text-slate-600"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function TestimonialsCarousel() {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = (dir: 1 | -1) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActive((a) => (a + dir + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActive((a) => (a + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const t = TESTIMONIALS[active];

  return (
    <section ref={ref} className="py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow opacity-20 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

      <div className="container relative z-10">
        {/* Heading */}
        <div className="text-center mb-14">
          <span className="level-pill bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 mb-3">
            ✦ Student Voices
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            What our <span className="gradient-text-orange">students say</span>
          </h2>
        </div>

        {/* Card */}
        <div
          className={`max-w-2xl mx-auto transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="glow-card p-8 text-center relative overflow-hidden">
            {/* Quote mark */}
            <div className="absolute top-4 left-6 text-7xl font-serif text-sky-500/10 select-none leading-none">
              &ldquo;
            </div>

            {/* Avatar */}
            <div className="flex justify-center mb-5">
              <div
                className={`w-16 h-16 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-xl font-extrabold text-white shadow-lg`}
              >
                {t.avatar}
              </div>
            </div>

            {/* Stars */}
            <div className="flex justify-center mb-4">
              <StarRating count={t.stars} />
            </div>

            {/* Quote */}
            <blockquote
              key={active}
              className="text-base sm:text-lg text-slate-200 leading-relaxed italic animate-fade-in"
              dangerouslySetInnerHTML={{ __html: `"${t.quote}"` }}
            />

            {/* Author */}
            <div className="mt-6">
              <p className="font-bold text-white">{t.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t.role}</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => advance(-1)}
            className="rounded-full border border-slate-700 bg-slate-900 p-2.5 text-slate-400 hover:text-white hover:border-slate-500 transition"
            aria-label="Previous"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setActive(i); }}
              className={`rounded-full transition-all duration-300 ${
                i === active ? "w-6 h-2 bg-sky-400" : "w-2 h-2 bg-slate-600 hover:bg-slate-400"
              }`}
            />
          ))}

          <button
            onClick={() => advance(1)}
            className="rounded-full border border-slate-700 bg-slate-900 p-2.5 text-slate-400 hover:text-white hover:border-slate-500 transition"
            aria-label="Next"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* All avatars row */}
        <div className="flex justify-center gap-2 mt-6">
          {TESTIMONIALS.map((t2, i) => (
            <button
              key={i}
              onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setActive(i); }}
              className={`w-8 h-8 rounded-full bg-gradient-to-br ${t2.color} flex items-center justify-center text-[10px] font-bold text-white transition-all ${
                i === active ? "ring-2 ring-sky-400 scale-110" : "opacity-50 hover:opacity-80"
              }`}
            >
              {t2.avatar}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
