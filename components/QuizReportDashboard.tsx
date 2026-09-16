"use client";

import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Response = {
  id: string;
  questionIdx: number;
  questionType: string;
  answerText: string | null;
  answerChoice: number | null;
  gradeScore: number | null;
  gradeNotes: string | null;
  gradedAt: string | null;
};

type Submission = {
  id: string;
  nodeId: string;
  blockId: string;
  status: string;
  totalQuestions: number;
  gradedCount: number;
  avgScore: number | null;
  cheatAttempts: number;
  autoSubmitted: boolean;
  createdAt: string;
  node: { id: string; title: string };
  responses: Response[];
};

type StudentReport = {
  student: { id: string; name: string | null; email: string };
  submissions: Submission[];
  totalAttempts: number;
  averageScore: number | null;
  cheatFlags: number;
  autoSubmissions: number;
};

type CheatNotification = {
  id: string;
  studentName: string;
  nodeTitle: string;
  attemptNumber: number;
  autoSubmitted: boolean;
  createdAt: string;
};

export default function QuizReportDashboard({ trackId }: { trackId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<StudentReport[]>([]);
  const [cheatLogs, setCheatLogs] = useState<CheatNotification[]>([]);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<StudentReport | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "cheating">("overview");
  const [error, setError] = useState<string | null>(null);
  const [lastCheatCount, setLastCheatCount] = useState(0);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/quiz/report?trackId=${encodeURIComponent(trackId)}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to load"); return; }

      const newCheatLogs = data.cheatNotifications ?? [];
      const previousCount = lastCheatCount;

      setStudents(data.students ?? []);
      setCheatLogs(newCheatLogs);
      setTotalSubmissions(data.totalSubmissions ?? 0);
      setLastCheatCount(newCheatLogs.length);

      // Notify teacher of new cheat events
      if (previousCount > 0 && newCheatLogs.length > previousCount) {
        const newEvents = newCheatLogs.length - previousCount;
        showCheatNotification(newEvents, newCheatLogs[0]);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  // Browser notification for new cheat events
  function showCheatNotification(count: number, latest: CheatNotification) {
    // Desktop notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🚨 Quiz Integrity Alert', {
        body: `${latest.studentName} ${latest.autoSubmitted ? 'auto-submitted' : 'triggered violation'} on ${latest.nodeTitle}`,
        icon: '/favicon.ico',
        tag: 'cheat-alert',
        requireInteraction: true,
      });
    }

    // Audio alert (simple beep)
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.2);

      // Second beep
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.frequency.value = 1000;
        osc2.type = 'sine';
        gain2.gain.value = 0.3;
        osc2.start(audioCtx.currentTime);
        osc2.stop(audioCtx.currentTime + 0.2);
      }, 300);
    } catch { }
  }

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (open) {
      load();

      // Auto-refresh every 10 seconds to catch new cheat events
      const interval = setInterval(() => {
        load();
      }, 10000); // 10 seconds

      return () => clearInterval(interval);
    }
  }, [open]);

  async function generateIndividualPDFs() {
    if (students.length === 0) {
      alert('❌ No student data to generate reports');
      return;
    }

    try {
      const generatedCount = students.length;

      for (const student of students) {
        await generateStudentPDF(student);
      }

      alert(`✅ Successfully generated ${generatedCount} PDF report${generatedCount > 1 ? 's' : ''}!`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('❌ Error generating PDFs. Check console for details.');
    }
  }

  async function generateStudentPDF(student: StudentReport) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // Header with better spacing
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('Quiz & Assessment Report', 14, yPos);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('RUNDA TSS Tech Club', pageWidth - 14, yPos, { align: 'right' });

    yPos += 6;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-GB")} at ${new Date().toLocaleTimeString("en-GB")}`, pageWidth - 14, yPos, { align: 'right' });

    yPos += 2;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, yPos, pageWidth - 14, yPos);

    // Student header - more spacious
    yPos += 8;
    const boxHeight = 32;
    doc.setFillColor(30, 64, 175);
    doc.roundedRect(14, yPos, pageWidth - 28, boxHeight, 3, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(student.student.name ?? 'Unknown Student', 20, yPos + 10);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(student.student.email, 20, yPos + 18);

    // Stats - better aligned
    const statBoxY = yPos + 8;
    const stat1X = pageWidth - 105;
    const stat2X = pageWidth - 70;
    const stat3X = pageWidth - 35;

    const avgScoreColor: [number, number, number] = student.averageScore === null ? [148, 163, 184]
      : student.averageScore >= 70 ? [52, 211, 153]
        : student.averageScore >= 50 ? [251, 191, 36]
          : [248, 113, 113];

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...avgScoreColor);
    doc.text(student.averageScore !== null ? `${student.averageScore}%` : '—', stat1X, statBoxY + 6);
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('AVG SCORE', stat1X, statBoxY + 12);

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`${student.totalAttempts}`, stat2X, statBoxY + 6);
    doc.setFontSize(7);
    doc.text('QUIZZES', stat2X, statBoxY + 12);

    if (student.cheatFlags > 0 || student.autoSubmissions > 0) {
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(251, 191, 36);
      doc.text(`${student.cheatFlags}`, stat3X, statBoxY + 6);
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text('VIOLATIONS', stat3X, statBoxY + 12);
    }

    yPos += boxHeight + 12;
    doc.setTextColor(0, 0, 0);

    // Submissions
    if (student.submissions.length === 0) {
      doc.setFontSize(11);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'italic');
      doc.text('No quiz submissions found for this student.', 14, yPos);
    } else {
      for (let subIdx = 0; subIdx < student.submissions.length; subIdx++) {
        const sub = student.submissions[subIdx];

        if (yPos > pageHeight - 60) {
          doc.addPage();
          yPos = 20;
        }

        // Submission header
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(14, yPos, pageWidth - 28, 14, 2, 2, 'F');

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(sub.node.title, 18, yPos + 6);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(new Date(sub.createdAt).toLocaleDateString("en-GB", {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }), 18, yPos + 11);

        // Status badges
        let badgeX = pageWidth - 22;

        const scoreColor: [number, number, number] = sub.avgScore !== null
          ? (sub.avgScore >= 70 ? [22, 163, 74] : sub.avgScore >= 50 ? [217, 119, 6] : [220, 38, 38])
          : [148, 163, 184];
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(...scoreColor);
        doc.text(sub.avgScore !== null ? `${sub.avgScore}%` : 'Ungraded', badgeX, yPos + 9, { align: 'right' });
        badgeX -= 35;

        if (sub.autoSubmitted) {
          doc.setFontSize(8);
          doc.setTextColor(220, 38, 38);
          doc.setFont('helvetica', 'bold');
          doc.text('AUTO-SUBMIT', badgeX, yPos + 9, { align: 'right' });
          badgeX -= 25;
        }

        if (sub.cheatAttempts > 0 && !sub.autoSubmitted) {
          doc.setFontSize(8);
          doc.setTextColor(217, 119, 6);
          doc.setFont('helvetica', 'bold');
          doc.text(`${sub.cheatAttempts} VIOLATION${sub.cheatAttempts > 1 ? 'S' : ''}`, badgeX, yPos + 9, { align: 'right' });
        }

        yPos += 16;

        // Table with improved formatting
        if (sub.responses.length > 0) {
          const tableData = sub.responses.map((resp, qi) => {
            let answer = '—';
            if (resp.answerText && resp.answerText.trim() && resp.answerText !== '[AUTO-SUBMITTED]') {
              answer = resp.answerText.length > 50
                ? resp.answerText.substring(0, 47) + '...'
                : resp.answerText;
            } else if (resp.answerChoice !== null) {
              answer = `Option ${String.fromCharCode(65 + resp.answerChoice)}`;
            } else {
              answer = '[No answer]';
            }

            const score = resp.gradeScore !== null ? `${resp.gradeScore}%` : 'Not graded';

            let feedback = resp.gradeNotes ?? '—';
            if (feedback.length > 100) {
              feedback = feedback.substring(0, 97) + '...';
            }

            return [
              `Q${qi + 1}`,
              resp.questionType.replace('MULTISELECT', 'MULTI').replace('SHORTANSWER', 'SHORT').replace('TRUEFALSE', 'T/F').replace('FILEUPLOAD', 'FILE'),
              answer,
              score,
              feedback
            ];
          });

          autoTable(doc, {
            startY: yPos,
            head: [['#', 'Type', 'Student Answer', 'Score', 'AI Feedback']],
            body: tableData,
            margin: { left: 14, right: 14 },
            styles: {
              fontSize: 8,
              cellPadding: 3,
              overflow: 'linebreak',
              cellWidth: 'wrap'
            },
            headStyles: {
              fillColor: [226, 232, 240],
              textColor: [51, 65, 85],
              fontStyle: 'bold',
              halign: 'left'
            },
            columnStyles: {
              0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
              1: { cellWidth: 20, halign: 'left' },
              2: { cellWidth: 52, halign: 'left' },
              3: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
              4: { cellWidth: 76, halign: 'left' }
            },
            alternateRowStyles: {
              fillColor: [249, 250, 251]
            },
            didParseCell: function (data) {
              if (data.column.index === 3 && data.section === 'body') {
                const scoreText = data.cell.text[0];
                if (scoreText && scoreText.includes('%')) {
                  const score = parseInt(scoreText);
                  if (score >= 70) {
                    data.cell.styles.textColor = [22, 163, 74];
                  } else if (score >= 50) {
                    data.cell.styles.textColor = [217, 119, 6];
                  } else {
                    data.cell.styles.textColor = [220, 38, 38];
                  }
                } else {
                  data.cell.styles.textColor = [148, 163, 184];
                }
              }
            }
          });

          yPos = (doc as any).lastAutoTable.finalY + 10;
        } else {
          doc.setFontSize(9);
          doc.setTextColor(148, 163, 184);
          doc.setFont('helvetica', 'italic');
          doc.text('No responses recorded for this quiz.', 18, yPos);
          yPos += 12;
        }
      }
    }

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Report generated for ${student.student.name} | RUNDA TSS Tech Club © ${new Date().getFullYear()}`,
      pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Save
    const fileName = `quiz-report-${student.student.name?.replace(/[^a-z0-9]/gi, '-') ?? student.student.id}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  const unreadCheat = cheatLogs.filter(c => c.autoSubmitted).length;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-40 flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-sky-700 to-sky-800 text-white font-bold text-sm shadow-lg hover:shadow-xl transition">
        <span className="text-lg">📊</span>
        <span>Quiz Reports</span>
        {unreadCheat > 0 && (
          <span className="px-2 py-1 rounded-full bg-rose-500 text-xs font-bold">{unreadCheat}</span>
        )}
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
        <div className="rounded-2xl border border-slate-700 bg-slate-950 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">

          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-sky-700/20 to-slate-900">
            <div>
              <h2 className="font-extrabold text-white text-lg">Quiz & Assessment Reports</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {students.length} students · {totalSubmissions} submissions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={load} disabled={loading}
                className="text-xs text-slate-400 hover:text-white border border-slate-700 rounded-lg px-3 py-1.5 transition">
                {loading ? "⟳" : "↺"} Refresh
              </button>
              <button onClick={generateIndividualPDFs}
                className="text-xs text-white bg-sky-700 hover:bg-sky-600 rounded-lg px-3 py-1.5 transition">
                📄 Generate PDF Reports
              </button>
              <button onClick={() => { setOpen(false); setSelectedStudent(null); }}
                className="text-slate-400 hover:text-white text-2xl transition ml-2">✕</button>
            </div>
          </div>

          {/* Tabs */}
          <div className="shrink-0 flex gap-1 px-6 pt-3">
            {(["overview", "cheating"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === tab ? "bg-sky-700 text-white" : "text-slate-400 hover:text-white"}`}>
                {tab === "overview" ? "📋 Student Overview" : `🚨 Cheat Log (${cheatLogs.length})`}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {error && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-sm text-rose-300">{error}</div>
            )}

            {loading ? (
              <div className="text-center text-slate-400 py-12">Loading report...</div>
            ) : activeTab === "overview" ? (
              selectedStudent
                ? <StudentDetail report={selectedStudent} onBack={() => setSelectedStudent(null)} />
                : <StudentList students={students} onSelect={setSelectedStudent} />
            ) : (
              <CheatLogView logs={cheatLogs} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Student List ─────────────────────────────────────────────────────────────

function StudentList({ students, onSelect }: {
  students: StudentReport[];
  onSelect: (s: StudentReport) => void;
}) {
  if (students.length === 0) {
    return <p className="text-slate-400 text-sm text-center py-10">No quiz submissions yet</p>;
  }

  return (
    <div className="space-y-2">
      {/* Header row */}
      <div className="grid grid-cols-6 text-[10px] font-bold uppercase text-slate-500 px-3 pb-1">
        <span className="col-span-2">Student</span>
        <span className="text-center">Quizzes</span>
        <span className="text-center">Avg Score</span>
        <span className="text-center">⚠️ Flags</span>
        <span className="text-right">Action</span>
      </div>
      {students.map(r => {
        const scoreColor = r.averageScore === null ? "text-slate-500"
          : r.averageScore >= 70 ? "text-emerald-400"
            : r.averageScore >= 50 ? "text-amber-400"
              : "text-rose-400";
        return (
          <div key={r.student.id}
            className="grid grid-cols-6 items-center rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-3 text-sm gap-2">
            <div className="col-span-2 min-w-0">
              <p className="font-bold text-white truncate">{r.student.name ?? "—"}</p>
              <p className="text-xs text-slate-500 truncate">{r.student.email}</p>
            </div>
            <p className="text-center text-slate-300">{r.totalAttempts}</p>
            <p className={`text-center font-extrabold ${scoreColor}`}>
              {r.averageScore !== null ? `${r.averageScore}%` : "—"}
            </p>
            <div className="flex items-center justify-center gap-1">
              {r.cheatFlags > 0 && (
                <span className="text-xs font-bold bg-amber-500/20 text-amber-300 rounded-full px-2 py-0.5">
                  {r.cheatFlags}×
                </span>
              )}
              {r.autoSubmissions > 0 && (
                <span className="text-xs font-bold bg-rose-500/20 text-rose-300 rounded-full px-2 py-0.5">
                  🚨 {r.autoSubmissions}
                </span>
              )}
              {r.cheatFlags === 0 && r.autoSubmissions === 0 && <span className="text-slate-600">—</span>}
            </div>
            <button onClick={() => onSelect(r)}
              className="text-right text-xs text-sky-400 hover:text-sky-300 font-bold transition">
              View →
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Student Detail ───────────────────────────────────────────────────────────

function StudentDetail({ report, onBack }: { report: StudentReport; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-slate-400 hover:text-white text-sm transition flex items-center gap-1">
        ← Back to all students
      </button>

      {/* Student summary card */}
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-sky-700/30 border border-sky-500/30 flex items-center justify-center font-extrabold text-sky-300 text-lg shrink-0">
          {(report.student.name ?? report.student.email)[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-white">{report.student.name ?? report.student.email}</p>
          <p className="text-xs text-slate-500">{report.student.email}</p>
        </div>
        <div className="flex gap-4 shrink-0 text-center">
          <div>
            <p className="text-2xl font-extrabold text-emerald-400">{report.averageScore !== null ? `${report.averageScore}%` : "—"}</p>
            <p className="text-[10px] text-slate-500 uppercase">Avg Score</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-white">{report.totalAttempts}</p>
            <p className="text-[10px] text-slate-500 uppercase">Quizzes</p>
          </div>
          {report.cheatFlags > 0 && (
            <div>
              <p className="text-2xl font-extrabold text-amber-400">{report.cheatFlags}</p>
              <p className="text-[10px] text-slate-500 uppercase">⚠️ Flags</p>
            </div>
          )}
        </div>
      </div>

      {/* Individual quiz submissions */}
      {report.submissions.map((sub, i) => (
        <div key={sub.id} className="rounded-xl border border-slate-700 bg-slate-900/40 overflow-hidden">
          {/* Submission header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800/40 border-b border-slate-700">
            <div>
              <p className="font-bold text-white text-sm">{sub.node.title}</p>
              <p className="text-xs text-slate-500">{new Date(sub.createdAt).toLocaleDateString("en-GB")}</p>
            </div>
            <div className="flex items-center gap-2">
              {sub.autoSubmitted && (
                <span className="text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full px-2 py-0.5">
                  🚨 Auto-submitted
                </span>
              )}
              {sub.cheatAttempts > 0 && !sub.autoSubmitted && (
                <span className="text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full px-2 py-0.5">
                  ⚠️ {sub.cheatAttempts} violation{sub.cheatAttempts !== 1 ? "s" : ""}
                </span>
              )}
              <span className={`text-sm font-extrabold ${sub.avgScore !== null ? (sub.avgScore >= 70 ? "text-emerald-400" : sub.avgScore >= 50 ? "text-amber-400" : "text-rose-400") : "text-slate-500"}`}>
                {sub.avgScore !== null ? `${sub.avgScore}%` : "Ungraded"}
              </span>
            </div>
          </div>

          {/* Question responses */}
          <div className="divide-y divide-slate-800/60">
            {sub.responses.map((r, qi) => (
              <div key={r.id} className="px-4 py-3 flex items-start gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                  {qi + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{r.questionType}</p>
                  <p className="text-slate-300 text-xs">
                    {r.answerText ?? (r.answerChoice !== null ? `Option ${String.fromCharCode(65 + r.answerChoice)}` : "—")}
                  </p>
                  {r.gradeNotes && (
                    <p className="text-xs text-sky-400 italic mt-1">Teacher: {r.gradeNotes}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  {r.gradeScore !== null ? (
                    <span className={`font-extrabold text-sm ${r.gradeScore >= 70 ? "text-emerald-400" : r.gradeScore >= 50 ? "text-amber-400" : "text-rose-400"}`}>
                      {r.gradeScore}%
                    </span>
                  ) : (
                    <span className="text-xs text-slate-600">Ungraded</span>
                  )}
                </div>
              </div>
            ))}
            {sub.responses.length === 0 && (
              <p className="px-4 py-3 text-xs text-slate-600">No responses recorded</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Cheat Log View ───────────────────────────────────────────────────────────

function CheatLogView({ logs }: { logs: CheatNotification[] }) {
  if (logs.length === 0) {
    return <p className="text-slate-400 text-sm text-center py-10">No cheat incidents recorded ✓</p>;
  }

  return (
    <div className="space-y-2">
      {logs.map(log => (
        <div key={log.id}
          className={`rounded-xl border px-4 py-3 text-sm ${log.autoSubmitted ? "border-rose-500/30 bg-rose-500/10" : "border-amber-500/20 bg-amber-500/5"}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span>{log.autoSubmitted ? "🚨" : "⚠️"}</span>
              <p className="font-bold text-white">{log.studentName}</p>
              {log.autoSubmitted && (
                <span className="text-xs font-bold text-rose-300 bg-rose-500/20 rounded-full px-2 py-0.5">Auto-submitted</span>
              )}
            </div>
            <p className="text-xs text-slate-500 shrink-0">{new Date(log.createdAt).toLocaleDateString("en-GB")}</p>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Quiz: <span className="text-slate-300">{log.nodeTitle}</span> · Attempt #{log.attemptNumber}
          </p>
        </div>
      ))}
    </div>
  );
}
