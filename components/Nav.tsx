"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  BookOpen,
  Trophy,
  BarChart2,
  Users,
  FolderOpen,
  CalendarDays,
  MessageCircle,
  CheckCircle2,
  GraduationCap,
  Settings,
  UserCircle,
  WifiOff,
  Wifi,
} from "lucide-react";
import SignOutButton from "./SignOutButton";
import UserAvatar from "./UserAvatar";
import { useTranslation } from "@/lib/i18n/useTranslation";

type NavLink = { href: string; label: string; icon?: React.ReactNode };

const LEARN_LINKS: NavLink[] = [
  { href: "/passport", label: "Modules", icon: <GraduationCap className="w-3.5 h-3.5" /> },
  { href: "/challenges", label: "Challenges", icon: <Trophy className="w-3.5 h-3.5" /> },
  { href: "/progress", label: "Progress", icon: <BarChart2 className="w-3.5 h-3.5" /> },
];

const ADMIN_LINKS: NavLink[] = [
  { href: "/admin", label: "Overview", icon: <Settings className="w-3.5 h-3.5" /> },
  { href: "/admin/trainers", label: "Trainers", icon: <Users className="w-3.5 h-3.5" /> },
  { href: "/admin/module-progress", label: "Module Progress", icon: <BarChart2 className="w-3.5 h-3.5" /> },
];

const COMMUNITY_LINKS: NavLink[] = [
  { href: "/projects", label: "Projects", icon: <FolderOpen className="w-3.5 h-3.5" /> },
  { href: "/resources", label: "Resources", icon: <BookOpen className="w-3.5 h-3.5" /> },
  { href: "/events", label: "Events", icon: <CalendarDays className="w-3.5 h-3.5" /> },
  { href: "/chat", label: "Chat", icon: <MessageCircle className="w-3.5 h-3.5" /> },
];

