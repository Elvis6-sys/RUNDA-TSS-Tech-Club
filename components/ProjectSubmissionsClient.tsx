"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Clock,
  ExternalLink,
  Users,
  CheckCircle,
  AlertCircle,
  Calendar,
  Moon,
  Sun,
  Star,
  Edit3,
  Save,
  X,
} from "lucide-react";

type ProjectMember = {
  userId: string;
  roleInProject: string;
  status: string;
  requestedAt: Date;
  approvedAt: Date | null;
  approvedBy: string | null;
  user: {
    name: string | null;
    role: string;
  };
};

type Project = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdBy: string;
  createdAt: Date;
  members: ProjectMember[];
};

type Submission = {
  id: string;
  projectId: string;
  userId: string;
  submissionUrl: string;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  note: string | null;
  submittedAt: Date;
  updatedAt: Date;
  grade: number | null;
  feedback: string | null;
  gradedBy: string | null;
  gradedAt: Date | null;
  status: string;
  user: {
    id: string;
    name: string | null;
    role: string;
    email: string;
  };
};

export default function ProjectSubmissionsClient({
  project,
  submissions: initialSubmissions,
  userId,
  userName,
  isCreator,
  isAdmin,
}: {
  project: Project;
  submissions: Submission[];
  userId: string;
  userName: string;
  isCreator: boolean;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [gradingSubmission, setGradingSubmission] = useState<string | null>(null);
  const [editingGrade, setEditingGrade] = useState<string | null>(null);
  const [gradeValues, setGradeValues] = useState<Record<string, number>>({});
  const [feedbackValues, setFeedbackValues] = useState<Record<string, string>>({});
  const [statusValues, setStatusValues] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  const isDark = theme === "dark";

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleGradeSubmission = async (studentId: string) => {
    const grade = gradeValues[studentId];
    const feedback = feedbackValues[studentId];
    const status = statusValues[studentId] || "graded";

    if (grade === undefined || grade === null) {
      showToast("Please enter a grade");
      return;
    }

    if (grade < 0 || grade > 100) {
      showToast("Grade must be between 0 and 100");
      return;
    }

    setGradingSubmission(studentId);

    try {
      const res = await fetch(`/api/projects/${project.id}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          grade,
          feedback: feedback || null,
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Failed to grade submission");
        return;
      }

      // Update local state
      setSubmissions((prev) =>
        prev.map((s) =>
          s.userId === studentId
            ? {
              ...s,
              grade: data.submission.grade,
              feedback: data.submission.feedback,
              gradedBy: data.submission.gradedBy,
              gradedAt: data.submission.gradedAt,
              status: data.submission.status,
            }
            : s
        )
      );

      showToast("Graded successfully!");
      setGradingSubmission(null);
    } catch (error) {
      showToast("An error occurred");
      setGradingSubmission(null);
    }
  };

  const currentStyles = isDark
    ? {
      bg: "bg-slate-900",
      cardBg: "bg-slate-800/50",
      border: "border-slate-700",
      mainText: "text-white",
      subText: "text-slate-400",
      input: "bg-slate-800 border-slate-700 text-white placeholder-slate-500",
      cardHover: "hover:border-slate-600",
    }
    : {
      bg: "bg-gradient-to-br from-blue-50 to-slate-100",
      cardBg: "bg-white/80",
      border: "border-slate-200",
      mainText: "text-slate-900",
      subText: "text-slate-600",
      input: "bg-white border-slate-300 text-slate-900 placeholder-slate-400",
      cardHover: "hover:border-slate-300",
    };

  const submittedMembers = submissions.map((s) => s.userId);
  const notSubmittedMembers = project.members.filter(
    (m) => !submittedMembers.includes(m.userId)
  );

  const submissionRate =
    project.members.length > 0
      ? Math.round((submissions.length / project.members.length) * 100)
      : 0;

  return (
    <div className={`min-h-screen ${currentStyles.bg} transition-colors duration-300`}>
      {/* Header */}
      <div className="border-b backdrop-blur-md sticky top-0 z-40" style={{
        backgroundColor: isDark ? "rgba(15, 23, 42, 0.8)" : "rgba(255, 255, 255, 0.8)",
        borderColor: isDark ? "rgba(51, 65, 85, 0.5)" : "rgba(226, 232, 240, 0.8)",
      }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/projects")}
                className={`p-2 rounded-xl border transition ${isDark
                  ? "border-slate-700 hover:bg-slate-800 text-slate-300"
                  : "border-slate-200 hover:bg-slate-100 text-slate-700"
                  }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className={`text-2xl font-bold ${currentStyles.mainText}`}>
                  Project Submissions
                </h1>
                <p className={`text-sm ${currentStyles.subText} mt-0.5`}>
                  {project.title}
                </p>
              </div>
            </div>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`p-2 rounded-xl border transition ${isDark
                ? "border-slate-700 hover:bg-slate-800 text-slate-300"
                : "border-slate-200 hover:bg-slate-100 text-slate-700"
                }`}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Total Members */}
          <div className={`rounded-2xl border p-5 backdrop-blur-sm ${currentStyles.cardBg} ${currentStyles.border}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <span className={`text-sm font-medium ${currentStyles.subText}`}>
                Team Members
              </span>
            </div>
            <p className={`text-3xl font-bold ${currentStyles.mainText}`}>
              {project.members.length}
            </p>
          </div>

          {/* Submitted */}
          <div className={`rounded-2xl border p-5 backdrop-blur-sm ${currentStyles.cardBg} ${currentStyles.border}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <span className={`text-sm font-medium ${currentStyles.subText}`}>
                Submitted
              </span>
            </div>
            <p className={`text-3xl font-bold ${currentStyles.mainText}`}>
              {submissions.length}
            </p>
          </div>

          {/* Pending */}
          <div className={`rounded-2xl border p-5 backdrop-blur-sm ${currentStyles.cardBg} ${currentStyles.border}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <span className={`text-sm font-medium ${currentStyles.subText}`}>
                Pending
              </span>
            </div>
            <p className={`text-3xl font-bold ${currentStyles.mainText}`}>
              {notSubmittedMembers.length}
            </p>
          </div>

          {/* Completion Rate */}
          <div className={`rounded-2xl border p-5 backdrop-blur-sm ${currentStyles.cardBg} ${currentStyles.border}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <FileText className="w-5 h-5 text-purple-400" />
              </div>
              <span className={`text-sm font-medium ${currentStyles.subText}`}>
                Completion
              </span>
            </div>
            <p className={`text-3xl font-bold ${currentStyles.mainText}`}>
              {submissionRate}%
            </p>
          </div>
        </div>

        {/* Submissions List */}
        {submissions.length > 0 ? (
          <div className={`rounded-2xl border p-6 backdrop-blur-sm mb-8 ${currentStyles.cardBg} ${currentStyles.border}`}>
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              <h2 className={`text-xl font-bold ${currentStyles.mainText}`}>
                Submitted Work ({submissions.length})
              </h2>
            </div>

            <div className="space-y-4">
              {submissions.map((submission) => {
                const isUpdated = submission.updatedAt.getTime() > submission.submittedAt.getTime();

                return (
                  <div
                    key={submission.id}
                    className={`rounded-xl border p-5 transition ${isDark
                      ? "bg-slate-800/80 border-slate-700 hover:bg-slate-800"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className={`text-lg font-semibold ${currentStyles.mainText}`}>
                          {submission.user.name || "Unknown User"}
                        </h3>
                        <p className={`text-sm ${currentStyles.subText}`}>
                          {submission.user.email}
                        </p>
                      </div>
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${isDark
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-emerald-500/20 text-emerald-600 border border-emerald-500/40"
                        }`}>
                        Submitted
                      </div>
                    </div>

                    {/* Timestamps */}
                    <div className="flex items-center gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className={`w-4 h-4 ${currentStyles.subText}`} />
                        <span className={currentStyles.subText}>
                          Submitted: {new Date(submission.submittedAt).toLocaleDateString()} at{" "}
                          {new Date(submission.submittedAt).toLocaleTimeString()}
                        </span>
                      </div>
                      {isUpdated && (
                        <div className="flex items-center gap-2">
                          <Clock className={`w-4 h-4 ${currentStyles.subText}`} />
                          <span className={currentStyles.subText}>
                            Updated: {new Date(submission.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Submission URL */}
                    <div className={`rounded-lg border p-4 mb-4 ${isDark
                      ? "bg-slate-900/50 border-slate-700"
                      : "bg-slate-50 border-slate-200"
                      }`}>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${currentStyles.subText}`}>
                        Submission Link
                      </p>
                      <a
                        href={submission.submissionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 text-sm hover:underline ${isDark ? "text-blue-400" : "text-blue-600"
                          }`}
                      >
                        <ExternalLink className="w-4 h-4 flex-shrink-0" />
                        <span className="break-all">{submission.submissionUrl}</span>
                      </a>
                    </div>

                    {/* Note */}
                    {submission.note && (
                      <div className={`rounded-lg border p-4 mb-4 ${isDark
                        ? "bg-blue-500/5 border-blue-500/20"
                        : "bg-blue-50 border-blue-200"
                        }`}>
                        <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${currentStyles.subText}`}>
                          Student Note
                        </p>
                        <p className={`text-sm italic ${currentStyles.mainText}`}>
                          {submission.note}
                        </p>
                      </div>
                    )}

                    {/* Attached File - Enhanced visibility */}
                    {submission.fileUrl && submission.fileName && (
                      <div className={`rounded-lg border-2 p-5 mb-4 ${isDark
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-emerald-50 border-emerald-300"
                        }`}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`p-2 rounded-lg ${isDark ? "bg-emerald-500/20" : "bg-emerald-100"}`}>
                            <FileText className={`w-5 h-5 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />
                          </div>
                          <p className={`text-sm font-bold uppercase tracking-wider ${isDark ? "text-emerald-300" : "text-emerald-700"}`}>
                            📎 Attached File
                          </p>
                        </div>
                        <a
                          href={submission.fileUrl}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 transition ${isDark
                            ? "bg-slate-800 border-emerald-500/40 hover:border-emerald-500 hover:bg-slate-700"
                            : "bg-white border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50"
                            }`}
                        >
                          <FileText className={`w-6 h-6 flex-shrink-0 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold truncate ${isDark ? "text-emerald-300" : "text-emerald-700"}`}>
                              {submission.fileName}
                            </p>
                            {submission.fileType && (
                              <p className={`text-xs ${currentStyles.subText} mt-0.5`}>
                                Type: {submission.fileType}
                              </p>
                            )}
                          </div>
                          <ExternalLink className={`w-5 h-5 flex-shrink-0 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />
                        </a>
                      </div>
                    )}

                    {/* DEBUG: Show file data status */}
                    {!submission.fileUrl && (
                      <div className={`rounded-lg border p-3 mb-4 ${isDark
                        ? "bg-amber-500/10 border-amber-500/30"
                        : "bg-amber-50 border-amber-300"
                        }`}>
                        <p className={`text-xs ${currentStyles.subText}`}>
                          ⚠️ No file attached (fileUrl: {submission.fileUrl ? 'exists' : 'null'}, fileName: {submission.fileName || 'null'})
                        </p>
                      </div>
                    )}

                    {/* Grading Section */}
                    {(submission.grade !== null && submission.grade !== undefined && editingGrade !== submission.userId) ? (
                      /* Display Grade and Feedback */
                      <div className={`rounded-lg border p-4 mt-4 ${isDark
                        ? "bg-purple-500/5 border-purple-500/20"
                        : "bg-purple-50 border-purple-200"
                        }`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-purple-400" />
                            <p className={`text-sm font-semibold ${currentStyles.mainText}`}>
                              Grade & Feedback
                            </p>
                          </div>
                          {(isCreator || isAdmin) && (
                            <button
                              onClick={() => {
                                setEditingGrade(submission.userId);
                                setGradeValues({ ...gradeValues, [submission.userId]: submission.grade! });
                                setFeedbackValues({ ...feedbackValues, [submission.userId]: submission.feedback || "" });
                                setStatusValues({ ...statusValues, [submission.userId]: submission.status });
                              }}
                              className={`text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 border ${isDark
                                ? "text-purple-400 hover:bg-purple-500/10 border-purple-500/30"
                                : "text-purple-600 hover:bg-purple-500/10 border-purple-200"
                                }`}
                            >
                              <Edit3 className="w-3 h-3" />
                              Edit Grade
                            </button>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className={`text-xs uppercase tracking-wider mb-1 ${currentStyles.subText}`}>
                              Grade
                            </p>
                            <p className={`text-2xl font-bold ${currentStyles.mainText}`}>
                              {submission.grade}/100
                            </p>
                          </div>
                          {submission.feedback && (
                            <div>
                              <p className={`text-xs uppercase tracking-wider mb-1 ${currentStyles.subText}`}>
                                Feedback
                              </p>
                              <p className={`text-sm ${currentStyles.mainText}`}>
                                {submission.feedback}
                              </p>
                            </div>
                          )}
                          {submission.gradedAt && (
                            <p className={`text-xs ${currentStyles.subText}`}>
                              Graded on {new Date(submission.gradedAt).toLocaleDateString()} at{" "}
                              {new Date(submission.gradedAt).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : ((isCreator || isAdmin) && (editingGrade === submission.userId || submission.grade === null || submission.grade === undefined)) && (
                      /* Grading Form */
                      <div className={`rounded-lg border p-4 mt-4 ${isDark
                        ? "bg-slate-900/50 border-slate-700"
                        : "bg-slate-50 border-slate-200"
                        }`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-amber-400" />
                            <p className={`text-sm font-semibold ${currentStyles.mainText}`}>
                              {editingGrade === submission.userId ? "Edit Grade" : "Grade Submission"}
                            </p>
                          </div>
                          {editingGrade === submission.userId && (
                            <button
                              onClick={() => {
                                setEditingGrade(null);
                                const newGradeValues = { ...gradeValues };
                                delete newGradeValues[submission.userId];
                                setGradeValues(newGradeValues);
                                setFeedbackValues({ ...feedbackValues, [submission.userId]: "" });
                                setStatusValues({ ...statusValues, [submission.userId]: "" });
                              }}
                              className={`text-xs px-2 py-1 rounded-lg transition ${isDark
                                ? "text-slate-400 hover:text-slate-300 hover:bg-slate-800"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                                }`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className={`text-xs font-semibold uppercase tracking-wider mb-2 block ${currentStyles.subText}`}>
                              Grade (0-100)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="Enter grade"
                              value={gradeValues[submission.userId] ?? ""}
                              onChange={(e) =>
                                setGradeValues({ ...gradeValues, [submission.userId]: Number(e.target.value) })
                              }
                              className={`w-full rounded-lg border px-4 py-2 text-sm focus:outline-none transition ${currentStyles.input}`}
                            />
                          </div>
                          <div>
                            <label className={`text-xs font-semibold uppercase tracking-wider mb-2 block ${currentStyles.subText}`}>
                              Feedback (Optional)
                            </label>
                            <textarea
                              rows={3}
                              placeholder="Provide feedback to the student..."
                              value={feedbackValues[submission.userId] ?? ""}
                              onChange={(e) =>
                                setFeedbackValues({ ...feedbackValues, [submission.userId]: e.target.value })
                              }
                              className={`w-full rounded-lg border px-4 py-2 text-sm focus:outline-none resize-none transition ${currentStyles.input}`}
                            />
                          </div>
                          <div>
                            <label className={`text-xs font-semibold uppercase tracking-wider mb-2 block ${currentStyles.subText}`}>
                              Status
                            </label>
                            <select
                              value={statusValues[submission.userId] ?? "graded"}
                              onChange={(e) =>
                                setStatusValues({ ...statusValues, [submission.userId]: e.target.value })
                              }
                              className={`w-full rounded-lg border px-4 py-2 text-sm focus:outline-none transition ${currentStyles.input}`}
                            >
                              <option value="graded">Graded</option>
                              <option value="revision_requested">Revision Requested</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleGradeSubmission(submission.userId)}
                              disabled={gradingSubmission === submission.userId}
                              className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${isDark
                                ? "border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
                                : "border-purple-500/40 bg-purple-500/10 text-purple-600 hover:bg-purple-500/20"
                                }`}
                            >
                              <Save className="w-4 h-4" />
                              {gradingSubmission === submission.userId ? "Saving..." : "Save Grade"}
                            </button>
                            {editingGrade === submission.userId && (
                              <button
                                onClick={() => {
                                  setEditingGrade(null);
                                  const newGradeValues = { ...gradeValues };
                                  delete newGradeValues[submission.userId];
                                  setGradeValues(newGradeValues);
                                  setFeedbackValues({ ...feedbackValues, [submission.userId]: "" });
                                  setStatusValues({ ...statusValues, [submission.userId]: "" });
                                }}
                                className={`px-4 py-2.5 rounded-lg border text-sm font-semibold transition ${isDark
                                  ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                                  }`}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={`rounded-2xl border p-12 text-center backdrop-blur-sm ${currentStyles.cardBg} ${currentStyles.border}`}>
            <FileText className={`w-16 h-16 mx-auto mb-4 ${currentStyles.subText}`} />
            <h3 className={`text-xl font-semibold mb-2 ${currentStyles.mainText}`}>
              No Submissions Yet
            </h3>
            <p className={currentStyles.subText}>
              Team members haven't submitted their work yet.
            </p>
          </div>
        )}

        {/* Not Submitted List */}
        {notSubmittedMembers.length > 0 && (
          <div className={`rounded-2xl border p-6 backdrop-blur-sm ${currentStyles.cardBg} ${currentStyles.border}`}>
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="w-6 h-6 text-amber-400" />
              <h2 className={`text-xl font-bold ${currentStyles.mainText}`}>
                Pending Submission ({notSubmittedMembers.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {notSubmittedMembers.map((member) => (
                <div
                  key={member.userId}
                  className={`rounded-lg border p-4 ${isDark
                    ? "bg-amber-500/5 border-amber-500/20"
                    : "bg-amber-50 border-amber-200"
                    }`}
                >
                  <p className={`font-semibold ${currentStyles.mainText}`}>
                    {member.user.name || "Unknown User"}
                  </p>
                  <p className={`text-xs ${currentStyles.subText} mt-1`}>
                    Approved: {new Date(member.approvedAt!).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
          <div className={`rounded-xl border px-6 py-3 shadow-lg backdrop-blur-sm ${isDark
            ? "bg-slate-800 border-slate-700 text-white"
            : "bg-white border-slate-200 text-slate-900"
            }`}>
            <p className="text-sm font-medium">{toast}</p>
          </div>
        </div>
      )}
    </div>
  );
}
