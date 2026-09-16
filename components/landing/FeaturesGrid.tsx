"use client";

import { useEffect, useRef, useState } from "react";

const FEATURES = [
  {
    icon: "🧭",
    title: "Competency Passport",
    desc: "Track every skill you earn. Each verified competency is stamped into your digital passport — proof of what you can actually do.",
    color: "from-sky-500/20 to-blue-500/10",
    border: "border-sky-500/20 hover:border-sky-400/50",
    badge: "Core",
    badgeColor: "bg-sky-500/20 text-sky-300",
  },
  {
    icon: "📡",
    title: "Offline-First Learning",
    desc: "No internet? No problem. Lessons are cached via Service Worker so you keep learning anywhere — even with zero data.",
    color: "from-emerald-500/20 to-teal-500/10",
    border: "border-emerald-500/20 hover:border-emerald-400/50",
    badge: "PWA",
    badgeColor: "bg-emerald-500/20 text-emerald-300",
  },
  {
    icon: "⚡",
    title: "Weekly Challenges",
    desc: "Earn XP by solving real coding challenges. Compete with peers, submit your solution, and get scored by mentors.",
    color: "from-yellow-500/20 to-orange-500/10",
    border: "border-yellow-500/20 hover:border-yellow-400/50",
    badge: "XP",
    badgeColor: "bg-yellow-500/20 text-yellow-300",
  },
  {
    icon: "🎙️",
    title: "Live Audio Sessions",
    desc: "Join live mentorship rooms powered by LiveKit. Admins host voice sessions — students tune in by role or level.",
    color: "from-violet-500/20 to-purple-500/10",
    border: "border-violet-500/20 hover:border-violet-400/50",
    badge: "Live",
    badgeColor: "bg-violet-500/20 text-violet-300",
  },
  {
    icon: "💬",
    title: "Tier-Gated Chat",
    desc: "Real-time rooms for L3, L4, L5, and alumni. React with emoji, reply to threads, share files, all in one place.",
    color: "from-pink-500/20 to-rose-500/10",
    border: "border-pink-500/20 hover:border-pink-400/50",
    badge: "Realtime",
    badgeColor: "bg-pink-500/20 text-pink-300",
  },
  {
    icon: "📲",
    title: "USSD Access",
    desc: "No smartphone? Use USSD from any feature phone to access your progress, lessons, and notifications over 2G.",
    color: "from-orange-500/20 to-red-500/10",
    border: "border-orange-500/20 hover:border-orange-400/50",
    badge: "Rwanda-ready",
    badgeColor: "bg-orange-500/20 text-orange-300",
  },
  {
    icon: "🔬",
    title: "RQF-Aligned Modules",
    desc: "Every lesson maps directly to the Rwanda Qualifications Framework for L3/L4/L5 Software Development.",
    color: "from-cyan-500/20 to-sky-500/10",
    border: "border-cyan-500/20 hover:border-cyan-400/50",
    badge: "Curriculum",
    badgeColor: "bg-cyan-500/20 text-cyan-300",
  },
  {
    icon: "🛡️",
    title: "Admin Review Panel",
    desc: "Applications, skill verifications, and user management — all in one secure admin dashboard for teachers.",
    color: "from-slate-400/20 to-slate-500/10",
    border: "border-slate-500/20 hover:border-slate-400/50",
    badge: "Admin",
    badgeColor: "bg-slate-500/20 text-slate-300",
  },
];

function FeatureCard({
  feat,
  delay,
  visible,
}: {
  feat: (typeof FEATURES)[0];
  delay: number;
  visible: boolean;
}) {
  return (
    <div
      className={`glow-card group relative p-6 overflow-hidden transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } border ${feat.border}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Background gradient blob */}
      <div className={`absolute inset-0 bg-gradient-to-br ${feat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

      <div className="relative z-10">
        {/* Icon + badge row */}
        <div className="flex items-start justify-between mb-4">
          <span className="text-3xl group-hover:scale-110 inline-block transition-transform duration-300">
            {feat.icon}
          </span>
          <span className={`level-pill text-[10px] ${feat.badgeColor}`}>
            {feat.badge}
          </span>
        </div>

        <h3 className="text-base font-bold text-white mb-2 group-hover:text-sky-300 transition-colors">
          {feat.title}
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
          {feat.desc}
        </p>
      </div>
    </div>
  );
}

export default function FeaturesGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-20 px-4 relative">
      {/* faint glow behind section */}
      <div className="absolute inset-0 bg-radial-glow opacity-30 pointer-events-none" />

      <div className="container relative z-10">
        <div className="text-center mb-14">
          <span className="level-pill bg-violet-500/10 border border-violet-500/30 text-violet-400 mb-3">
            Platform features
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Everything you need to{" "}
            <span className="gradient-text">thrive</span>
          </h2>
          <p className="mt-3 text-slate-400 max-w-xl mx-auto">
            Built specifically for Rwandan TVET students — online, offline, and everywhere in between.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((feat, i) => (
            <FeatureCard key={feat.title} feat={feat} delay={i * 80} visible={visible} />
          ))}
        </div>
      </div>
    </section>
  );
}