const ROLE_LABEL: Record<string, string> = {
  l3: "L3", l4: "L4", l5: "L5",
  alumni: "Alumni", admin: "Admin", trainer: "Trainer",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function useGreeting() {
  const [greet, setGreet] = useState("");
  useEffect(() => { setGreet(greeting()); }, []);
  return greet;
}

// ─── Reusable nav dropdown ────────────────────────────────────────────────────
function Dropdown({
  label,
  links,
  pathname,
  accentActive,
  accentInactive,
}: {
  label: string;
  links: NavLink[];
  pathname: string;
  accentActive?: string;
  accentInactive?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = links.some((l) => pathname.startsWith(l.href));
  const activeClass = accentActive ?? "bg-slate-800 text-white";
  const inactiveClass = accentInactive ?? "text-slate-400 hover:text-white hover:bg-slate-800/60";

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-medium transition whitespace-nowrap ${active ? activeClass : inactiveClass
          }`}
      >
        {label}
        <ChevronDown
          className={`w-3 h-3 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          strokeWidth={2.5}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 min-w-[172px] rounded-2xl border border-slate-700/60 bg-slate-900 shadow-xl shadow-black/40 py-1.5 overflow-hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 px-4 py-2 text-sm transition ${pathname.startsWith(l.href)
                ? "bg-slate-800 text-white font-semibold"
                : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                }`}
            >
              {l.icon && (
                <span className={pathname.startsWith(l.href) ? "text-white" : "text-slate-500"}>
                  {l.icon}
                </span>
              )}
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Profile avatar dropdown ──────────────────────────────────────────────────
function ProfileMenu({
  name,
  role,
  profileImage,
  unreadProjectCount,
}: {
  name?: string | null;
  role: string;
  profileImage?: string | null;
  unreadProjectCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isTeacher = role === "trainer" || role === "admin";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full transition hover:ring-2 hover:ring-sky-500/60 focus:outline-none"
        aria-label="Open profile menu"
      >
        <UserAvatar
          name={name}
          profileImage={profileImage}
          size="sm"
          ring={open || pathname === "/profile"}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl border border-slate-700/60 bg-slate-900 shadow-xl shadow-black/50 py-2 overflow-hidden">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-3">
            <UserAvatar name={name} profileImage={profileImage} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{name ?? "User"}</p>
              <p className="text-[11px] text-slate-400">{ROLE_LABEL[role] ?? role}</p>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition ${pathname === "/profile"
                ? "bg-slate-800 text-white font-semibold"
                : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                }`}
            >
              <UserCircle className="w-4 h-4 shrink-0 text-slate-400" />
              <span>My Profile</span>
            </Link>

            {/* Only show Progress and Results for students */}
            {!isTeacher && (
              <>
                <Link
                  href="/progress"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800/70 hover:text-white transition"
                >
                  <BarChart2 className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>My Progress</span>
                </Link>

                <Link
                  href="/passport/my-results"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800/70 hover:text-white transition relative"
                >
                  <GraduationCap className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>My Results</span>
                  {unreadProjectCount && unreadProjectCount > 0 && (
                    <span className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-emerald-500 text-white animate-pulse">
                      {unreadProjectCount}
                    </span>
                  )}
                </Link>
              </>
            )}
          </div>

          {/* Sign out */}
          <div className="border-t border-slate-800 pt-1 pb-1 px-3">
            <SignOutButton fullWidth />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Nav ─────────────────────────────────────────────────────────────────
export default function Nav({
  role,
  name,
  profileImage,
}: {
  role: string;
  name?: string | null;
  profileImage?: string | null;
}) {
  const pathname = usePathname();
  const { locale, setLocale } = useTranslation();
  const [online, setOnline] = useState(true);
  const [unreadProjectCount, setUnreadProjectCount] = useState(0);
  const greet = useGreeting();
  const canVerify = ["admin", "alumni"].includes(role); // Only admin and alumni, NO students
  const isTrainer = role === "trainer";
  const canSeeModules = isTrainer; // Only trainers can see "My Modules"

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // Fetch unread project count
  useEffect(() => {
    if (role !== "trainer" && role !== "admin") {
      fetch("/api/projects/unread-count")
        .then((res) => res.json())
        .then((data) => {
          if (data.count !== undefined) {
            setUnreadProjectCount(data.count);
          }
        })
        .catch(() => {
          // Silently fail
        });
    }
  }, [role]);

  const firstName = name?.split(" ")[0] ?? "there";

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      {/* Offline banner */}
      {!online && (
        <div className="flex items-center justify-center gap-2 bg-amber-500/15 border-b border-amber-500/20 px-4 py-1 text-xs font-semibold text-amber-300">
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          Offline — cached content available
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-14 items-center justify-between gap-3">

          {/* Left — brand + nav links */}
          <div className="flex items-center gap-1 min-w-0">
            <Link
              href="/dashboard"
              className="mr-2 shrink-0 text-sm font-extrabold text-sky-400 tracking-wide hover:text-sky-300 transition"
            >
              RUNDA TSS
            </Link>

            <nav className="flex items-center gap-0.5">
              <Dropdown label="Learn" links={LEARN_LINKS} pathname={pathname} />
              <Dropdown label="Community" links={COMMUNITY_LINKS} pathname={pathname} />

              {canVerify && (
                <Link
                  href="/verify"
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition whitespace-nowrap ${pathname.startsWith("/verify")
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "text-emerald-400/70 hover:text-emerald-300 hover:bg-emerald-500/10"
                    }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verify
                </Link>
              )}

              {canSeeModules && (
                <Link
                  href="/trainer/dashboard"
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition whitespace-nowrap ${pathname.startsWith("/trainer")
                    ? "bg-violet-500/20 text-violet-300"
                    : "text-violet-400/70 hover:text-violet-300 hover:bg-violet-500/10"
                    }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  My Modules
                </Link>
              )}

              {(role === "trainer" || role === "admin") && (
                <Link
                  href="/teacher/entrance-tests"
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition whitespace-nowrap ${pathname.startsWith("/teacher/entrance-tests")
                    ? "bg-amber-500/20 text-amber-300"
                    : "text-amber-400/70 hover:text-amber-300 hover:bg-amber-500/10"
                    }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Review Tests
                </Link>
              )}

              {role === "admin" && (
                <Dropdown
                  label="Admin"
                  links={ADMIN_LINKS}
                  pathname={pathname}
                  accentActive="bg-rose-500/20 text-rose-300"
                  accentInactive="text-rose-400/70 hover:text-rose-300 hover:bg-rose-500/10"
                />
              )}
            </nav>
          </div>

          {/* Right — greeting + role badge + locale + avatar */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Greeting */}
            <div className="hidden sm:flex flex-col items-end leading-none">
              <span
                className="text-[10px] text-slate-500 uppercase tracking-widest"
                suppressHydrationWarning
              >
                {greet}
              </span>
              <span className="text-sm font-semibold text-white">{firstName}</span>
            </div>

            {/* Role badge */}
            <span className="rounded-lg border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-[11px] font-bold text-slate-400">
              {ROLE_LABEL[role] ?? role.toUpperCase()}
            </span>

            {/* Online / offline dot */}
            <span title={online ? "Online" : "Offline"} className="shrink-0">
              {online
                ? <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                : <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              }
            </span>

            {/* Locale toggle */}
            <button
              onClick={() => setLocale(locale === "en" ? "rw" : "en")}
              className="rounded-lg border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-[11px] font-bold text-slate-400 hover:text-white hover:border-slate-600 transition"
            >
              {locale === "en" ? "RW" : "EN"}
            </button>

            {/* Profile avatar + dropdown */}
            <ProfileMenu name={name} role={role} profileImage={profileImage} unreadProjectCount={unreadProjectCount} />
          </div>
        </div>
      </div>
    </header>
  );
}
