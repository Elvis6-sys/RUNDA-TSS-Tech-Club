"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  // Deep-link metadata from the joined submission
  marksReleased: boolean;
  submissionStatus: string | null;
  nodeId: string | null;
  blockId: string | null;
  trackId: string | null;
  nodeTitle: string | null;
  trackName: string | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

type NotifMeta = { icon: string; bg: string; iconBg: string; dot: string; accent: string };

function getNotifMeta(title: string): NotifMeta {
  const t = title.toLowerCase();
  if (t.includes("released")) return { icon: "📤", bg: "#f0fdf4", iconBg: "#dcfce7", dot: "#16a34a", accent: "#16a34a" };
  if (t.includes("excellent") || t.includes("100")) return { icon: "🏆", bg: "#fefce8", iconBg: "#fef9c3", dot: "#ca8a04", accent: "#ca8a04" };
  if (t.includes("graded")) return { icon: "✅", bg: "#eff6ff", iconBg: "#dbeafe", dot: "#2563eb", accent: "#2563eb" };
  if (t.includes("warning") || t.includes("violation")) return { icon: "⚠️", bg: "#fff7ed", iconBg: "#ffedd5", dot: "#ea580c", accent: "#ea580c" };
  if (t.includes("auto") || t.includes("submit")) return { icon: "🚨", bg: "#fff1f2", iconBg: "#ffe4e6", dot: "#dc2626", accent: "#dc2626" };
  return { icon: "🔔", bg: "#f5f3ff", iconBg: "#ede9fe", dot: "#7c3aed", accent: "#7c3aed" };
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function QuizGradeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [newArrival, setNewArrival] = useState<string | null>(null); // id of freshly arrived notif
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const prevUnreadCount = useRef(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/quiz/notifications");
      if (!res.ok) return;
      const data = await res.json();
      const notifs: Notification[] = data.notifications || [];

      setNotifications(prev => {
        // Detect genuinely new (just arrived) unread
        const prevIds = new Set(prev.map(n => n.id));
        const fresh = notifs.filter(n => !n.read && !prevIds.has(n.id));
        if (fresh.length > 0) setNewArrival(fresh[0].id);
        return notifs;
      });
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  // Position the portal panel relative to the button
  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const r = buttonRef.current.getBoundingClientRect();
    setPanelPos({
      top: r.bottom + window.scrollY + 8,
      right: window.innerWidth - r.right,
    });
  }, [open]);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!open) return;
    const reposition = () => {
      if (!buttonRef.current) return;
      const r = buttonRef.current.getBoundingClientRect();
      setPanelPos({ top: r.bottom + window.scrollY + 8, right: window.innerWidth - r.right });
    };
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      const panel = document.getElementById("notif-portal-panel");
      if (panel && !panel.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // Clear new-arrival highlight after 4s
  useEffect(() => {
    if (!newArrival) return;
    const t = setTimeout(() => setNewArrival(null), 4000);
    return () => clearTimeout(t);
  }, [newArrival]);

  const unread = notifications.filter(n => !n.read);

  async function markRead(id: string) {
    try {
      await fetch(`/api/quiz/notifications/${id}`, { method: "PATCH" });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch { /* silent */ }
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await fetch("/api/quiz/notifications", { method: "PATCH" });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } finally { setMarkingAll(false); }
  }

  const grouped = {
    fresh: notifications.filter(n => !n.read),
    earlier: notifications.filter(n => n.read),
  };

  // ── Bell button ─────────────────────────────────────────────────────────
  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen(v => !v)}
        aria-label={`Notifications${unread.length > 0 ? ` (${unread.length} unread)` : ""}`}
        className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 select-none ${open
          ? "bg-violet-100 text-violet-600 ring-2 ring-violet-300"
          : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800"
          }`}
      >
        {/* Animated bell */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
          className={`w-5 h-5 transition-transform ${unread.length > 0 && !open ? "animate-[wiggle_1.5s_ease-in-out_infinite]" : ""}`}>
          <path d="M5.85 3.5a.75.75 0 00-1.117-1 9.719 9.719 0 00-2.348 4.876.75.75 0 001.479.248A8.219 8.219 0 015.85 3.5zM19.267 2.5a.75.75 0 10-1.118 1 8.22 8.22 0 011.987 4.124.75.75 0 001.48-.248A9.72 9.72 0 0019.266 2.5z" />
          <path fillRule="evenodd" d="M12 2.25A6.75 6.75 0 005.25 9v.75a8.217 8.217 0 01-2.119 5.52.75.75 0 00.298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 107.48 0 24.583 24.583 0 004.83-1.244.75.75 0 00.298-1.205 8.217 8.217 0 01-2.118-5.52V9A6.75 6.75 0 0012 2.25zM9.75 18c0-.034 0-.067.002-.1a25.05 25.05 0 004.496 0l.002.1a2.25 2.25 0 11-4.5 0z" clipRule="evenodd" />
        </svg>

        {/* Pulsing badge */}
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-60" />
            <span className="relative inline-flex min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black items-center justify-center ring-2 ring-white">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          </span>
        )}
      </button>

      {/* ── Portal panel — renders directly into document.body ── */}
      {open && typeof document !== "undefined" && createPortal(
        <NotificationPanel
          panelPos={panelPos}
          grouped={grouped}
          loading={loading}
          markingAll={markingAll}
          unreadCount={unread.length}
          newArrival={newArrival}
          onMarkRead={markRead}
          onMarkAll={markAllRead}
          onClose={() => setOpen(false)}
        />,
        document.body
      )}
    </>
  );
}

// ─── Panel component (rendered in portal) ─────────────────────────────────────

function NotificationPanel({
  panelPos, grouped, loading, markingAll, unreadCount, newArrival,
  onMarkRead, onMarkAll, onClose,
}: {
  panelPos: { top: number; right: number };
  grouped: { fresh: Notification[]; earlier: Notification[] };
  loading: boolean;
  markingAll: boolean;
  unreadCount: number;
  newArrival: string | null;
  onMarkRead: (id: string) => void;
  onMarkAll: () => void;
  onClose: () => void;
}) {
  const total = grouped.fresh.length + grouped.earlier.length;

  return (
    <div
      id="notif-portal-panel"
      style={{
        position: "absolute",
        top: panelPos.top,
        right: panelPos.right,
        zIndex: 2147483647,
        width: 390,
        maxHeight: 540,
        boxShadow: "0 20px 60px -10px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.08)",
        animation: "notif-slide-in 0.22s cubic-bezier(0.34,1.56,0.64,1) both",
      }}
      className="flex flex-col rounded-2xl bg-white border border-gray-200 overflow-hidden"
    >
      {/* Entrance animation */}
      <style>{`@keyframes notif-slide-in{from{opacity:0;transform:translateY(-12px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
      {/* Decorative top gradient stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-400 shrink-0" />

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
        <div>
          <h3 className="text-lg font-black text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              {unreadCount} unread message{unreadCount > 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAll}
              disabled={markingAll}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition disabled:opacity-40 px-2 py-1 rounded-lg hover:bg-blue-50">
              {markingAll ? "…" : "Mark all read"}
            </button>
          )}
          <button onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition text-sm font-bold">
            ✕
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 px-5 pb-3 shrink-0">
        <span className="px-3 py-1 rounded-full bg-gray-900 text-white text-xs font-bold">All</span>
        {unreadCount > 0 && (
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
            {unreadCount} New
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ overscrollBehavior: "contain" }}>
        {loading ? (
          <LoadingSkeleton />
        ) : total === 0 ? (
          <EmptyState />
        ) : (
          <>
            {grouped.fresh.length > 0 && (
              <section>
                <SectionLabel>New</SectionLabel>
                {grouped.fresh.map(n => (
                  <NotifRow key={n.id} n={n} isNew={n.id === newArrival} onRead={onMarkRead} onClose={onClose} />
                ))}
              </section>
            )}
            {grouped.earlier.length > 0 && (
              <section>
                {grouped.fresh.length > 0 && <SectionLabel>Earlier</SectionLabel>}
                {grouped.earlier.map(n => (
                  <NotifRow key={n.id} n={n} isNew={false} onRead={onMarkRead} onClose={onClose} />
                ))}
              </section>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {total > 0 && (
        <div className="shrink-0 border-t border-gray-100 bg-gray-50/80">
          <Link
            href="/passport/my-results"
            onClick={onClose}
            className="flex items-center justify-center w-full py-3.5 text-sm font-bold text-blue-600 hover:text-blue-700 hover:bg-gray-100 transition rounded-b-2xl gap-2">
            <span>📊</span>
            View all quiz results
            <span className="text-gray-400">→</span>
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-5 py-2 text-[12px] font-black text-gray-800 uppercase tracking-wider bg-white/90 sticky top-0 backdrop-blur-sm border-b border-gray-50">
      {children}
    </p>
  );
}

function getNotifLink(n: Notification): string {
  const t = n.title.toLowerCase();
  if (n.marksReleased || t.includes("released")) return "/passport/my-results";
  if (t.includes("graded"))   return "/passport/my-results";
  if (t.includes("auto") || t.includes("submit") || t.includes("violation")) return "/passport/my-results";
  return "/passport/my-results";
}

function NotifRow({ n, isNew, onRead, onClose }: {
  n: Notification; isNew: boolean;
  onRead: (id: string) => void; onClose: () => void;
}) {
  const meta = getNotifMeta(n.title);
  const href = getNotifLink(n);

  function handleClick() {
    if (!n.read) onRead(n.id);
    onClose();
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-all duration-200 hover:bg-gray-50 group no-underline ${
        isNew ? "bg-gradient-to-r from-violet-50/80 to-transparent" : ""
      }`}
    >
      <div
        className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-xl transition-transform group-hover:scale-110 ${n.read ? "bg-gray-100" : ""}`}
        style={!n.read ? { background: meta.iconBg } : undefined}
      >
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className={`text-[13.5px] leading-snug ${n.read ? "text-gray-600" : "text-gray-900 font-semibold"}`}>
          {n.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
          <span>📍</span>
          <span>{n.marksReleased || n.title.toLowerCase().includes("released") ? "View released results →" : "My Results →"}</span>
        </p>
        <p className={`text-[11px] font-semibold mt-1 ${n.read ? "text-gray-400" : ""}`}
          style={!n.read ? { color: meta.accent } : undefined}>
          {timeAgo(n.createdAt)}
        </p>
      </div>
      <div className="shrink-0 flex flex-col items-center justify-between gap-1 pt-1 min-h-[40px]">
        {!n.read ? (
          <span className="block w-3 h-3 rounded-full animate-pulse" style={{ background: meta.dot }} />
        ) : (
          <span className="text-gray-300 text-xs">✓</span>
        )}
        <span className="text-gray-300 text-xs group-hover:text-gray-500 transition">›</span>
      </div>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-start gap-3 animate-pulse">
          <div className="w-11 h-11 rounded-full bg-gray-200 shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3.5 bg-gray-200 rounded-full w-3/4" />
            <div className="h-3 bg-gray-100 rounded-full w-full" />
            <div className="h-3 bg-gray-100 rounded-full w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-14 text-center space-y-4 px-6">
      <div className="relative w-20 h-20 mx-auto">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-100 to-blue-100 animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center text-4xl">🔔</div>
      </div>
      <div>
        <p className="font-black text-gray-800 text-base">All caught up!</p>
        <p className="text-sm text-gray-400 mt-1.5 leading-relaxed max-w-[240px] mx-auto">
          Quiz grades and marks releases will pop up here as soon as they&apos;re ready.
        </p>
      </div>
      <Link
        href="/passport"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-700 hover:underline transition">
        Go to My Passport →
      </Link>
    </div>
  );
}
