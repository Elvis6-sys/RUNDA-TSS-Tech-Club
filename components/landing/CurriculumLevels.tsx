"use client";

import { useEffect, useRef, useState } from "react";

const LEVELS = [
  {
    level: "L3",
    title: "Certificate III",
    subtitle: "Foundation of Software Development",
    color: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-500/20",
    border: "border-emerald-500/30 hover:border-emerald-400/60",
    badge: "bg-emerald-500/20 text-emerald-300",
    icon: "🌱",
    duration: "1 Year",
    modules: [
      { name: "HTML / CSS Fundamentals", icon: "🌐" },
      { name: "JavaScript Basics", icon: "⚡" },
      { name: "Version Control (Git)", icon: "🔀" },
      { name: "Python Programming", icon: "🐍" },
      { name: "Computer Systems", icon: "💻" },
      { name: "UX Design Basics", icon: "🎨" },
    ],
    desc: "Build your foundation in web technologies, basic programming, and computational thinking. Perfect for total beginners.",
  },
  {
    level: "L4",
    title: "Certificate IV",
    subtitle: "Intermediate Software Development",
    color: "from-sky-500 to-blue-600",
    glow: "shadow-sky-500/20",
    border: "border-sky-500/30 hover:border-sky-400/60",
    badge: "bg-sky-500/20 text-sky-300",
    icon: "🚀",
    duration: "1 Year",
    modules: [
      { name: "Backend Application Dev", icon: "⚙️" },
      { name: "Database Development", icon: "🗃️" },
      { name: "Data Structures & Algorithms", icon: "🧮" },
      { name: "PHP Programming", icon: "🐘" },
      { name: "Backend System Design", icon: "🏗️" },
      { name: "Windows Server Admin", icon: "🖥️" },
    ],
    desc: "Deepen your skills with backend systems, databases, and server-side programming. Build real applications that solve real problems.",
  },
  {
    level: "L5",
    title: "Certificate V",
    subtitle: "Advanced Software Development",
    color: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/20",
    border: "border-violet-500/30 hover:border-violet-400/60",
    badge: "bg-violet-500/20 text-violet-300",
    icon: "🌟",
    duration: "1 Year",
    modules: [
      { name: "React.js Front-End Dev", icon: "⚛️" },
      { name: "Mobile App Development", icon: "📱" },
      { name: "Machine Learning", icon: "🤖" },
      { name: "DevOps & Deployment", icon: "🔧" },
      { name: "NoSQL Databases", icon: "🗄️" },
      { name: "Blockchain Fundamentals", icon: "⛓️" },
    ],
    desc: "Master advanced topics: modern frameworks, AI/ML, DevOps, and emerging technologies that define tomorrow's tech landscape.",
  },
];

export default function CurriculumLevels() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [activeLevel, setActiveLevel] = useState(0);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-20 px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

      <div className="container relative z-10">
        {/* Heading */}
        <div className="text-center mb-14">
          <span className="level-pill bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3">
            🎓 Curriculum Path
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Your journey from{" "}
            <span className="gradient-text-green">L3 → L5</span>
          </h2>
          <p className="mt-3 text-slate-400 max-w-xl mx-auto">
            Three progressive RQF levels — each building on the last, leading to industry-ready skills.
          </p>
        </div>

        {/* Level tabs */}
        <div className="flex justify-center gap-3 mb-8">
          {LEVELS.map((lv, i) => (
            <button
              key={lv.level}
              onClick={() => setActiveLevel(i)}
              className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all duration-300 ${
                i === activeLevel
                  ? `bg-gradient-to-r ${lv.color} text-white shadow-lg ${lv.glow}`
                  : "border border-slate-700 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-600"
              }`}
            >
              <span>{lv.icon}</span>
              <span>{lv.level}</span>
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {LEVELS.map((lv, i) => (
            <div
              key={lv.level}
              className={`glow-card relative overflow-hidden p-6 cursor-pointer transition-all duration-500 border ${lv.border} ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              } ${i === activeLevel ? "ring-2 ring-offset-2 ring-offset-slate-950" : ""}`}
              style={{
                transitionDelay: `${i * 120}ms`,
                outline: i === activeLevel
                  ? `2px solid ${i === 0 ? "#10b981" : i === 1 ? "#0ea5e9" : "#8b5cf6"}`
                  : undefined,
              }}
              onClick={() => setActiveLevel(i)}
            >
              {/* Top bar */}
              <div className={`h-1 absolute top-0 left-0 right-0 bg-gradient-to-r ${lv.color}`} />

              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{lv.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`level-pill text-[10px] ${lv.badge}`}>{lv.level}</span>
                      <span className="text-xs text-slate-500">{lv.duration}</span>
                    </div>
                    <h3 className="font-extrabold text-white text-base mt-0.5">{lv.title}</h3>
                  </div>
                </div>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed mb-4">{lv.subtitle}</p>
              <p className="text-slate-300 text-sm leading-relaxed mb-5">{lv.desc}</p>

              {/* Module list */}
              <div className="grid grid-cols-2 gap-2">
                {lv.modules.map((mod) => (
                  <div
                    key={mod.name}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-800/60 px-2.5 py-1.5 text-xs text-slate-300"
                  >
                    <span className="text-sm">{mod.icon}</span>
                    <span className="truncate">{mod.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Progress arrow path */}
        <div className="hidden md:flex items-center justify-center mt-10 gap-2 text-slate-600">
          <span className="text-emerald-400 font-bold text-sm">L3 Foundation</span>
          <svg className="w-20 h-3 text-slate-700" fill="none" viewBox="0 0 80 12">
            <path d="M0 6h72M66 1l8 5-8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-sky-400 font-bold text-sm">L4 Intermediate</span>
          <svg className="w-20 h-3 text-slate-700" fill="none" viewBox="0 0 80 12">
            <path d="M0 6h72M66 1l8 5-8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-violet-400 font-bold text-sm">L5 Advanced</span>
        </div>
      </div>
    </section>
  );
}
