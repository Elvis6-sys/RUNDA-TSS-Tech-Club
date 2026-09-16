"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type Lesson = {
  id: string;
  title: string;
  subject: string;
  tierVisibility: string;
  content: string;
  order: number;
  updatedAt: string;
};

const CACHE_KEY = "runda_lessons_cache";

const SUBJECT_COLOR: Record<string, string> = {
  Python: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  Mathematics: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  "Web Development": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Electronics: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  Networking: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

function subjectStyle(subject: string) {
  return SUBJECT_COLOR[subject] ?? "text-slate-400 bg-slate-500/10 border-slate-500/20";
}

function buildLearningOutcome(title: string) {
  return `Learning outcome 1: Understand the core concepts of ${title}.`;
}

function buildIndicativeContent(title: string) {
  return `Indicative content 1: Key concepts and examples for ${title}, to be refined later.`;
}

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selected, setSelected] = useState<Lesson | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [readPct, setReadPct] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const queryLesson = searchParams.get("lesson")?.trim().toLowerCase() ?? "";

  useEffect(() => {
    const update = () => setIsOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/lessons");
        if (res.ok) {
          const data = await res.json();
          setLessons(data.lessons ?? []);
          localStorage.setItem(CACHE_KEY, JSON.stringify(data.lessons ?? []));
          setFromCache(false);
        } else {
          throw new Error("fetch failed");
        }
      } catch {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          setLessons(JSON.parse(cached));
          setFromCache(true);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (lessons.length === 0) return;

    if (queryLesson) {
      const exactMatch = lessons.find(
        (lesson) => lesson.title.toLowerCase() === queryLesson || lesson.id === queryLesson
      );
      const partialMatch = lessons.find((lesson) => lesson.title.toLowerCase().includes(queryLesson));
      setSelected(exactMatch ?? partialMatch ?? lessons[0]);
      return;
    }

    if (!selected && lessons.length > 0) {
      setSelected(lessons[0]);
    }
  }, [lessons, queryLesson, selected]);

  const filtered = lessons.filter(
    (l) =>
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.subject.toLowerCase().includes(search.toLowerCase()) ||
      l.content.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, Lesson[]>>((acc, l) => {
    (acc[l.subject] ??= []).push(l);
    return acc;
  }, {});

  const totalLessons = lessons.length;
  const totalSubjects = Object.keys(grouped).length;
  const selectedLesson = selected || filtered[0] || null;

  useEffect(() => {
    setReadPct(0);
  }, [selectedLesson]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    function onScroll() {
      if (!el) return;
      const total = el.scrollHeight - el.clientHeight;
      if (total <= 0) {
        setReadPct(100);
        return;
      }
      const pct = Math.min(100, Math.max(0, Math.round((el.scrollTop / total) * 100)));
      setReadPct(pct);
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [selectedLesson]);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6">
      <div className="mx-auto max-w-7xl">
        {isOffline && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
            📵 Offline mode — lessons may be cached from your last session
          </div>
        )}
        {!isOffline && fromCache && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
            📦 Showing cached lessons — reconnect to refresh content
          </div>
        )}

        <section className="mb-8 rounded-[2rem] border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/30">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Lesson Library</p>
              <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">Modern lessons for every topic</h1>
              <p className="mt-4 text-base leading-7 text-slate-400">
                Browse lessons prepared by your teacher with clear structure, helpful overviews, and quick access to the topics you need.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-[1.75rem] border border-slate-700/50 bg-slate-950/90 px-5 py-4 text-slate-200">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Lessons</p>
                <p className="mt-3 text-3xl font-semibold text-white">{totalLessons}</p>
              </div>
              <div className="rounded-[1.75rem] border border-slate-700/50 bg-slate-950/90 px-5 py-4 text-slate-200">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Subjects</p>
                <p className="mt-3 text-3xl font-semibold text-white">{totalSubjects}</p>
              </div>
              <div className="rounded-[1.75rem] border border-slate-700/50 bg-slate-950/90 px-5 py-4 text-slate-200">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Search</p>
                <p className="mt-3 text-3xl font-semibold text-white">Find lessons quickly</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_0.8fr] lg:grid-cols-[1.4fr_1fr]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subject, title, or keyword…"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
            />
            <div className="rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-400">
              <p className="font-medium text-slate-200">Tip</p>
              <p className="mt-2 leading-6">
                Use the search field to narrow lessons by keyword. Select a lesson card to preview the full contents instantly.
              </p>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((index) => (
              <div key={index} className="h-24 rounded-[1.75rem] bg-slate-800/60 animate-pulse" />
            ))}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-12 text-center text-slate-500">
            {search ? "No lessons match your search." : "No lessons are available yet. Check back later."}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="space-y-6">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Subjects</p>
                <div className="mt-4 space-y-3">
                  {Object.entries(grouped).map(([subject, items]) => (
                    <button
                      key={subject}
                      onClick={() => setSelected(items[0])}
                      className="flex w-full items-center justify-between rounded-2xl border border-slate-700/60 bg-slate-950/80 px-4 py-3 text-left transition hover:border-slate-600 hover:bg-slate-900"
                    >
                      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${subjectStyle(subject)}`}>
                        {subject}
                      </span>
                      <span className="text-xs text-slate-400">{items.length}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Trending lesson</p>
                <h2 className="mt-3 text-xl font-semibold text-white">{selectedLesson?.title ?? "Select a lesson"}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {selectedLesson
                    ? `Ready to explore ${selectedLesson.subject}? This lesson is designed to help you understand the key ideas step by step.`
                    : "Select any lesson card to preview the material here."}
                </p>
              </div>
            </aside>

            <main className="space-y-6">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-8">
                {selectedLesson ? (
                  <>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] ${subjectStyle(selectedLesson.subject)}`}>
                          {selectedLesson.subject}
                        </div>
                        <h2 className="mt-4 text-3xl font-semibold text-white">{selectedLesson.title}</h2>
                      </div>
                      <div className="text-right text-sm text-slate-400">
                        <p>Lesson #{selectedLesson.order}</p>
                        <p className="mt-2">Updated {new Date(selectedLesson.updatedAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Lesson progress</p>
                        <p className="mt-1 text-sm text-slate-400">Scroll through the lesson to see how much you’ve read.</p>
                      </div>
                      <div className="text-right text-sm font-semibold text-slate-100">{readPct}%</div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${readPct}%` }}
                      />
                    </div>
                    <div className="mt-10 rounded-[1.75rem] border border-slate-800 bg-slate-950/90 p-6 text-slate-200">
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Learning outcome</p>
                          <p className="mt-2 text-sm text-slate-300">{buildLearningOutcome(selectedLesson.title)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Indicative content</p>
                          <p className="mt-2 text-sm text-slate-300">{buildIndicativeContent(selectedLesson.title)}</p>
                        </div>
                      </div>
                    </div>

                    <div ref={contentRef} className="mt-8 max-h-[60vh] overflow-y-auto rounded-[1.75rem] border border-slate-800 bg-slate-950/90 p-6 text-slate-200">
                      <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap leading-7">
                        {selectedLesson.content}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-[1.75rem] border border-dashed border-slate-700 bg-slate-950/80 p-12 text-center text-slate-500">
                    Select a lesson to preview the content here.
                  </div>
                )}
              </div>

              <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6 text-slate-300">
                <h3 className="text-lg font-semibold text-white">How this lesson page works</h3>
                <ul className="mt-4 space-y-3 text-sm leading-6">
                  <li>• Lessons are grouped by subject so you can quickly move between topics.</li>
                  <li>• Search across titles, subjects, and lesson text to find the right lesson fast.</li>
                  <li>• Tap any lesson card to open the full lesson in the preview pane.</li>
                </ul>
              </div>
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
