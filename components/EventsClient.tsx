"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Calendar, Clock, MapPin, Users, MessageCircle, ThumbsUp, X, Plus, Sparkles } from "lucide-react";

const EmojiPicker = dynamic(() => import("@emoji-mart/react"), { ssr: false });

type Event = {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  type: string;
};

type Reaction = { id: string; emoji: string; user: { id: string; name: string | null } };
type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string | null; role: string };
  reactions: Reaction[];
};

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  holiday_intensive: {
    bg: "bg-gradient-to-br from-amber-500/10 to-orange-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    icon: "🎓"
  },
  demo_day: {
    bg: "bg-gradient-to-br from-sky-500/10 to-blue-500/10",
    border: "border-sky-500/30",
    text: "text-sky-400",
    icon: "🎯"
  },
  mentorship: {
    bg: "bg-gradient-to-br from-emerald-500/10 to-teal-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    icon: "🤝"
  },
  other: {
    bg: "bg-gradient-to-br from-slate-700/10 to-slate-800/10",
    border: "border-slate-600/30",
    text: "text-slate-400",
    icon: "📌"
  },
};

const ROLE_COLORS: Record<string, string> = {
  admin: "text-rose-400", alumni: "text-amber-400",
  l5: "text-purple-400", l4: "text-sky-400", l3: "text-emerald-400",
};

function groupReactions(reactions: Reaction[]) {
  const map: Record<string, { count: number; users: string[] }> = {};
  for (const r of reactions) {
    if (!map[r.emoji]) map[r.emoji] = { count: 0, users: [] };
    map[r.emoji].count++;
    map[r.emoji].users.push(r.user.name ?? "Member");
  }
  return map;
}

// ─── Event Detail Modal ───────────────────────────────────────────────────────

