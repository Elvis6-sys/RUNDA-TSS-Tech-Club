"use client";

/**
 * TrainerContentEditor
 *
 * Inline block editor shown to trainers in the TrainerModuleViewer content panel.
 * Lets trainers edit/add/delete blocks for a specific topic, then save to DB
 * via PATCH /api/module/[moduleSlug].
 *
 * Block types supported: text (markdown), code, quiz, checklist
 * Changes are saved to SkillNode.blocks in DB and instantly visible to students.
 */

import { useState, useCallback } from "react";
import {
  FileText, Code2, ClipboardList, ListChecks, File, Image, Video,
  CircleDot, ToggleLeft, Pen, CheckSquare, Link2, BarChart2,
  MessageSquare, BookOpen, Laptop, Brush, Mic, Clapperboard,
  Paperclip, Check, X, ChevronUp, ChevronDown, Trash2, Save,
  ArrowLeft, Edit3, Inbox, AlertTriangle, Upload,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import RichTextEditor from "@/components/RichTextEditor";
import QuestionImporter from "@/components/QuestionImporter";
import SimpleQuestionImporter from "@/components/SimpleQuestionImporter";
import type { LearnBlock, TextBlock, CodeBlock, QuizBlock, ChecklistBlock, DocumentBlock, ImageBlock, VideoBlock, Question } from "@/lib/learnContent";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function newTextBlock(): TextBlock {
  return { id: uid(), type: "text", content: "## New Section\n\nStart writing here..." };
}
function newCodeBlock(): CodeBlock {
  return { id: uid(), type: "code", language: "javascript", code: "// Your code here", caption: "" };
}
function newQuizBlock(): QuizBlock {
  return {
    id: uid(), type: "quiz",
    questions: [],
  };
}
function newChecklistBlock(): ChecklistBlock {
  return { id: uid(), type: "checklist", items: ["I understand the concept", "I can apply it practically"] };
}
function newDocumentBlock(): DocumentBlock {
  return { id: uid(), type: "document", url: "", title: "Module Document", description: "" };
}
function newImageBlock(): ImageBlock {
  return { id: uid(), type: "image", url: "", caption: "", alt: "" };
}
function newVideoBlock(): VideoBlock {
  return { id: uid(), type: "video", url: "", title: "", description: "" };
}

// ─── Block type metadata ──────────────────────────────────────────────────────

const BLOCK_TYPES = [
  { type: "text", label: "Text / Markdown", icon: <FileText className="w-4 h-4" /> },
  { type: "code", label: "Code Block", icon: <Code2 className="w-4 h-4" /> },
  { type: "quiz", label: "Quiz Question", icon: <ClipboardList className="w-4 h-4" /> },
  { type: "checklist", label: "Self-Check List", icon: <ListChecks className="w-4 h-4" /> },
  { type: "document", label: "Upload Document", icon: <File className="w-4 h-4" /> },
  { type: "image", label: "Image / Diagram", icon: <Image className="w-4 h-4" /> },
  { type: "video", label: "Video / Link", icon: <Video className="w-4 h-4" /> },
] as const;

// ─── Individual block editors ─────────────────────────────────────────────────

function TextEditor({
  block,
  onChange,
}: {
  block: TextBlock;
  onChange: (b: TextBlock) => void;
}) {
  return (
    <RichTextEditor
      value={block.content}
      onChange={(content) => onChange({ ...block, content })}
    />
  );
}

function CodeEditor({
  block,
  onChange,
}: {
  block: CodeBlock;
  onChange: (b: CodeBlock) => void;
}) {
  const langs = ["javascript", "typescript", "python", "sql", "bash", "json", "html", "css", "java", "php"];
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="flex-1">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Language</p>
          <select
            value={block.language}
            onChange={(e) => onChange({ ...block, language: e.target.value })}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
          >
            {langs.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Caption (optional)</p>
          <input
            value={block.caption ?? ""}
            onChange={(e) => onChange({ ...block, caption: e.target.value })}
            placeholder="e.g. Basic Express server"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
          />
        </div>
      </div>
      <p className="text-[10px] text-slate-400 uppercase tracking-widest">Code</p>
      <textarea
        value={block.code}
        onChange={(e) => onChange({ ...block, code: e.target.value })}
        rows={10}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm text-emerald-300 focus:border-sky-500 focus:outline-none resize-y"
        spellCheck={false}
      />
    </div>
  );
}

function QuizEditor({ block, onChange }: { block: QuizBlock; onChange: (b: QuizBlock) => void }) {
  const [showImporter, setShowImporter] = useState(false);
  const questions = block.questions ?? [];

  const QT = [
    // ── Objective (auto-gradable) ─────────────────────────────────────────
    { value: "mcq", label: "Multiple Choice", icon: <CircleDot className="w-4 h-4" />, desc: "Single correct option", group: "objective" },
    { value: "truefalse", label: "True / False", icon: <ToggleLeft className="w-4 h-4" />, desc: "Binary choice", group: "objective" },
    { value: "fillin", label: "Fill in the Blank", icon: <Pen className="w-4 h-4" />, desc: "Use ___ for blanks", group: "objective" },
    { value: "multiselect", label: "Multi-select", icon: <CheckSquare className="w-4 h-4" />, desc: "Select all that apply", group: "objective" },
    { value: "matching", label: "Matching", icon: <Link2 className="w-4 h-4" />, desc: "Match pairs", group: "objective" },
    { value: "ordering", label: "Ordering", icon: <BarChart2 className="w-4 h-4" />, desc: "Arrange in sequence", group: "objective" },
    // ── Subjective (manual review) ────────────────────────────────────────
    { value: "short", label: "Short Answer", icon: <MessageSquare className="w-4 h-4" />, desc: "1–3 sentences", group: "subjective" },
    { value: "essay", label: "Essay", icon: <BookOpen className="w-4 h-4" />, desc: "Extended response", group: "subjective" },
    { value: "coding", label: "Code Submission", icon: <Laptop className="w-4 h-4" />, desc: "Student writes code", group: "subjective" },
    { value: "file_upload", label: "File Upload", icon: <Paperclip className="w-4 h-4" />, desc: "Upload doc/pdf/zip", group: "subjective" },
    { value: "drawing", label: "Drawing/Diagram", icon: <Brush className="w-4 h-4" />, desc: "Image upload", group: "subjective" },
    { value: "audio", label: "Audio Response", icon: <Mic className="w-4 h-4" />, desc: "Voice recording", group: "subjective" },
    { value: "video", label: "Video Response", icon: <Clapperboard className="w-4 h-4" />, desc: "Video submission", group: "subjective" },
  ] as const;

  type QTValue = typeof QT[number]["value"];

  function addQuestion() {
    const newQ: Question = {
      id: uid(), questionType: "mcq",
      question: "Enter your question here?",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correct: 0, explanation: "",
    };
    onChange({ ...block, questions: [...questions, newQ] });
  }

  function handleQuestionsImported(importedQuestions: any[]) {
    const convertedQuestions: Question[] = importedQuestions.map(q => {
      // Normalize question type
      const normalizedType = q.type.toLowerCase().replace(/_/g, '');
      const typeMap: Record<string, string> = {
        'multiplechoice': 'mcq',
        'truefalse': 'truefalse',
        'fillblank': 'fillin',
        'multiselect': 'multiselect',
        'matching': 'matching',
        'ordering': 'ordering',
        'shortanswer': 'short',
        'essay': 'essay',
        'code': 'code',
        'fileupload': 'fileupload',
        'drawing': 'drawing',
        'audio': 'audio',
        'video': 'video',
      };
      const mappedType = typeMap[normalizedType] || 'mcq';

      const baseQuestion: Partial<Question> = {
        id: uid(),
        questionType: mappedType as any,
        question: q.text || q.question || '',
        explanation: q.explanation || "",
      };

      // Convert question based on type
      switch (mappedType) {
        case "mcq":
          return {
            ...baseQuestion,
            questionType: "mcq",
            options: q.options || ["Option A", "Option B", "Option C", "Option D"],
            correct: typeof q.correctAnswer === 'string'
              ? q.options?.findIndex((opt: string) => {
                // Try to find by letter (A, B, C, D)
                const letter = q.correctAnswer.toUpperCase().trim();
                const index = letter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
                return index >= 0 && index < (q.options?.length || 0);
              }) ?? 0
              : (q.correctAnswer ?? 0),
          } as Question;

        case "truefalse":
          return {
            ...baseQuestion,
            questionType: "truefalse",
            options: q.options || ["True", "False"],
            correct: q.correctAnswer === "A" || q.correctAnswer === 0 ? 0 : 1,
          } as Question;

        case "fillin":
          return {
            ...baseQuestion,
            questionType: "fillin",
            blanks: Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer || ""],
          } as Question;

        case "multiselect":
          return {
            ...baseQuestion,
            questionType: "multiselect",
            options: q.options || [],
            correctMulti: Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer],
          } as Question;

        case "matching":
          const leftCol = q.correctAnswer?.left || [];
          const rightCol = q.correctAnswer?.right || [];
          const pairs: Record<string, string> = {};
          leftCol.forEach((l: string, i: number) => {
            if (rightCol[i]) pairs[l] = rightCol[i];
          });
          return {
            ...baseQuestion,
            questionType: "matching",
            leftColumn: leftCol,
            rightColumn: rightCol,
            correctPairs: pairs,
          } as Question;

        case "ordering":
          return {
            ...baseQuestion,
            questionType: "ordering",
            items: Array.isArray(q.correctAnswer) ? q.correctAnswer : q.options || [],
          } as Question;

        case "shortanswer":
        case "short":
          return {
            ...baseQuestion,
            questionType: "short",
            referenceAnswer: q.correctAnswer || "",
          } as Question;

        case "essay":
          return {
            ...baseQuestion,
            questionType: "essay",
            referenceAnswer: q.correctAnswer || "",
          } as Question;

        case "code":
        case "coding":
          return {
            ...baseQuestion,
            questionType: "coding",
            referenceAnswer: q.correctAnswer || "",
          } as Question;

        case "fileupload":
        case "file_upload":
          return {
            ...baseQuestion,
            questionType: "file_upload",
          } as Question;

        case "drawing":
          return {
            ...baseQuestion,
            questionType: "drawing",
          } as Question;

        case "audio":
          return {
            ...baseQuestion,
            questionType: "audio",
          } as Question;

        case "video":
          return {
            ...baseQuestion,
            questionType: "video",
          } as Question;

        default:
          // Default to MCQ if type is unrecognized
          return {
            ...baseQuestion,
            questionType: "mcq",
            options: q.options || ["Option A", "Option B"],
            correct: 0,
          } as Question;
      }
    });

    console.log('📥 Importing questions:', convertedQuestions.length);
    console.log('📊 Current questions:', questions.length);
    console.log('📦 First imported question:', convertedQuestions[0]);

    const updatedQuestions = [...questions, ...convertedQuestions];
    console.log('✅ Total after import:', updatedQuestions.length);

    onChange({ ...block, questions: updatedQuestions });
    setShowImporter(false);

    // Show success message
    alert(`✅ Successfully imported ${convertedQuestions.length} questions!\n\nTotal questions now: ${updatedQuestions.length}`);
  }

  function updateQuestion(idx: number, q: Partial<Question>) {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], ...q };
    onChange({ ...block, questions: updated });
  }

  function removeQuestion(idx: number) {
    onChange({ ...block, questions: questions.filter((_, i) => i !== idx) });
  }

  function moveQuestion(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= questions.length) return;
    const next = [...questions];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange({ ...block, questions: next });
  }

  // ── Option helpers ────────────────────────────────────────────────────────
  function setOption(qi: number, oi: number, val: string) {
    const opts = [...(questions[qi].options ?? [])];
    opts[oi] = val;
    updateQuestion(qi, { options: opts });
  }
  function addOption(qi: number) {
    updateQuestion(qi, { options: [...(questions[qi].options ?? []), ""] });
  }
  function removeOption(qi: number, oi: number) {
    updateQuestion(qi, { options: (questions[qi].options ?? []).filter((_, i) => i !== oi) });
  }

  // ── Blank helpers ─────────────────────────────────────────────────────────
  function setBlank(qi: number, bi: number, val: string) {
    const blanks = [...(questions[qi].blanks ?? [])];
    blanks[bi] = val;
    updateQuestion(qi, { blanks });
  }

  // ── Matching helpers — rebuild left, right, and correctPairs atomically ──
  function updateMatchRow(qi: number, i: number, side: "left" | "right", val: string) {
    const q = questions[qi];
    const left = [...(q.leftColumn ?? [])];
    const right = [...(q.rightColumn ?? [])];
    if (side === "left") left[i] = val;
    if (side === "right") right[i] = val;
    // Rebuild correctPairs: key = left[j], value = right[j]
    const pairs: Record<string, string> = {};
    left.forEach((l, j) => { if (l && right[j]) pairs[l] = right[j]; });
    updateQuestion(qi, { leftColumn: left, rightColumn: right, correctPairs: pairs });
  }
  function addMatchPair(qi: number) {
    const q = questions[qi];
    const left = [...(q.leftColumn ?? []), ""];
    const right = [...(q.rightColumn ?? []), ""];
    updateQuestion(qi, { leftColumn: left, rightColumn: right });
  }
  function removeMatchPair(qi: number, i: number) {
    const q = questions[qi];
    const left = (q.leftColumn ?? []).filter((_, idx) => idx !== i);
    const right = (q.rightColumn ?? []).filter((_, idx) => idx !== i);
    const pairs: Record<string, string> = {};
    left.forEach((l, j) => { if (l && right[j]) pairs[l] = right[j]; });
    updateQuestion(qi, { leftColumn: left, rightColumn: right, correctPairs: pairs });
  }

  // ── Ordering helpers ──────────────────────────────────────────────────────
  function setOrderItem(qi: number, i: number, val: string) {
    const items = [...(questions[qi].items ?? [])];
    items[i] = val;
    // correctOrder stays as 0,1,2,... (trainer enters items in correct order)
    updateQuestion(qi, { items, correctOrder: items.map((_, idx) => idx) });
  }
  function addOrderItem(qi: number) {
    const items = [...(questions[qi].items ?? []), ""];
    updateQuestion(qi, { items, correctOrder: items.map((_, idx) => idx) });
  }
  function removeOrderItem(qi: number, i: number) {
    const items = (questions[qi].items ?? []).filter((_, idx) => idx !== i);
    updateQuestion(qi, { items, correctOrder: items.map((_, idx) => idx) });
  }

  const inputCls = "w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none";

  return (
    <div className="space-y-6">
      {questions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-center text-slate-400 space-y-2">
          <div className="flex justify-center"><ClipboardList className="w-10 h-10 text-slate-500" /></div>
          <p className="text-sm font-medium">No questions yet. Add one below.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {questions.map((q, qi) => {
            const qt = (q.questionType ?? "mcq") as QTValue;
            const meta = QT.find(t => t.value === qt);
            const blankCount = ((q.question || '').match(/___/g) ?? []).length;
            const leftCol = q.leftColumn ?? [];
            const rightCol = q.rightColumn ?? [];

            return (
              <div key={q.id} className="rounded-2xl border border-slate-700 bg-slate-900/60 overflow-hidden">
                {/* Question header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/60 border-b border-slate-700">
                  <span className="text-lg shrink-0">{meta?.icon ?? "❓"}</span>
                  <span className="flex-1 text-xs font-bold text-white">Q{qi + 1} — {meta?.label ?? qt}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${meta?.group === "objective" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                    {meta?.group === "objective" ? "Auto-graded" : "Manual review"}
                  </span>
                  <button onClick={() => moveQuestion(qi, -1)} disabled={qi === 0} className="text-slate-500 hover:text-white disabled:opacity-20 text-xs px-1 py-1 rounded hover:bg-slate-700">↑</button>
                  <button onClick={() => moveQuestion(qi, 1)} disabled={qi === questions.length - 1} className="text-slate-500 hover:text-white disabled:opacity-20 text-xs px-1 py-1 rounded hover:bg-slate-700">↓</button>
                  <button onClick={() => removeQuestion(qi)} className="text-rose-400 hover:text-rose-300 text-xs px-2 py-1 rounded hover:bg-rose-500/10"><X className="w-3.5 h-3.5" /></button>
                </div>

                <div className="p-5 space-y-4">
                  {/* Question type picker — grouped */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Objective — auto-graded</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {QT.filter(t => t.group === "objective").map(t => (
                        <button key={t.value} type="button"
                          onClick={() => updateQuestion(qi, { questionType: t.value })}
                          className={`flex items-start gap-2 rounded-xl border px-2.5 py-2 text-left transition ${qt === t.value ? "border-emerald-500 bg-emerald-500/10 text-white" : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-500"}`}>
                          <span className="text-sm shrink-0">{t.icon}</span>
                          <div>
                            <p className="font-bold text-[11px] leading-tight">{t.label}</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">{t.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mt-3">Subjective — manual review</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {QT.filter(t => t.group === "subjective").map(t => (
                        <button key={t.value} type="button"
                          onClick={() => updateQuestion(qi, { questionType: t.value })}
                          className={`flex items-start gap-2 rounded-xl border px-2.5 py-2 text-left transition ${qt === t.value ? "border-amber-500 bg-amber-500/10 text-white" : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-500"}`}>
                          <span className="text-sm shrink-0">{t.icon}</span>
                          <div>
                            <p className="font-bold text-[11px] leading-tight">{t.label}</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">{t.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Question text + Points + Time Limit */}
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Question{qt === "fillin" ? " (use ___ for blanks)" : ""}</p>
                      <textarea value={q.question}
                        onChange={e => updateQuestion(qi, { question: e.target.value })}
                        rows={2} className={`${inputCls} resize-none`}
                        placeholder={qt === "fillin" ? "The capital of Rwanda is ___." : "Type your question?"} />
                    </div>
                    <div className="shrink-0 w-20">
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Points</p>
                      <input type="number" min="1" max="100"
                        value={q.points ?? 1}
                        onChange={e => updateQuestion(qi, { points: parseInt(e.target.value) || 1 })}
                        className={inputCls} />
                    </div>
                    <div className="shrink-0 w-24">
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">
                        Time limit
                        <span className="ml-1 text-slate-600 normal-case font-normal">(sec)</span>
                      </p>
                      <input type="number" min="0" max="3600" step="15"
                        value={q.timeLimit ?? ""}
                        onChange={e => {
                          const v = parseInt(e.target.value);
                          updateQuestion(qi, { timeLimit: isNaN(v) || v <= 0 ? undefined : v });
                        }}
                        className={inputCls}
                        placeholder="∞ none" />
                      <p className="text-[9px] text-slate-600 mt-0.5">0 = no limit</p>
                    </div>
                  </div>

                  {/* ── MCQ options ── */}
                  {qt === "mcq" && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Options (click circle to mark correct)</p>
                      {(q.options ?? ["", "", "", ""]).map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <button type="button" onClick={() => updateQuestion(qi, { correct: oi })}
                            className={`shrink-0 w-7 h-7 rounded-full border-2 text-xs font-bold flex items-center justify-center transition ${q.correct === oi ? "bg-emerald-500 border-emerald-400 text-white" : "border-slate-600 text-slate-500 hover:border-emerald-500/50"}`}>
                            {q.correct === oi ? <Check className="w-3 h-3" /> : String.fromCharCode(65 + oi)}
                          </button>
                          <input value={opt} onChange={e => setOption(qi, oi, e.target.value)}
                            className={`flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none transition ${q.correct === oi ? "border-emerald-500/50 bg-emerald-500/5 text-emerald-200" : "border-slate-700 bg-slate-950 text-slate-200"}`}
                            placeholder={`Option ${String.fromCharCode(65 + oi)}`} />
                          {(q.options ?? []).length > 2 && (
                            <button type="button" onClick={() => removeOption(qi, oi)} className="text-slate-600 hover:text-rose-400 text-xs shrink-0"><X className="w-3.5 h-3.5" /></button>
                          )}
                        </div>
                      ))}
                      {(q.options ?? []).length < 6 && (
                        <button type="button" onClick={() => addOption(qi)}
                          className="text-xs text-slate-500 hover:text-sky-400 border border-dashed border-slate-700 rounded-xl px-3 py-1.5 w-full transition hover:border-sky-500/40">
                          + Add option
                        </button>
                      )}
                    </div>
                  )}

                  {/* ── Multiselect (same as MCQ but multiple correct) ── */}
                  {qt === "multiselect" && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Options (toggle all correct answers)</p>
                      {(q.options ?? ["", "", "", ""]).map((opt, oi) => {
                        const correctArr: number[] = Array.isArray(q.correct) ? q.correct : (q.correct !== undefined ? [q.correct] : []);
                        const isCorrect = correctArr.includes(oi);
                        return (
                          <div key={oi} className="flex items-center gap-2">
                            <button type="button"
                              onClick={() => {
                                const next = isCorrect ? correctArr.filter(v => v !== oi) : [...correctArr, oi].sort();
                                updateQuestion(qi, { correct: next });
                              }}
                              className={`shrink-0 w-7 h-7 rounded-md border-2 text-xs font-bold flex items-center justify-center transition ${isCorrect ? "bg-emerald-500 border-emerald-400 text-white" : "border-slate-600 text-slate-500 hover:border-emerald-500/50"}`}>
                              {isCorrect ? <Check className="w-3 h-3" /> : String.fromCharCode(65 + oi)}
                            </button>
                            <input value={opt} onChange={e => setOption(qi, oi, e.target.value)}
                              className={`flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none transition ${isCorrect ? "border-emerald-500/50 bg-emerald-500/5 text-emerald-200" : "border-slate-700 bg-slate-950 text-slate-200"}`}
                              placeholder={`Option ${String.fromCharCode(65 + oi)}`} />
                            {(q.options ?? []).length > 2 && (
                              <button type="button" onClick={() => removeOption(qi, oi)} className="text-slate-600 hover:text-rose-400 text-xs shrink-0"><X className="w-3.5 h-3.5" /></button>
                            )}
                          </div>
                        );
                      })}
                      {(q.options ?? []).length < 8 && (
                        <button type="button" onClick={() => addOption(qi)}
                          className="text-xs text-slate-500 hover:text-sky-400 border border-dashed border-slate-700 rounded-xl px-3 py-1.5 w-full">
                          + Add option
                        </button>
                      )}
                      <p className="text-[10px] text-slate-500">Students must select every correct option to get full marks.</p>
                    </div>
                  )}

                  {/* ── True / False ── */}
                  {qt === "truefalse" && (
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Correct answer</p>
                      <div className="flex gap-3">
                        {["True", "False"].map((label, i) => (
                          <button key={label} type="button" onClick={() => updateQuestion(qi, { correct: i })}
                            className={`flex-1 rounded-xl border py-2.5 text-sm font-bold transition ${q.correct === i ? (i === 0 ? "border-emerald-500 bg-emerald-500/15 text-emerald-300" : "border-rose-500 bg-rose-500/15 text-rose-300") : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-500"}`}>
                            {i === 0 ? <><Check className="w-3.5 h-3.5 inline" /> True</> : <><X className="w-3.5 h-3.5 inline" /> False</>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Fill in the blank ── */}
                  {qt === "fillin" && blankCount > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Correct answers (in order of blanks)</p>
                      {Array.from({ length: blankCount }).map((_, bi) => (
                        <div key={bi} className="flex items-center gap-2">
                          <span className="shrink-0 text-xs text-slate-500 w-14 font-mono">___ {bi + 1}</span>
                          <input value={(q.blanks ?? [])[bi] ?? ""}
                            onChange={e => setBlank(qi, bi, e.target.value)}
                            className={inputCls} placeholder={`Exact answer for blank ${bi + 1}`} />
                        </div>
                      ))}
                    </div>
                  )}
                  {qt === "fillin" && blankCount === 0 && (
                    <p className="text-xs text-amber-400">Add ___ (triple underscore) in your question to create blanks.</p>
                  )}

                  {/* ── Matching ── */}
                  {qt === "matching" && (
                    <div className="space-y-3">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Matching pairs — left column ↔ right column</p>
                      {Array.from({ length: Math.max(leftCol.length, 1) }).map((_, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input value={leftCol[i] ?? ""}
                            onChange={e => updateMatchRow(qi, i, "left", e.target.value)}
                            className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
                            placeholder={`Left ${i + 1} (term)`} />
                          <span className="text-slate-500 shrink-0 font-bold">↔</span>
                          <input value={rightCol[i] ?? ""}
                            onChange={e => updateMatchRow(qi, i, "right", e.target.value)}
                            className="flex-1 rounded-xl border border-emerald-700/40 bg-slate-950 px-3 py-2 text-sm text-emerald-200 focus:border-emerald-500 focus:outline-none"
                            placeholder={`Right ${i + 1} (match)`} />
                          {leftCol.length > 1 && (
                            <button type="button" onClick={() => removeMatchPair(qi, i)}
                              className="text-slate-600 hover:text-rose-400 text-xs shrink-0 px-1"><X className="w-3.5 h-3.5" /></button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => addMatchPair(qi)}
                        className="text-xs text-slate-500 hover:text-sky-400 border border-dashed border-slate-700 rounded-xl px-3 py-1.5 w-full transition hover:border-sky-500/40">
                        + Add pair
                      </button>
                      <p className="text-[10px] text-slate-500">Students see left items and must select the correct right match. Pairs are auto-saved.</p>
                    </div>
                  )}

                  {/* ── Ordering ── */}
                  {qt === "ordering" && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Items in correct order (top = first)</p>
                      {(q.items ?? []).map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="shrink-0 w-7 h-7 rounded-full bg-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center border border-slate-700">{i + 1}</span>
                          <input value={item} onChange={e => setOrderItem(qi, i, e.target.value)}
                            className={inputCls} placeholder={`Item ${i + 1}`} />
                          {(q.items ?? []).length > 2 && (
                            <button type="button" onClick={() => removeOrderItem(qi, i)} className="text-slate-600 hover:text-rose-400 text-xs shrink-0"><X className="w-3.5 h-3.5" /></button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => addOrderItem(qi)}
                        className="text-xs text-slate-500 hover:text-sky-400 border border-dashed border-slate-700 rounded-xl px-3 py-1.5 w-full">
                        + Add item
                      </button>
                      <p className="text-[10px] text-slate-500">Items will be shuffled for students. They must sort them back into this order.</p>
                    </div>
                  )}

                  {/* ── Short / Essay / Coding ── */}
                  {(qt === "short" || qt === "essay" || qt === "coding") && (
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">
                          {qt === "coding" ? "Language hint (optional)" : "Model / sample answer"}
                        </p>
                        <textarea value={q.sampleAnswer ?? ""}
                          onChange={e => updateQuestion(qi, { sampleAnswer: e.target.value })}
                          rows={qt === "essay" ? 5 : qt === "coding" ? 4 : 3}
                          className={`${inputCls} resize-y font-${qt === "coding" ? "mono text-emerald-300" : "sans"}`}
                          placeholder={qt === "coding" ? "# Expected solution or pseudocode" : "Model answer shown to teacher during grading"} />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Grading rubric</p>
                        <textarea value={q.rubric ?? ""}
                          onChange={e => updateQuestion(qi, { rubric: e.target.value })}
                          rows={3} className={`${inputCls} resize-y`}
                          placeholder="e.g. • Clear explanation (5 pts)  • Examples provided (5 pts)  • Technical accuracy (5 pts)" />
                      </div>
                    </div>
                  )}

                  {/* ── File / Drawing / Audio / Video uploads ── */}
                  {(qt === "file_upload" || qt === "drawing" || qt === "audio" || qt === "video") && (
                    <div className="space-y-3">
                      <div className="rounded-xl bg-slate-800/40 border border-slate-700 px-4 py-3 space-y-1">
                        <p className="text-xs font-bold text-slate-300">
                          {qt === "file_upload" && "Students will upload a file (PDF, DOCX, ZIP, etc.)"}
                          {qt === "drawing" && "Students will draw or take a photo of a diagram"}
                          {qt === "audio" && "Students will record an audio response"}
                          {qt === "video" && "Students will record or upload a video response"}
                        </p>
                        <p className="text-[10px] text-slate-500">Teacher reviews the submission manually during grading.</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Grading rubric</p>
                        <textarea value={q.rubric ?? ""}
                          onChange={e => updateQuestion(qi, { rubric: e.target.value })}
                          rows={3} className={`${inputCls} resize-y`}
                          placeholder="Describe what you are looking for in this response..." />
                      </div>
                      {(qt === "file_upload" || qt === "drawing") && (
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Allowed formats (comma-separated)</p>
                          <input value={(q.allowedFormats ?? []).join(", ")}
                            onChange={e => updateQuestion(qi, { allowedFormats: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                            className={inputCls} placeholder="pdf, docx, jpg, png" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Explanation (for auto-graded types) ── */}
                  {["mcq", "truefalse", "fillin", "multiselect", "matching", "ordering"].includes(qt) && (
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Explanation (shown after grading)</p>
                      <textarea value={q.explanation ?? ""}
                        onChange={e => updateQuestion(qi, { explanation: e.target.value })}
                        rows={2} className={`${inputCls} resize-none`}
                        placeholder="Why this is the correct answer..." />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button type="button" onClick={() => setShowImporter(true)}
          className="flex-1 rounded-xl border-2 border-blue-500 bg-blue-500/20 hover:bg-blue-500/30 text-white text-sm py-4 font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
          <Upload className="w-5 h-5" />
          📄 Import from Text File (.txt)
        </button>
        <button type="button" onClick={addQuestion}
          className="flex-1 rounded-xl border border-dashed border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 text-violet-400 text-sm py-4 font-bold transition">
          + Add Question
        </button>
      </div>

      {showImporter && (
        <SimpleQuestionImporter
          onQuestionsImported={handleQuestionsImported}
          onClose={() => setShowImporter(false)}
        />
      )}
    </div>
  );
}


function ChecklistEditor({
  block,
  onChange,
}: {
  block: ChecklistBlock;
  onChange: (b: ChecklistBlock) => void;
}) {
  function setItem(i: number, val: string) {
    const items = [...block.items];
    items[i] = val;
    onChange({ ...block, items });
  }

  function addItem() {
    onChange({ ...block, items: [...block.items, ""] });
  }

  function removeItem(i: number) {
    onChange({ ...block, items: block.items.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-slate-400 uppercase tracking-widest">Checklist items (student self-check)</p>
      {block.items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-amber-400 text-xs shrink-0">☐</span>
          <input
            value={item}
            onChange={(e) => setItem(i, e.target.value)}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            placeholder={`Item ${i + 1}`}
          />
          <button
            onClick={() => removeItem(i)}
            className="shrink-0 text-rose-400 hover:text-rose-300 text-xs px-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        onClick={addItem}
        className="text-xs text-slate-400 hover:text-white border border-dashed border-slate-700 rounded-xl px-4 py-2 w-full transition hover:border-slate-500"
      >
        + Add item
      </button>
    </div>
  );
}

// ─── DocumentEditor ───────────────────────────────────────────────────────────

function DocumentEditor({ block, onChange }: { block: DocumentBlock; onChange: (b: DocumentBlock) => void }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setUploading(true); setUploadError(null);
    const form = new FormData();
    form.append("file", file);
    form.append("bucket", "resources");
    const res = await fetch("/api/upload", { method: "POST", body: form });
    setUploading(false);
    if (!res.ok) { setUploadError("Upload failed. Try again."); return; }
    const data = await res.json();
    onChange({ ...block, url: data.url, fileType: data.type, title: block.title || file.name.replace(/\.[^.]+$/, "") });
  }, [block, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
  });

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Document title</p>
        <input value={block.title} onChange={e => onChange({ ...block, title: e.target.value })}
          placeholder="e.g. Module 1 Notes" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none" />
      </div>
      <div {...getRootProps()} className={`rounded-xl border-2 border-dashed px-4 py-5 text-center cursor-pointer transition ${isDragActive ? "border-sky-500 bg-sky-500/10" : "border-slate-700 hover:border-violet-500/50"}`}>
        <input {...getInputProps()} />
        {uploading ? (
          <p className="text-sm text-violet-400 animate-pulse">Uploading…</p>
        ) : block.url ? (
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-sm text-emerald-400 font-medium"><Check className="w-4 h-4" /> Document uploaded</p>
            <p className="text-xs text-slate-500 truncate max-w-xs mx-auto">{block.url.split("/").pop()}</p>
            <p className="text-xs text-slate-600">Drop a new file to replace</p>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex justify-center"><File className="w-10 h-10 text-slate-500" /></div>
            <p className="text-sm text-slate-400">{isDragActive ? "Drop it here!" : "Drag & drop PDF, DOCX, PPTX, XLSX or click to browse"}</p>
          </div>
        )}
      </div>
      {uploadError && <p className="text-xs text-rose-400">{uploadError}</p>}
      <div>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Or paste a direct URL</p>
        <input type="url" value={block.url} onChange={e => onChange({ ...block, url: e.target.value })}
          placeholder="https://..." className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none" />
      </div>
      <div>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Description (optional)</p>
        <textarea value={block.description ?? ""} onChange={e => onChange({ ...block, description: e.target.value })}
          rows={2} placeholder="What students will find in this document…"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none resize-none" />
      </div>
    </div>
  );
}

// ─── ImageEditor ──────────────────────────────────────────────────────────────

function ImageEditor({ block, onChange }: { block: ImageBlock; onChange: (b: ImageBlock) => void }) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("bucket", "resources");
    const res = await fetch("/api/upload", { method: "POST", body: form });
    setUploading(false);
    if (!res.ok) return;
    const data = await res.json();
    onChange({ ...block, url: data.url, alt: block.alt || file.name.replace(/\.[^.]+$/, "") });
  }, [block, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"] }, maxFiles: 1,
  });

  return (
    <div className="space-y-3">
      <div {...getRootProps()} className={`rounded-xl border-2 border-dashed px-4 py-5 text-center cursor-pointer transition ${isDragActive ? "border-sky-500 bg-sky-500/10" : "border-slate-700 hover:border-sky-500/40"}`}>
        <input {...getInputProps()} />
        {uploading ? (
          <p className="text-sm text-sky-400 animate-pulse">Uploading…</p>
        ) : block.url ? (
          <div className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={block.url} alt={block.alt ?? ""} className="max-h-40 mx-auto rounded-xl object-contain" />
            <p className="text-xs text-slate-500">Drop a new image to replace</p>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex justify-center"><Image className="w-10 h-10 text-slate-500" /></div>
            <p className="text-sm text-slate-400">{isDragActive ? "Drop it!" : "Drag & drop PNG, JPG, SVG or click to browse"}</p>
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Or paste image URL</p>
        <input type="url" value={block.url} onChange={e => onChange({ ...block, url: e.target.value })}
          placeholder="https://..." className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Caption</p>
          <input value={block.caption ?? ""} onChange={e => onChange({ ...block, caption: e.target.value })}
            placeholder="Caption shown below image" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none" />
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Alt text (accessibility)</p>
          <input value={block.alt ?? ""} onChange={e => onChange({ ...block, alt: e.target.value })}
            placeholder="Describe the image" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none" />
        </div>
      </div>
    </div>
  );
}

// ─── VideoEditor ──────────────────────────────────────────────────────────────

function VideoEditor({ block, onChange }: { block: VideoBlock; onChange: (b: VideoBlock) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Video URL (YouTube, Vimeo, or direct MP4)</p>
        <input type="url" value={block.url} onChange={e => onChange({ ...block, url: e.target.value })}
          placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..." className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none" />
        <p className="text-xs text-slate-500 mt-1">YouTube and Vimeo links are embedded automatically</p>
      </div>
      <div>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Title</p>
        <input value={block.title ?? ""} onChange={e => onChange({ ...block, title: e.target.value })}
          placeholder="e.g. Introduction to Neural Networks" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none" />
      </div>
      <div>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Description (optional)</p>
        <textarea value={block.description ?? ""} onChange={e => onChange({ ...block, description: e.target.value })}
          rows={2} placeholder="What this video covers…"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none resize-none" />
      </div>
    </div>
  );
}

// ─── Block card ───────────────────────────────────────────────────────────────

function BlockCard({
  block,
  index,
  total,
  onChange,
  onDelete,
  onMove,
}: {
  block: LearnBlock;
  index: number;
  total: number;
  onChange: (b: LearnBlock) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const meta = BLOCK_TYPES.find((t) => t.type === block.type);

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/60 border-b border-slate-700">
        <span className="text-base shrink-0">{meta?.icon ?? <File className="w-4 h-4" />}</span>
        <span className="flex-1 text-xs font-bold text-slate-300 uppercase tracking-widest">
          {meta?.label ?? block.type} #{index + 1}
        </span>
        {/* Move up/down */}
        <div className="flex gap-1">
          <button
            disabled={index === 0}
            onClick={() => onMove(-1)}
            className="text-slate-500 hover:text-white disabled:opacity-20 text-xs px-1.5 py-1 rounded hover:bg-slate-700"
          >↑</button>
          <button
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            className="text-slate-500 hover:text-white disabled:opacity-20 text-xs px-1.5 py-1 rounded hover:bg-slate-700"
          >↓</button>
        </div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-slate-500 hover:text-white text-xs px-2 py-1 rounded hover:bg-slate-700"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={onDelete}
          className="text-rose-400 hover:text-rose-300 text-xs px-2 py-1 rounded hover:bg-rose-500/10 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editor body — each type renders its own specific editor */}
      {expanded && (
        <div className="p-4">
          {block.type === "text" && <TextEditor block={block} onChange={onChange as (b: TextBlock) => void} />}
          {block.type === "code" && <CodeEditor block={block} onChange={onChange as (b: CodeBlock) => void} />}
          {block.type === "quiz" && <QuizEditor block={block} onChange={onChange as (b: QuizBlock) => void} />}
          {block.type === "checklist" && <ChecklistEditor block={block} onChange={onChange as (b: ChecklistBlock) => void} />}
          {block.type === "document" && <DocumentEditor block={block} onChange={onChange as (b: DocumentBlock) => void} />}
          {block.type === "image" && <ImageEditor block={block} onChange={onChange as (b: ImageBlock) => void} />}
          {block.type === "video" && <VideoEditor block={block} onChange={onChange as (b: VideoBlock) => void} />}
        </div>
      )}
    </div>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────

type Props = {
  moduleSlug?: string | null;
  topicId: string;
  topicTitle: string;
  initialBlocks: LearnBlock[];
  tierColor: string;
  trackId?: string;   // pass the known DB track id to avoid slug mismatch on save
  onClose: () => void;
  onSaved: (blocks: LearnBlock[]) => void;
};

export default function TrainerContentEditor({
  moduleSlug,
  topicId,
  topicTitle,
  initialBlocks,
  tierColor,
  trackId,
  onClose,
  onSaved,
}: Props) {
  const [blocks, setBlocks] = useState<LearnBlock[]>(initialBlocks);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Block mutations ──────────────────────────────────────────────────────

  function updateBlock(index: number, newBlock: LearnBlock) {
    setBlocks((prev) => prev.map((b, i) => (i === index ? newBlock : b)));
    setSaved(false);
  }

  function deleteBlock(index: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
    setSaved(false);
  }

  function addBlock(type: LearnBlock["type"]) {
    const newBlock =
      type === "text" ? newTextBlock() :
        type === "code" ? newCodeBlock() :
          type === "quiz" ? newQuizBlock() :
            type === "checklist" ? newChecklistBlock() :
              type === "document" ? newDocumentBlock() :
                type === "image" ? newImageBlock() :
                  type === "video" ? newVideoBlock() : newTextBlock();
    setBlocks((prev) => [...prev, newBlock]);
    setSaved(false);
  }

  function moveBlock(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    setBlocks(next);
    setSaved(false);
  }

  // ── Save to DB ───────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      let res: Response;

      if (trackId) {
        // Preferred path: save directly to track node (works with or without moduleSlug)
        res = await fetch(`/api/passport/tracks/${trackId}/nodes/save-blocks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicId, blocks }),
        });
      } else if (moduleSlug) {
        // Fallback: save via module slug route
        res = await fetch(`/api/module/${moduleSlug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicId, blocks }),
        });
      } else {
        setError("Cannot save: no trackId or moduleSlug available");
        return;
      }

      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setError(b.error ?? "Save failed");
        return;
      }
      setSaved(true);
      onSaved(blocks);
    } catch {
      setError("Network error — could not save");
    } finally {
      setSaving(false);
    }
  }, [moduleSlug, trackId, topicId, blocks, onSaved]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-slate-950">

      {/* ── Editor Header ── */}
      <div className={`shrink-0 bg-gradient-to-r ${tierColor} px-5 py-3 flex items-center gap-3`}>
        <span className="text-lg"><Edit3 className="w-4 h-4 text-white/80" /></span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Editing content</p>
          <p className="font-bold text-white text-sm truncate">{topicTitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 px-4 py-1.5 text-xs font-bold text-white transition disabled:opacity-50"
          >
            {saving ? "Saving…" : saved ? <><Check className="w-3.5 h-3.5 inline mr-1" />Saved</> : <><Save className="w-3.5 h-3.5 inline mr-1" />Save</>}
          </button>
          <button
            onClick={onClose}
            className="rounded-xl bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs text-white/80 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 inline mr-1" />View
          </button>
        </div>
      </div>

      {/* ── Status bar ── */}
      <div className="shrink-0 flex items-center gap-3 px-5 py-2 border-b border-slate-800 bg-slate-900/60 text-xs text-slate-400">
        <span>{blocks.length} block{blocks.length !== 1 ? "s" : ""}</span>
        <span className="text-slate-700">·</span>
        <span>Students see changes immediately after save</span>
        {saved && <span className="ml-auto flex items-center gap-1 text-emerald-400 font-semibold"><Check className="w-3.5 h-3.5" />All changes saved</span>}
        {error && <span className="ml-auto text-rose-400">{error}</span>}
        {saving && <span className="ml-auto text-slate-400 animate-pulse">Saving…</span>}
      </div>

      {/* ── Block list ── */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {blocks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center space-y-2">
            <div className="flex justify-center"><Inbox className="w-10 h-10 text-slate-600" /></div>
            <p className="text-slate-400 text-sm font-medium">No content blocks yet</p>
            <p className="text-slate-500 text-xs">Add blocks below to start building this topic's content.</p>
          </div>
        )}

        {blocks.map((block, i) => (
          <BlockCard
            key={block.id}
            block={block}
            index={i}
            total={blocks.length}
            onChange={(b) => updateBlock(i, b)}
            onDelete={() => deleteBlock(i)}
            onMove={(dir) => moveBlock(i, dir)}
          />
        ))}

        {/* ── Add block buttons ── */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Add block</p>
          <div className="grid grid-cols-2 gap-2">
            {BLOCK_TYPES.map(({ type, label, icon }) => (
              <button
                key={type}
                onClick={() => addBlock(type)}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:border-sky-500/50 hover:text-white hover:bg-slate-700 transition"
              >
                <span className="text-base">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Save button (bottom) ── */}
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className={`w-full rounded-2xl py-3.5 text-sm font-bold transition shadow-lg ${saved
            ? "bg-emerald-600 text-white cursor-default"
            : "bg-gradient-to-r from-sky-600 to-violet-600 hover:from-sky-500 hover:to-violet-500 text-white disabled:opacity-50"
            }`}
        >
          {saving ? "Saving to database…" : saved ? <><Check className="w-4 h-4 inline mr-1.5" />Saved — students can see this now</> : <><Save className="w-4 h-4 inline mr-1.5" />Save changes for students</>}
        </button>
      </div>
    </div>
  );
}
