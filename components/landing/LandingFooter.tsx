"use client";

import Link from "next/link";

const NAV_LINKS = [
  { href: "/auth/register", label: "Apply to Join" },
  { href: "/auth/login", label: "Member Login" },
];

const FEATURE_LINKS = [
  { href: "/auth/register", label: "Competency Passport" },
  { href: "/auth/register", label: "Learning Modules" },
  { href: "/auth/register", label: "Weekly Challenges" },
  { href: "/auth/register", label: "Live Sessions" },
  { href: "/auth/register", label: "Community Chat" },
];

const LEVEL_LINKS = [
  { label: "L3 · Certificate III", color: "text-emerald-400" },
  { label: "L4 · Certificate IV", color: "text-sky-400" },
  { label: "L5 · Certificate V", color: "text-violet-400" },
];

export default function LandingFooter() {
  return (
    <footer className="relative border-t border-slate-800 bg-slate-950 pt-16 pb-8 px-4 overflow-hidden">
      {/* Subtle top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />
      <div className="orb opacity-10 animate-orb-drift" style={{ background: "radial-gradient(circle, #0ea5e9, transparent 70%)", width: "400px", height: "400px", bottom: "-200px", left: "-100px" }} />

      <div className="container relative z-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-sm shadow-lg">
                RT
              </div>
              <span className="font-extrabold text-white tracking-wide">RUNDA TSS</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-5">
              Rwanda&apos;s premier TVET Tech Club — building the next generation of Rwandan software developers.
            </p>
            {/* Social pills */}
            <div className="flex gap-2">
              {["🌐 Website", "📧 Email", "📱 USSD"].map((s) => (
                <span key={s} className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-400 font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Platform links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-400 hover:text-sky-300 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
              {FEATURE_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-slate-400 hover:text-sky-300 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Curriculum levels */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
              Curriculum
            </h4>
            <ul className="space-y-2.5">
              {LEVEL_LINKS.map((l) => (
                <li key={l.label}>
                  <span className={`text-sm font-semibold ${l.color}`}>{l.label}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <p className="text-xs text-slate-400 mb-1 font-semibold">RQF Framework</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                All content aligns with the Rwanda Qualifications Framework for TVET Software Development.
              </p>
            </div>
          </div>

          {/* CTA card */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
              Get Started
            </h4>
            <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-blue-600/5 p-5">
              <p className="text-sm font-bold text-white mb-2">Ready to join?</p>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Submit your application and get reviewed by our admin team. Free for all Runda TSS students.
              </p>
              <Link
                href="/auth/register"
                className="block text-center rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 transition"
              >
                Apply Now →
              </Link>
            </div>

            {/* Offline badge */}
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
              <span className="text-lg">📡</span>
              <div>
                <p className="text-xs font-semibold text-white">Offline-First</p>
                <p className="text-[10px] text-slate-500">Works without internet</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} Runda TSS Tech Club · Rwanda TVET Board · Built with ❤️ for Rwandan students
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Platform Online
            </span>
            <span>MIT License</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