function EventModal({
  event, currentUserId, open, onClose
}: {
  event: Event;
  currentUserId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  async function loadComments() {
    if (loaded) return;
    const res = await fetch(`/api/events/comments?eventId=${event.id}`);
    if (res.ok) setComments(await res.json());
    setLoaded(true);
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    const res = await fetch("/api/events/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: event.id, content: input.trim() })
    });
    setSending(false);
    if (res.ok) {
      const c: Comment = await res.json();
      setComments((prev) => [...prev, c]);
      setInput("");
    }
  }

  async function toggleReaction(commentId: string, emoji: string) {
    await fetch("/api/events/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, emoji })
    });
    setComments((prev) => prev.map((c) => {
      if (c.id !== commentId) return c;
      const existing = c.reactions.find((r) => r.emoji === emoji && r.user.id === currentUserId);
      if (existing) return { ...c, reactions: c.reactions.filter((r) => r.id !== existing.id) };
      return { ...c, reactions: [...c.reactions, { id: `opt-${Date.now()}`, emoji, user: { id: currentUserId, name: "You" } }] };
    }));
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose(); else loadComments(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <Dialog.Content
          onOpenAutoFocus={loadComments}
          className="fixed inset-x-4 top-[5%] bottom-[5%] z-50 mx-auto max-w-3xl flex flex-col rounded-3xl border border-slate-700/50 bg-slate-900/95 backdrop-blur-2xl overflow-hidden shadow-2xl"
        >
          {/* Header with Gradient */}
          <div className="relative border-b border-slate-800/50 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5" />
            <div className="relative px-8 py-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{(TYPE_COLORS[event.type] ?? TYPE_COLORS.other).icon}</span>
                    <span className={`inline-block rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-sm
                      ${(TYPE_COLORS[event.type] ?? TYPE_COLORS.other).bg} 
                      ${(TYPE_COLORS[event.type] ?? TYPE_COLORS.other).border} 
                      ${(TYPE_COLORS[event.type] ?? TYPE_COLORS.other).text}`}>
                      {event.type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <Dialog.Title className="text-2xl font-bold text-white leading-tight">
                    {event.title}
                  </Dialog.Title>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(event.date), "EEEE, MMMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{format(new Date(event.date), "HH:mm")}</span>
                    </div>
                  </div>
                </div>
                <Dialog.Close className="shrink-0 rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition">
                  <X className="w-5 h-5" />
                </Dialog.Close>
              </div>
              {event.description && (
                <p className="mt-4 text-sm text-slate-300 leading-relaxed p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                  {event.description}
                </p>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
            <div className="flex items-center gap-2 pb-2">
              <MessageCircle className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Discussion ({comments.length})</h3>
            </div>
            {!loaded && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}
            {loaded && comments.length === 0 && (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No comments yet. Start the discussion!</p>
              </div>
            )}
            {comments.map((c) => {
              const grouped = groupReactions(c.reactions);
              return (
                <div key={c.id} className="space-y-2.5">
                  <div className="rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-800/40 backdrop-blur-sm border border-slate-700/50 px-5 py-4 hover:border-slate-600/50 transition">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br ${ROLE_COLORS[c.user.role] === "text-rose-400" ? "from-rose-500 to-pink-600" :
                        ROLE_COLORS[c.user.role] === "text-amber-400" ? "from-amber-400 to-orange-500" :
                          ROLE_COLORS[c.user.role] === "text-purple-400" ? "from-purple-500 to-indigo-600" :
                            ROLE_COLORS[c.user.role] === "text-sky-400" ? "from-sky-500 to-blue-600" :
                              "from-emerald-400 to-teal-600"
                        } text-white shadow-lg`}>
                        {(c.user.name ?? "M").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <span className={`text-sm font-bold ${ROLE_COLORS[c.user.role] ?? "text-slate-400"}`}>
                          {c.user.name ?? "Member"}
                        </span>
                        <span className="text-xs text-slate-600 ml-2">
                          {format(new Date(c.createdAt), "MMM d · HH:mm")}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap pl-10">{c.content}</p>
                  </div>

                  {/* Reactions row */}
                  <div className="flex items-center gap-1.5 flex-wrap pl-1">
                    {Object.entries(grouped).map(([emoji, data]) => (
                      <Tooltip.Provider key={emoji} delayDuration={200}>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <button
                              onClick={() => toggleReaction(c.id, emoji)}
                              className="flex items-center gap-1 rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-xs text-slate-300 hover:border-slate-500 transition"
                            >
                              {emoji} {data.count}
                            </button>
                          </Tooltip.Trigger>
                          <Tooltip.Content className="rounded-xl bg-slate-700 px-3 py-1.5 text-xs text-slate-200 shadow-xl">
                            {data.users.join(", ")}
                          </Tooltip.Content>
                        </Tooltip.Root>
                      </Tooltip.Provider>
                    ))}
                    <div className="relative">
                      <button
                        onClick={() => setPickerFor(pickerFor === c.id ? null : c.id)}
                        className="rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-xs text-slate-400 hover:text-white hover:border-slate-500 transition"
                      >
                        + 😊
                      </button>
                      {pickerFor === c.id && (
                        <div className="absolute bottom-8 left-0 z-30">
                          <EmojiPicker
                            data={async () => (await import("@emoji-mart/data")).default}
                            onEmojiSelect={(e: { native: string }) => { toggleReaction(c.id, e.native); setPickerFor(null); }}
                            theme="dark"
                            previewPosition="none"
                            skinTonePosition="none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comment input */}
          <div className="border-t border-slate-800 px-6 py-4">
            <form onSubmit={postComment} className="flex items-end gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmoji(!showEmoji)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                >
                  😊
                </button>
                {showEmoji && (
                  <div className="absolute bottom-12 left-0 z-30">
                    <EmojiPicker
                      data={async () => (await import("@emoji-mart/data")).default}
                      onEmojiSelect={(e: { native: string }) => { setInput((p) => p + e.native); setShowEmoji(false); }}
                      theme="dark"
                      previewPosition="none"
                    />
                  </div>
                )}
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); postComment(e as unknown as React.FormEvent); } }}
                placeholder="Add a comment…"
                rows={1}
                className="flex-1 resize-none rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 max-h-28"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-40 transition"
              >
                ➤
              </button>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({ event, isAdmin, currentUserId }: { event: Event; isAdmin: boolean; currentUserId: string }) {
  const [open, setOpen] = useState(false);
  const isPast = new Date(event.date) < new Date();
  const typeConfig = TYPE_COLORS[event.type] ?? TYPE_COLORS.other;

  return (
    <>
      <article
        className={`group relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300 cursor-pointer
          ${isPast
            ? "bg-slate-800/30 border-slate-700/30 hover:border-slate-600/50 opacity-75"
            : "bg-slate-800/40 border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800/60"
          }
          hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10`}
        onClick={() => setOpen(true)}
      >
        {/* Gradient Overlay */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${typeConfig.bg}`} />

        {/* Content */}
        <div className="relative p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{typeConfig.icon}</span>
                <span className={`text-xs font-bold uppercase tracking-wider ${typeConfig.text}`}>
                  {event.type.replace(/_/g, " ")}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-2">
                {event.title}
              </h3>
            </div>
            {!isPast && (
              <div className="shrink-0 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30">
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed">
              {event.description}
            </p>
          )}

          {/* Date & Time */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(event.date), "MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-4 h-4" />
              <span>{format(new Date(event.date), "HH:mm")}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              {isPast ? "Past event" : "Upcoming"}
            </span>
            <div className="flex items-center gap-1.5 text-blue-400 group-hover:text-blue-300 transition-colors">
              <span className="text-sm font-semibold">View Details</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </article>

      <EventModal event={event} currentUserId={currentUserId} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

// ─── Main EventsClient ────────────────────────────────────────────────────────

export default function EventsClient({
  events, isAdmin, currentUserId
}: {
  events: Event[];
  isAdmin: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("other");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, date, type })
    });
    setLoading(false);
    if (!res.ok) { const b = await res.json().catch(() => ({})); setError(b?.error || "Failed."); return; }
    setTitle(""); setDescription(""); setDate(""); setType("other"); setShowForm(false);
    router.refresh();
  }

  const upcoming = events.filter((e) => new Date(e.date) >= new Date());
  const past = events.filter((e) => new Date(e.date) < new Date());

  return (
    <Tooltip.Provider>
      <div className="space-y-10">
        {/* Admin Actions */}
        {isAdmin && !showForm && (
          <div className="flex justify-center">
            <button
              onClick={() => setShowForm(true)}
              className="group flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              Add New Event
            </button>
          </div>
        )}

        {/* Create Event Form */}
        {isAdmin && showForm && (
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleCreate} className="rounded-3xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-xl p-8 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Create New Event</h2>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-700/50 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Event Title</label>
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Holiday Intensive Bootcamp 2026"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description (optional)</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell us what this event is about..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition resize-none"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Date & Time</label>
                    <input
                      required
                      type="datetime-local"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Event Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                    >
                      <option value="holiday_intensive">🎓 Holiday Intensive</option>
                      <option value="demo_day">🎯 Demo Day</option>
                      <option value="mentorship">🤝 Mentorship Session</option>
                      <option value="other">📌 Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-3">
                  <p className="text-sm text-rose-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : "Create Event"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 rounded-xl border border-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-700/50 hover:text-white transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Upcoming Events */}
        {upcoming.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
              <h2 className="text-sm uppercase tracking-widest text-slate-400 font-bold">Upcoming Events</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-700/50 to-transparent" />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((e) => <EventCard key={e.id} event={e} isAdmin={isAdmin} currentUserId={currentUserId} />)}
            </div>
          </div>
        )}

        {/* Past Events */}
        {past.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-1 w-1 rounded-full bg-slate-600" />
              <h2 className="text-sm uppercase tracking-widest text-slate-500 font-bold">Past Events</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-700/30 to-transparent" />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((e) => <EventCard key={e.id} event={e} isAdmin={isAdmin} currentUserId={currentUserId} />)}
            </div>
          </div>
        )}

        {/* Empty State */}
        {events.length === 0 && !showForm && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800/60 border border-slate-700/50 mb-6">
              <Calendar className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Events Yet</h3>
            <p className="text-slate-400 mb-6">Check back soon for upcoming community events</p>
            {isAdmin && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
              >
                <Plus className="w-4 h-4" />
                Create First Event
              </button>
            )}
          </div>
        )}
      </div>
    </Tooltip.Provider>
  );
}
