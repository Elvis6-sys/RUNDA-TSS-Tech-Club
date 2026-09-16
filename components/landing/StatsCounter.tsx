"use client";

import { useEffect, useRef, useState } from "react";

interface Stat {
  value: number;
  suffix: string;
  label: string;
  icon: string;
  color: string;
}

const STATS: Stat[] = [
  { value: 3, suffix: " Levels", label: "RQF Curriculum Tracks (L3 · L4 · L5)", icon: "🎓", color: "from-sky-500 to-blue-600" },
  { value: 100, suffix: "+", label: "Students Enrolled", icon: "👩‍💻", color: "from-violet-500 to-purple-600" },
  { value: 50, suffix: "+", label: "Learning Modules", icon: "📚", color: "from-emerald-500 to-teal-600" },
  { value: 30, suffix: "+", label: "Coding Challenges", icon: "⚡", color: "from-orange-500 to-red-500" },
];

function useCountUp(target: number, duration = 1800, started: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return count;
}

function StatCard({ stat, started }: { stat: Stat; started: boolean }) {
  const count = useCountUp(stat.value, 1600, started);

  return (
    <div className="glow-card group p-6 flex flex-col items-center text-center gap-3">
      {/* Icon circle */}
      <div
        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}
      >
        {stat.icon}
      </div>

      {/* Number */}
      <div className={`text-4xl font-extrabold stat-number bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
        {count}
        <span className="text-2xl">{stat.suffix}</span>
      </div>

      {/* Label */}
      <p className="text-sm text-slate-400 leading-snug">{stat.label}</p>
    </div>
  );
}

export default function StatsCounter() {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-20 px-4">
      <div className="container">
        {/* Section heading */}
        <div className="text-center mb-12 reveal visible">
          <span className="level-pill bg-sky-500/10 border border-sky-500/30 text-sky-400 mb-3">
            By the numbers
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Impact at a <span className="gradient-text">glance</span>
          </h2>
          <p className="mt-3 text-slate-400 max-w-xl mx-auto">
            Real growth, real students, real skills — tracked and celebrated on one platform.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {STATS.map((stat) => (
            <StatCard key={stat.label} stat={stat} started={started} />
          ))}
        </div>
      </div>
    </section>
  );
}
