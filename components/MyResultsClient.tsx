"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type Response = {
  id: string; questionIdx: number; questionType: string;
  answerText: string | null; answerChoice: number | null;
  gradeScore: number | null; gradeNotes: string | null; gradedAt: string | null;
};

type Submission = {
  id: string; nodeId: string; blockId: string; status: string;
  totalQuestions: number; gradedCount: number; avgScore: number | null;
  autoSubmitted: boolean; cheatAttempts: number;
  marksReleased: boolean; marksReleasedAt: string | null;
  createdAt: string; updatedAt: string;
  node: { id: string; title: string };
  track: { id: string; name: string; tier: string; icon: string | null };
  responses: Response[];
};

type ProjectSubmission = {
  id: string;
  projectId: string;
  userId: string;
  submissionUrl: string;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  note: string | null;
  grade: number;
  feedback: string | null;
  gradedBy: string | null;
  gradedAt: string | null;
  status: string;
  submittedAt: string;
  updatedAt: string;
  project: {
    id: string;
    title: string;
    description: string | null;
  } | null;
  user: {
    name: string | null;
  };
};

type Student = { name: string | null; email: string };

const TIER: Record<string, { accent: string; from: string; to: string; badge: string }> = {
  l3: { accent: "#10b981", from: "#064e3b", to: "#022c22", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  l4: { accent: "#38bdf8", from: "#0c2a4a", to: "#071828", badge: "bg-sky-500/20 text-sky-300 border-sky-500/40" },
  l5: { accent: "#a78bfa", from: "#2e1065", to: "#1a0a3e", badge: "bg-violet-500/20 text-violet-300 border-violet-500/40" },
};

function scoreInfo(s: number | null) {
  if (s === null) return { label: "Pending", color: "#94a3b8", cls: "text-slate-400", bg: "bg-slate-700/30" };
  if (s >= 80) return { label: "Excellent", color: "#10b981", cls: "text-emerald-400", bg: "bg-emerald-500/20" };
  if (s >= 60) return { label: "Good", color: "#38bdf8", cls: "text-sky-400", bg: "bg-sky-500/20" };
  if (s >= 40) return { label: "Fair", color: "#f59e0b", cls: "text-amber-400", bg: "bg-amber-500/20" };
  return { label: "Needs Work", color: "#ef4444", cls: "text-rose-400", bg: "bg-rose-500/20" };
}

function Donut({ score, size = 64, accent }: { score: number; size?: number; accent: string }) {
  const r = size / 2 - 5; const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth="5" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={accent} strokeWidth="5"
          strokeDasharray={`${(score / 100) * c} ${c}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 3px ${accent})`, transition: "stroke-dasharray 1.2s cubic-bezier(.34,1.56,.64,1)" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-extrabold tabular-nums" style={{ fontSize: size * 0.22, color: accent }}>{score}%</span>
      </div>
    </div>
  );
}

// ─── PDF Generation for Project Results ────────────────────────────────────────

function buildProjectResultsPDF(student: Student, projectSubmissions: ProjectSubmission[]) {
  const col = (s: number) =>
    s >= 80 ? "#16a34a" : s >= 60 ? "#0284c7" : s >= 40 ? "#d97706" : "#dc2626";

  const projectRows = projectSubmissions.map(proj => `
    <div style="page-break-inside:avoid;margin-bottom:24px;border-radius:12px;border:2px solid #cbd5e1;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.07)">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;background:#f1f5f9;border-bottom:2px solid #cbd5e1">
        <div>
          <span style="font-size:18px;margin-right:8px">📁</span>
          <strong style="font-size:15px;color:#0f172a;font-weight:800">${proj.project?.title || "Untitled Project"}</strong>
          ${proj.status === "revision_requested" ? '<span style="margin-left:10px;font-size:11px;background:#fef3c7;color:#92400e;padding:3px 9px;border-radius:5px;font-weight:800">⚠️ Revision Requested</span>' : ""}
        </div>
        <div style="text-align:right">
          <div style="font-size:28px;font-weight:900;color:${col(proj.grade)};line-height:1">${proj.grade}%</div>
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#334155;margin-top:3px">${scoreInfo(proj.grade).label}</div>
        </div>
      </div>
      <div style="padding:20px">
        ${proj.feedback ? `
          <div style="margin-bottom:16px">
            <div style="font-size:11px;font-weight:800;text-transform:uppercase;color:#475569;margin-bottom:6px">💬 TEACHER'S FEEDBACK</div>
            <div style="padding:12px;background:#f8fafc;border-left:3px solid #0284c7;border-radius:4px;font-size:13px;color:#0f172a;line-height:1.6">${proj.feedback}</div>
          </div>
        ` : ''}
        <div style="margin-bottom:12px">
          <div style="font-size:11px;font-weight:800;text-transform:uppercase;color:#475569;margin-bottom:6px">🔗 SUBMISSION</div>
          <div style="font-size:12px;color:#0284c7;word-break:break-all">${proj.submissionUrl}</div>
          ${proj.note ? `<div style="font-size:11px;color:#64748b;font-style:italic;margin-top:4px">Note: ${proj.note}</div>` : ''}
        </div>
        ${proj.fileUrl ? `
          <div style="margin-bottom:12px">
            <div style="font-size:11px;font-weight:800;text-transform:uppercase;color:#475569;margin-bottom:6px">📎 ATTACHED FILE</div>
            <div style="font-size:12px;color:#0284c7">${proj.fileName || 'Download File'}</div>
          </div>
        ` : ''}
        <div style="padding-top:12px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b">
          <strong>Submitted:</strong> ${new Date(proj.submittedAt).toLocaleDateString("en-GB")} 
          ${proj.gradedAt ? ` • <strong>Graded:</strong> ${new Date(proj.gradedAt).toLocaleDateString("en-GB")}` : ''}
        </div>
      </div>
    </div>
  `).join("");

  const avgGrade = projectSubmissions.length
    ? Math.round(projectSubmissions.reduce((s, p) => s + p.grade, 0) / projectSubmissions.length)
    : 0;

  return `<!DOCTYPE html><html><head>
    <title>Project Results — ${student.name ?? student.email}</title>
    <meta charset="UTF-8" />
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#fff;color:#0f172a;padding:32px}@media print{body{padding:16px}@page{margin:1.5cm}}</style>
  </head><body>
    <div style="background:linear-gradient(135deg,#7c3aed 0%,#5b21b6 100%);color:white;padding:32px 36px;border-radius:14px;margin-bottom:32px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:20px">
        <div>
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:.12em;opacity:.75;margin-bottom:6px;font-weight:700">RUNDA TSS Tech Club</div>
          <h1 style="font-size:28px;font-weight:900;letter-spacing:-.5px">Project Results Certificate</h1>
          <p style="font-size:15px;opacity:.95;margin-top:6px;font-weight:600">${student.name ?? "Student"}</p>
          <p style="font-size:12px;opacity:.75;margin-top:2px">${student.email}</p>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;opacity:.7;margin-bottom:8px;font-weight:600">Generated: ${new Date().toLocaleDateString("en-GB")}</div>
          <div style="font-size:13px;opacity:.9;font-weight:700">${projectSubmissions.length} project${projectSubmissions.length !== 1 ? "s" : ""} graded</div>
        </div>
      </div>
      <div style="display:flex;gap:28px;margin-top:24px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.25)">
        ${[
      { v: `${avgGrade}%`, l: "Average Grade", c: col(avgGrade) },
      { v: String(projectSubmissions.length), l: "Projects Completed", c: "#fff" },
      { v: String(projectSubmissions.filter(p => p.grade >= 70).length), l: "Passed (≥70%)", c: "#4ade80" },
      { v: String(projectSubmissions.filter(p => p.status === "revision_requested").length), l: "Needs Revision", c: "#fca5a5" },
    ].map(st => `<div><div style="font-size:28px;font-weight:900;color:${st.c};line-height:1">${st.v}</div><div style="font-size:10px;opacity:.75;text-transform:uppercase;margin-top:4px;font-weight:700">${st.l}</div></div>`).join("")}
      </div>
    </div>
    <h2 style="font-size:18px;font-weight:800;margin-bottom:18px;color:#0f172a">Project Assessment Results</h2>
    ${projectRows || '<p style="color:#334155;font-size:14px;font-weight:600;text-align:center;padding:40px">No graded projects available</p>'}
  </body></html>`;
}

// ─── Print / Download ──────────────────────────────────────────────────────────

function buildPrintHtml(student: Student, submissions: Submission[]) {
  const overall = submissions.length
    ? Math.round(submissions.reduce((s, r) => s + (r.avgScore ?? 0), 0) / submissions.length) : 0;

  const col = (s: number | null) =>
    s === null ? "#64748b" : s >= 80 ? "#10b981" : s >= 70 ? "#22c55e" : s >= 60 ? "#3b82f6" : s >= 50 ? "#f59e0b" : s >= 40 ? "#f97316" : "#ef4444";

  const rows = submissions.map(sub => {
    const tierBadge = sub.track.tier === 'l3' ? 'L3 Certificate' :
      sub.track.tier === 'l4' ? 'L4 Certificate' :
        sub.track.tier === 'l5' ? 'L5 Diploma' : sub.track.tier.toUpperCase();

    const qRows = sub.responses.map((r, i) =>
      `<tr style="border-bottom:1px solid #d1fae5;background:${i % 2 === 0 ? '#ffffff' : '#f0fdf4'}">
        <td style="padding:8px 12px;color:#064e3b;font-size:13px;font-weight:700;text-align:center;border-right:1px solid #d1fae5">${i + 1}</td>
        <td style="padding:8px 12px;font-size:12px;color:#065f46;font-weight:600;border-right:1px solid #d1fae5">${r.questionType.replace(/_/g, ' ').toUpperCase()}</td>
        <td style="padding:8px 12px;font-size:12px;color:#064e3b;line-height:1.4;border-right:1px solid #d1fae5">
          ${r.answerText ?? (r.answerChoice !== null ? `Option ${String.fromCharCode(65 + r.answerChoice)}` : "<em style='color:#9ca3af'>No answer</em>")}
        </td>
        <td style="padding:8px 12px;text-align:center;border-right:1px solid #d1fae5">
          ${r.gradeScore !== null
        ? `<span style="display:inline-block;padding:4px 10px;border-radius:4px;background:${col(r.gradeScore)};color:#fff;font-size:13px;font-weight:800">${r.gradeScore}%</span>`
        : `<span style="color:#9ca3af;font-size:12px;font-weight:600">—</span>`}
        </td>
        <td style="padding:8px 12px;font-size:11px;color:#065f46;line-height:1.4">${r.gradeNotes ?? '—'}</td>
      </tr>`).join("");

    return `
      <div style="page-break-inside:avoid;margin-bottom:16px;border:2px solid #059669;background:#ffffff;border-radius:8px;overflow:hidden">
        <!-- Quiz Header -->
        <div style="padding:12px 16px;background:linear-gradient(90deg,#10b981 0%,#059669 100%);border-bottom:2px solid #047857;display:flex;align-items:center;justify-content:space-between">
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:18px">${sub.track.icon ?? "📚"}</span>
              <div>
                <h3 style="font-size:14px;color:#ffffff;font-weight:800;margin:0">${sub.node.title}</h3>
                <div style="display:flex;align-items:center;gap:6px;margin-top:2px">
                  <span style="font-size:11px;color:#d1fae5;font-weight:600">${sub.track.name}</span>
                  <span style="font-size:10px;color:#ffffff;background:rgba(255,255,255,.2);padding:2px 6px;border-radius:3px;font-weight:700">${tierBadge}</span>
                </div>
              </div>
            </div>
          </div>
          <div style="text-align:center;background:#ffffff;padding:8px 16px;border-radius:6px;min-width:80px">
            <div style="font-size:24px;font-weight:900;color:${col(sub.avgScore)};line-height:1">${sub.avgScore ?? "—"}%</div>
            <div style="font-size:9px;font-weight:800;text-transform:uppercase;color:#6b7280;margin-top:2px">${scoreInfo(sub.avgScore).label}</div>
          </div>
        </div>
        
        <!-- Excel-style Table -->
        <table style="width:100%;border-collapse:collapse;background:#ffffff">
          <thead>
            <tr style="background:#10b981">
              <th style="padding:10px 12px;font-size:11px;color:#ffffff;text-align:center;font-weight:800;border-right:1px solid #059669;width:50px">#</th>
              <th style="padding:10px 12px;font-size:11px;color:#ffffff;text-align:left;font-weight:800;border-right:1px solid #059669;width:120px">TYPE</th>
              <th style="padding:10px 12px;font-size:11px;color:#ffffff;text-align:left;font-weight:800;border-right:1px solid #059669">YOUR ANSWER</th>
              <th style="padding:10px 12px;font-size:11px;color:#ffffff;text-align:center;font-weight:800;border-right:1px solid #059669;width:80px">SCORE</th>
              <th style="padding:10px 12px;font-size:11px;color:#ffffff;text-align:left;font-weight:800;width:200px">FEEDBACK</th>
            </tr>
          </thead>
          <tbody>${qRows || '<tr><td colspan="5" style="padding:20px;text-align:center;color:#6b7280;font-size:12px;font-weight:600;background:#f9fafb">No responses recorded</td></tr>'}</tbody>
        </table>
        
        <!-- Footer -->
        <div style="padding:8px 16px;background:#f0fdf4;border-top:2px solid #d1fae5;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#065f46;font-weight:600">
          <span>Submitted: ${new Date(sub.createdAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</span>
          <span>${sub.totalQuestions} Questions · ${sub.gradedCount} Graded</span>
        </div>
      </div>`;
  }).join("");

  const passCount = submissions.filter(s => (s.avgScore ?? 0) >= 70).length;
  const excellentCount = submissions.filter(s => (s.avgScore ?? 0) >= 80).length;
  const revisionCount = submissions.filter(s => (s.avgScore ?? 0) < 50).length;

  return `<!DOCTYPE html><html lang="en"><head>
    <title>Quiz Results — ${student.name ?? student.email}</title>
    <meta charset="UTF-8" />
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: Calibri, 'Segoe UI', Arial, sans-serif;
        background: #ecfdf5;
        color: #064e3b;
        padding: 20px;
        line-height: 1.4;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      @media print {
        body { padding: 10px; background: #ecfdf5; }
        @page { margin: 0.8cm; size: A4; }
      }
    </style>
  </head><body>
    
    <!-- HEADER -->
    <div style="background:#ffffff;border:3px solid #10b981;border-radius:8px;margin-bottom:16px;overflow:hidden">
      <!-- Top Green Bar -->
      <div style="background:linear-gradient(90deg,#10b981 0%,#059669 100%);padding:16px 20px">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:48px;height:48px;background:#ffffff;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px">🎓</div>
            <div>
              <div style="font-size:11px;color:#d1fae5;font-weight:700;letter-spacing:.1em;margin-bottom:2px">RUNDA TSS TECH CLUB</div>
              <h1 style="font-size:20px;font-weight:900;color:#ffffff;margin:0">QUIZ RESULTS REPORT</h1>
            </div>
          </div>
          <div style="text-align:right;background:#ffffff;padding:10px 16px;border-radius:6px">
            <div style="font-size:10px;color:#6b7280;font-weight:700;margin-bottom:2px">REPORT DATE</div>
            <div style="font-size:13px;font-weight:800;color:#064e3b">${new Date().toLocaleDateString("en-GB")}</div>
          </div>
        </div>
      </div>
      
      <!-- Student Info Row -->
      <div style="padding:12px 20px;background:#f0fdf4;border-top:2px solid #d1fae5;border-bottom:2px solid #d1fae5">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div>
            <div style="font-size:9px;color:#059669;font-weight:800;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">STUDENT NAME</div>
            <div style="font-size:14px;font-weight:800;color:#064e3b">${student.name ?? "Student"}</div>
            <div style="font-size:11px;color:#065f46;font-weight:600;margin-top:2px">${student.email}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:9px;color:#059669;font-weight:800;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">QUIZZES COMPLETED</div>
            <div style="font-size:20px;font-weight:900;color:#10b981">${submissions.length}</div>
          </div>
        </div>
      </div>
      
      <!-- Statistics Row -->
      <div style="padding:12px 20px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
        ${[
      { value: `${overall}%`, label: "Overall Avg", color: col(overall), icon: "📊" },
      { value: String(excellentCount), label: "Excellent (≥80%)", color: "#10b981", icon: "⭐" },
      { value: String(passCount), label: "Passed (≥70%)", color: "#22c55e", icon: "✓" },
      { value: String(revisionCount), label: "Need Revision", color: revisionCount > 0 ? "#ef4444" : "#9ca3af", icon: revisionCount > 0 ? "⚠️" : "✓" },
    ].map(stat => `
          <div style="padding:10px;background:#f0fdf4;border:2px solid #d1fae5;border-radius:6px;text-align:center">
            <div style="font-size:18px;margin-bottom:4px">${stat.icon}</div>
            <div style="font-size:20px;font-weight:900;color:${stat.color};line-height:1">${stat.value}</div>
            <div style="font-size:9px;color:#065f46;font-weight:700;text-transform:uppercase;margin-top:4px">${stat.label}</div>
          </div>
        `).join("")}
      </div>
    </div>

    <!-- OVERALL PERFORMANCE BAR -->
    <div style="margin-bottom:16px;padding:12px 16px;background:#ffffff;border:2px solid #10b981;border-radius:8px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div style="font-size:11px;font-weight:800;color:#065f46;text-transform:uppercase">Overall Performance</div>
        <div style="font-size:18px;font-weight:900;color:${col(overall)}">${overall}%</div>
      </div>
      <div style="height:16px;background:#d1fae5;border-radius:8px;overflow:hidden;border:1px solid #10b981">
        <div style="height:100%;background:${col(overall)};width:${overall}%"></div>
      </div>
    </div>

    <!-- SECTION TITLE -->
    <div style="margin-bottom:12px;padding:8px 12px;background:#10b981;border-radius:6px 6px 0 0">
      <h2 style="font-size:13px;font-weight:900;color:#ffffff;margin:0;text-transform:uppercase;letter-spacing:.05em">📋 Detailed Quiz Results</h2>
    </div>

    <!-- QUIZ RESULTS -->
    ${rows || '<div style="padding:40px;text-align:center;background:#ffffff;border:2px solid #d1fae5;border-radius:8px"><div style="font-size:32px;margin-bottom:12px;opacity:.4">📋</div><p style="color:#6b7280;font-size:14px;font-weight:700">No results available</p></div>'}

    <!-- FOOTER -->
    <div style="margin-top:16px;padding:12px;background:#ffffff;border:2px solid #10b981;border-radius:8px;text-align:center">
      <div style="font-size:9px;color:#065f46;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">ISSUED BY</div>
      <div style="font-size:14px;font-weight:900;color:#064e3b;margin-bottom:2px">RUNDA TSS TECH CLUB</div>
      <div style="font-size:10px;color:#059669;font-weight:600">Technical and Vocational Education Training</div>
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid #d1fae5;font-size:9px;color:#6b7280;font-weight:600">
        Report generated: ${new Date().toLocaleDateString("en-GB")} at ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  </body></html>`;
}

// ─── Main Page Component ───────────────────────────────────────────────────────

export default function MyResultsClient({
  student,
  submissions,
  projectSubmissions = [],
  pendingRelease = 0
}: {
  student: Student;
  submissions: Submission[];
  projectSubmissions?: ProjectSubmission[];
  pendingRelease?: number
}) {
  const [selected, setSelected] = useState<Submission | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectSubmission | null>(null);

  // Mark project results as viewed on mount
  useEffect(() => {
    if (projectSubmissions && projectSubmissions.length > 0) {
      fetch("/api/projects/mark-viewed", { method: "POST" })
        .catch(() => {
          // Silently fail
        });
    }
  }, [projectSubmissions]);

  const overall = submissions.length
    ? Math.round(submissions.reduce((s, r) => s + (r.avgScore ?? 0), 0) / submissions.length)
    : null;

  const projectAverage = projectSubmissions.length
    ? Math.round(projectSubmissions.reduce((s, p) => s + p.grade, 0) / projectSubmissions.length)
    : null;

  function download() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download the PDF');
      return;
    }

    printWindow.document.write(buildPrintHtml(student, submissions));
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  }

  function downloadProjectResults() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download the PDF');
      return;
    }

    printWindow.document.write(buildProjectResultsPDF(student, projectSubmissions));
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* ── Top nav bar ── */}
      <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/passport"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition font-medium">
            ← Passport
          </Link>
          <span className="text-slate-700">·</span>
          <span className="text-sm font-bold text-white">My Quiz Results</span>
        </div>
        {submissions.length > 0 && (
          <button onClick={download}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition shadow-lg hover:shadow-emerald-500/25">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download / Print
          </button>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Pending release notice ── */}
        {pendingRelease > 0 && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/8 px-5 py-4 flex items-center gap-4">
            <span className="text-3xl shrink-0">⏳</span>
            <div className="flex-1">
              <p className="font-bold text-amber-300 text-sm">
                {pendingRelease} quiz result{pendingRelease > 1 ? "s" : ""} awaiting release
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Your teacher has graded {pendingRelease > 1 ? "these quizzes" : "this quiz"} but has not released the marks yet.
                You will receive a notification and see the results here once they are released.
              </p>
            </div>
          </div>
        )}

        {/* ── Summary header card ── */}
        {submissions.length > 0 ? (
          <div className="rounded-2xl overflow-hidden border border-slate-700/60"
            style={{ background: "linear-gradient(135deg, #0c1f35 0%, #0f172a 100%)" }}>
            <div className="flex items-center gap-6 p-6 flex-wrap">
              {overall !== null && (
                <Donut score={overall} size={96}
                  accent={overall >= 80 ? "#10b981" : overall >= 60 ? "#38bdf8" : overall >= 40 ? "#f59e0b" : "#ef4444"} />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-400 font-medium">Welcome back,</p>
                <p className="text-xl font-extrabold text-white truncate">{student.name ?? student.email}</p>
                {overall !== null && (
                  <p className={`text-sm font-bold mt-1 ${scoreInfo(overall).cls}`}>
                    Overall: {scoreInfo(overall).label}
                  </p>
                )}
              </div>
              <div className="flex gap-3 flex-wrap">
                {[
                  { n: submissions.length, l: "Total Quizzes", c: "text-white" },
                  { n: submissions.filter(s => (s.avgScore ?? 0) >= 70).length, l: "Passed (≥70%)", c: "text-emerald-400" },
                  { n: submissions.filter(s => (s.avgScore ?? 0) >= 80).length, l: "Excellent (≥80%)", c: "text-sky-400" },
                  { n: submissions.filter(s => (s.avgScore ?? 0) < 40).length, l: "Need Revision", c: "text-rose-400" },
                ].map(stat => (
                  <div key={stat.l} className="rounded-xl bg-slate-800/60 px-4 py-3 text-center min-w-[80px]">
                    <p className={`text-2xl font-extrabold ${stat.c}`}>{stat.n}</p>
                    <p className="text-[10px] text-slate-500 uppercase mt-0.5">{stat.l}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Overall progress bar */}
            {overall !== null && (
              <div className="px-6 pb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-slate-500">Overall Average</span>
                  <span className="text-[11px] font-bold" style={{ color: overall >= 70 ? "#10b981" : overall >= 40 ? "#f59e0b" : "#ef4444" }}>{overall}%</span>
                </div>
                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${overall}%`, background: `linear-gradient(90deg, ${overall >= 80 ? "#10b981" : overall >= 60 ? "#38bdf8" : overall >= 40 ? "#f59e0b" : "#ef4444"}, ${overall >= 80 ? "#34d399" : overall >= 60 ? "#7dd3fc" : overall >= 40 ? "#fbbf24" : "#f87171"})` }} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-16 text-center space-y-4">
            <div className="text-6xl">📋</div>
            <div>
              <p className="text-lg font-bold text-white">No released results yet</p>
              <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
                {pendingRelease > 0
                  ? `You have ${pendingRelease} graded quiz${pendingRelease > 1 ? "zes" : ""} waiting for your teacher to release the marks.`
                  : "Your results will appear here once your teacher grades and releases your quiz submissions."}
              </p>
              {pendingRelease > 0 && (
                <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-bold">
                  ⏳ {pendingRelease} result{pendingRelease > 1 ? "s" : ""} awaiting release
                </div>
              )}
            </div>
            <Link href="/passport" className="inline-flex items-center gap-2 text-sm text-sky-400 hover:text-sky-300 transition font-medium">
              ← Back to Passport
            </Link>
          </div>
        )}

        {/* ── Detail panel (selected quiz) ── */}
        {selected && (
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 overflow-hidden">
            {(() => {
              const t = TIER[selected.track.tier] ?? TIER.l4;
              const si = scoreInfo(selected.avgScore);
              return (
                <>
                  {/* Detail header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60"
                    style={{ background: `linear-gradient(90deg, ${t.from}80, transparent)` }}>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setSelected(null)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition">
                        ✕
                      </button>
                      <div>
                        <p className="font-bold text-white">{selected.node.title}</p>
                        <p className="text-xs text-slate-500">{selected.track.icon ?? "📚"} {selected.track.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {selected.autoSubmitted && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          🚨 Auto-submitted
                        </span>
                      )}
                      <Donut score={selected.avgScore ?? 0} size={52} accent={t.accent} />
                    </div>
                  </div>

                  {/* Score summary row */}
                  <div className="flex items-center gap-4 px-5 py-3 border-b border-slate-800/60 bg-slate-900/30">
                    <span className={`text-sm font-extrabold px-3 py-1 rounded-full border ${t.badge}`}>
                      {si.label}
                    </span>
                    <span className="text-xs text-slate-500">{selected.gradedCount}/{selected.totalQuestions} questions graded</span>
                    {selected.marksReleasedAt ? (
                      <span className="text-xs text-emerald-500 ml-auto flex items-center gap-1">
                        📤 Released {new Date(selected.marksReleasedAt).toLocaleDateString("en-GB")}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600 ml-auto">Graded {new Date(selected.updatedAt).toLocaleDateString("en-GB")}</span>
                    )}
                  </div>

                  {/* Questions */}
                  <div className="divide-y divide-slate-800/40">
                    {selected.responses.length === 0 && (
                      <p className="px-5 py-6 text-sm text-slate-600 text-center">No detailed responses recorded</p>
                    )}
                    {selected.responses.map((r, i) => {
                      const rs = scoreInfo(r.gradeScore);
                      return (
                        <div key={r.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-800/20 transition">
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{r.questionType}</p>
                            <p className="text-sm text-slate-300 leading-relaxed">
                              {r.answerText ?? (r.answerChoice !== null ? `Option ${String.fromCharCode(65 + r.answerChoice)} ` : <em className="text-slate-600">No answer recorded</em>)}
                            </p>
                            {r.gradeNotes && (
                              <div className="flex items-start gap-2 mt-1.5 rounded-lg bg-sky-500/8 border border-sky-500/20 px-3 py-2">
                                <span className="text-sky-400 text-xs shrink-0 mt-0.5">💬</span>
                                <p className="text-xs text-sky-300 italic">{r.gradeNotes}</p>
                              </div>
                            )}
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-1">
                            {r.gradeScore !== null ? (
                              <>
                                <span className={`text-sm font-extrabold ${rs.cls}`}>{r.gradeScore}%</span>
                                <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${r.gradeScore}%`, background: rs.color }} />
                                </div>
                              </>
                            ) : (
                              <span className="text-xs text-slate-600 bg-slate-800 px-2.5 py-1 rounded-full">Ungraded</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* ── Project Results Section ── */}
        {projectSubmissions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">📊 Project Marks</p>
              <div className="flex items-center gap-3">
                <button onClick={downloadProjectResults}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg hover:shadow-purple-500/25">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download PDF
                </button>
                <p className="text-xs text-slate-600">{projectSubmissions.length} project{projectSubmissions.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            {projectSubmissions.map((proj) => {
              const si = scoreInfo(proj.grade);
              const isActive = selectedProject?.id === proj.id;
              return (
                <button key={proj.id} onClick={() => setSelectedProject(isActive ? null : proj)}
                  className={`w-full text-left rounded-2xl border transition-all group overflow-hidden ${isActive ? "border-slate-500 bg-slate-800/60" : "border-slate-700/50 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-600"}`}>
                  <div className="h-0.5" style={{ background: "linear-gradient(90deg, #a78bfa88, transparent)" }} />
                  <div className="flex items-center gap-4 p-4">
                    <Donut score={proj.grade} size={56} accent="#a78bfa" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-white text-sm">{proj.project?.title || "Untitled Project"}</p>
                        {proj.status === "revision_requested" && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">⚠️ Revision</span>
                        )}
                        {proj.status === "graded" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            ✓ Graded
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">📁 Team Project</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border bg-purple-500/20 text-purple-300 border-purple-500/40`}>
                          {si.label}
                        </span>
                        {proj.gradedAt && (
                          <span className="text-[10px] text-purple-400">
                            Graded {new Date(proj.gradedAt).toLocaleDateString("en-GB")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text - xs font - bold px - 3 py - 1.5 rounded - xl transition ${isActive ? "bg-slate-700 text-slate-300" : "text-slate-600 group-hover:text-slate-400"} `}>
                        {isActive ? "▲ Close" : "▼ Details"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Project Detail Panel */}
        {selectedProject && (
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60"
              style={{ background: "linear-gradient(90deg, #2e106580, transparent)" }}>
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedProject(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition">
                  ✕
                </button>
                <div>
                  <p className="font-bold text-white">{selectedProject.project?.title || "Untitled Project"}</p>
                  <p className="text-xs text-slate-500">📁 Team Project Submission</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {selectedProject.status === "revision_requested" && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    ⚠️ Revision Requested
                  </span>
                )}
                <Donut score={selectedProject.grade} size={52} accent="#a78bfa" />
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Grade */}
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Your Grade</p>
                <p className="text-4xl font-extrabold text-purple-400">{selectedProject.grade}/100</p>
                <p className="text-sm text-purple-300 mt-1">{scoreInfo(selectedProject.grade).label}</p>
              </div>

              {/* Feedback */}
              {selectedProject.feedback && (
                <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-sky-400 text-sm">💬</span>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Teacher's Feedback</p>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{selectedProject.feedback}</p>
                </div>
              )}

              {/* Submission URL */}
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Your Submission</p>
                <a
                  href={selectedProject.submissionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 underline break-all"
                >
                  {selectedProject.submissionUrl}
                </a>
                {selectedProject.note && (
                  <p className="text-xs text-slate-500 italic mt-2">Note: {selectedProject.note}</p>
                )}
              </div>

              {/* Attached File */}
              {selectedProject.fileUrl && (
                <div className="rounded-xl border border-emerald-700/50 bg-emerald-900/20 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">📎 Attached File</p>
                  <a
                    href={selectedProject.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-emerald-400 hover:text-emerald-300 underline break-all flex items-center gap-2"
                  >
                    <span>📄</span>
                    {selectedProject.fileName || "Download File"}
                  </a>
                  {selectedProject.fileType && (
                    <p className="text-xs text-slate-600 mt-1">Type: {selectedProject.fileType}</p>
                  )}
                </div>
              )}

              {/* Timestamps */}
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span>Submitted: {new Date(selectedProject.submittedAt).toLocaleDateString("en-GB")}</span>
                {selectedProject.gradedAt && (
                  <span>• Graded: {new Date(selectedProject.gradedAt).toLocaleDateString("en-GB")}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Results list ── */}
        {submissions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">All Graded Quizzes</p>
              <p className="text-xs text-slate-600">{submissions.length} result{submissions.length !== 1 ? "s" : ""}</p>
            </div>
            {submissions.map((sub) => {
              const t = TIER[sub.track.tier] ?? TIER.l4;
              const si = scoreInfo(sub.avgScore);
              const isActive = selected?.id === sub.id;
              return (
                <button key={sub.id} onClick={() => setSelected(isActive ? null : sub)}
                  className={`w-full text-left rounded-2xl border transition-all group overflow-hidden ${isActive ? "border-slate-500 bg-slate-800/60" : "border-slate-700/50 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-600"}`}>
                  {/* Tier accent strip */}
                  <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${t.accent}88, transparent)` }} />
                  <div className="flex items-center gap-4 p-4">
                    <Donut score={sub.avgScore ?? 0} size={56} accent={t.accent} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-white text-sm">{sub.node.title}</p>
                        {sub.autoSubmitted && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">🚨</span>
                        )}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          📤 Released
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{sub.track.icon ?? "📚"} {sub.track.name}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${t.badge}`}>{si.label}</span>
                        <span className="text-[10px] text-slate-600">{sub.gradedCount}/{sub.totalQuestions} graded</span>
                        {sub.marksReleasedAt && (
                          <span className="text-[10px] text-emerald-600">
                            Released {new Date(sub.marksReleasedAt).toLocaleDateString("en-GB")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${isActive ? "bg-slate-700 text-slate-300" : "text-slate-600 group-hover:text-slate-400"}`}>
                        {isActive ? "▲ Close" : "▼ Details"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
