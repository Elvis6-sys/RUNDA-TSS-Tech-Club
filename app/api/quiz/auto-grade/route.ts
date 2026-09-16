/**
 * /api/quiz/auto-grade
 *
 * Auto-grades objective questions in a submission.
 * Looks up the quiz block definition from:
 *   1. SkillNode.blocks (DB-stored content — trainer-authored)
 *   2. MODULES registry (static seed content fallback)
 *
 * Objective types (fully auto-gradable):
 *   mcq, truefalse, fillin, matching, ordering, multiselect
 *
 * Subjective types (flagged for manual review):
 *   short, essay, coding, file_upload, drawing, audio, video
 */
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { getCallerProfile, canManageTrack } from "@/lib/trainerGuard";
import MODULES from "@/lib/learnContent";

// ─── Objective question types ────────────────────────────────────────────────
const AUTO_GRADABLE = new Set(["mcq", "truefalse", "fillin", "matching", "ordering", "multiselect"]);

// ─── Core grading logic ───────────────────────────────────────────────────────
function autoGrade(qt: string, response: { answerChoice?: number | null; answerText?: string | null }, q: any) {
  if (!AUTO_GRADABLE.has(qt)) {
    return null; // subjective — skip
  }

  // MCQ: single correct option
  if (qt === "mcq") {
    const correct = q.correct ?? 0;
    const hit = response.answerChoice === correct;
    return {
      score: hit ? 100 : 0,
      feedback: hit
        ? `✓ Correct!${q.explanation ? " " + q.explanation : ""}`
        : `✗ Incorrect. Correct: ${String.fromCharCode(65 + correct)}${q.explanation ? ". " + q.explanation : ""}`,
    };
  }

  // True / False: 0 = True, 1 = False
  if (qt === "truefalse") {
    const correct = q.correct ?? 0;
    const hit = response.answerChoice === correct;
    return {
      score: hit ? 100 : 0,
      feedback: hit
        ? `✓ Correct!${q.explanation ? " " + q.explanation : ""}`
        : `✗ Incorrect. Answer was ${correct === 0 ? "True" : "False"}.${q.explanation ? " " + q.explanation : ""}`,
    };
  }

  // Multiselect: all-or-nothing per matched correct options
  if (qt === "multiselect" && Array.isArray(q.correct)) {
    try {
      const studentChoices: number[] = JSON.parse(response.answerText || "[]");
      const correctSet = new Set<number>(q.correct);
      const studentSet = new Set<number>(studentChoices);
      const matched = [...correctSet].filter(c => studentSet.has(c)).length;
      const extra = [...studentSet].filter(c => !correctSet.has(c)).length;
      const score = Math.max(0, Math.round(((matched - extra) / correctSet.size) * 100));
      return {
        score,
        feedback: score === 100
          ? `✓ All correct!${q.explanation ? " " + q.explanation : ""}`
          : `${matched}/${correctSet.size} correct options selected.${extra > 0 ? ` ${extra} wrong choice(s) included.` : ""}`,
      };
    } catch {
      return { score: 0, feedback: "Could not parse multiselect answer." };
    }
  }

  // Fill-in-the-blank: per-blank scoring, case-insensitive
  if (qt === "fillin" && Array.isArray(q.blanks) && q.blanks.length > 0) {
    try {
      const student: string[] = JSON.parse(response.answerText || "[]");
      let hits = 0;
      const details: string[] = [];
      q.blanks.forEach((correct: string, i: number) => {
        const given = (student[i] ?? "").trim().toLowerCase();
        const want = correct.trim().toLowerCase();
        if (given === want) { hits++; details.push(`Blank ${i + 1}: ✓`); }
        else { details.push(`Blank ${i + 1}: ✗ (correct: "${correct}")`); }
      });
      const score = Math.round((hits / q.blanks.length) * 100);
      return { score, feedback: details.join("  ") + (q.explanation ? `  ${q.explanation}` : "") };
    } catch {
      return { score: 0, feedback: "Could not parse fill-in-the-blank answer." };
    }
  }

  // Matching: each correct pair is worth equal weight
  if (qt === "matching" && q.correctPairs && typeof q.correctPairs === "object") {
    try {
      const student: Record<string, string> = JSON.parse(response.answerText || "{}");
      const pairs = q.correctPairs as Record<string, string>;
      const total = Object.keys(pairs).length;
      if (total === 0) return { score: 100, feedback: "No pairs to match." };
      const hits = Object.entries(pairs).filter(([k, v]) => student[k] === v).length;
      const score = Math.round((hits / total) * 100);
      return {
        score,
        feedback: `${hits}/${total} pairs matched correctly.${q.explanation ? " " + q.explanation : ""}`,
      };
    } catch {
      return { score: 0, feedback: "Could not parse matching answer." };
    }
  }

  // Ordering: compare sequence exactly, then give partial credit per correct position
  if (qt === "ordering" && Array.isArray(q.correctOrder)) {
    try {
      const student: number[] = JSON.parse(response.answerText || "[]");
      const correct: number[] = q.correctOrder;
      const hits = correct.filter((v, i) => student[i] === v).length;
      const score = Math.round((hits / correct.length) * 100);
      return {
        score,
        feedback: score === 100
          ? `✓ Perfect order!${q.explanation ? " " + q.explanation : ""}`
          : `${hits}/${correct.length} items in correct position.`,
      };
    } catch {
      return { score: 0, feedback: "Could not parse ordering answer." };
    }
  }

  return null; // unrecognised — skip
}

// ─── Find a quiz block definition from SkillNode.blocks or MODULES ───────────
function findQuestion(nodeBlocks: unknown, blockId: string, questionIdx: number) {
  const blocks: any[] = Array.isArray(nodeBlocks) ? nodeBlocks as any[] : [];
  const block = blocks.find((b: any) => b.id === blockId && b.type === "quiz");
  if (block?.questions?.[questionIdx]) return block.questions[questionIdx];
  if (block && questionIdx === 0 && block.question) return block;
  return null;
}

function findQuestionInModules(blockId: string, questionIdx: number) {
  for (const mod of MODULES) {
    for (const outcome of mod.outcomes) {
      for (const ic of outcome.indicativeContents) {
        for (const topic of ic.topics) {
          const block = topic.blocks.find((b) => b.id === blockId && b.type === "quiz") as any;
          if (!block) continue;
          if (block.questions?.[questionIdx]) return block.questions[questionIdx];
          if (questionIdx === 0 && block.question) return block;
        }
      }
    }
  }
  return null;
}

// ─── POST — auto-grade all objective questions in a submission ────────────────
export async function POST(req: NextRequest) {
  try {
    // Local auth
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const caller = await getCallerProfile(user.id);
    if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { submissionId, trackId } = await req.json() as { submissionId: string; trackId: string };

    if (!(await canManageTrack(caller, trackId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch submission with node blocks
    const submission = await prisma.quizBlockSubmission.findUnique({
      where: { id: submissionId },
      include: { node: { select: { id: true, title: true, blocks: true } } },
    });
    if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const nodeBlocks: any[] = Array.isArray(submission.node.blocks) ? submission.node.blocks as any[] : [];

    // Fetch all unanswered (not-yet-graded) responses
    const responses = await prisma.quizResponse.findMany({
      where: { userId: submission.userId, nodeId: submission.nodeId, blockId: submission.blockId },
      orderBy: { questionIdx: "asc" },
    });

    let autoGradedCount = 0;
    let totalScoreSum = 0;
    let totalGraded = 0;

    for (const resp of responses) {
      // Already manually graded — count toward totals but don't touch
      if (resp.gradeScore !== null && !resp.autoGraded) {
        totalGraded++;
        totalScoreSum += resp.gradeScore;
        continue;
      }
      // Already auto-graded and not overridden — skip re-grading
      if (resp.autoGraded && resp.gradeScore !== null && !resp.manualOverride) {
        totalGraded++;
        totalScoreSum += resp.gradeScore;
        continue;
      }

      const qt = resp.questionType;

      // Find the question definition
      const q = findQuestion(nodeBlocks, submission.blockId, resp.questionIdx)
        ?? findQuestionInModules(submission.blockId, resp.questionIdx);

      if (!q) continue; // can't find question definition — skip

      const result = autoGrade(qt, { answerChoice: resp.answerChoice, answerText: resp.answerText }, q);

      if (result) {
        await prisma.quizResponse.update({
          where: { id: resp.id },
          data: {
            gradeScore: result.score,
            gradeNotes: result.feedback,
            gradedBy: user.id,
            gradedAt: new Date(),
            autoGraded: true,
            autoScore: result.score,
          },
        });
        autoGradedCount++;
        totalGraded++;
        totalScoreSum += result.score;
      }
      // Subjective — leave ungraded, flagged for manual review
    }

    // Recalculate submission stats
    const allResponses = await prisma.quizResponse.findMany({
      where: { userId: submission.userId, nodeId: submission.nodeId, blockId: submission.blockId },
    });
    const gradedResponses = allResponses.filter(r => r.gradeScore !== null);
    const gradedCount = gradedResponses.length;
    const avgScore = gradedCount > 0
      ? Math.round(gradedResponses.reduce((s, r) => s + (r.gradeScore ?? 0), 0) / gradedCount)
      : null;
    const allGraded = gradedCount === allResponses.length;

    await prisma.quizBlockSubmission.update({
      where: { id: submissionId },
      data: { gradedCount, avgScore, status: allGraded ? "graded" : "grading" },
    });

    if (allGraded && avgScore !== null) {
      await prisma.quizGradeNotification.upsert({
        where: { blockSubmissionId: submission.id } as any,
        create: {
          userId: submission.userId,
          blockSubmissionId: submissionId,
          title: "Quiz graded!",
          message: `"${submission.node.title}" — score: ${avgScore}%`,
        },
        update: {
          title: "Quiz graded!",
          message: `"${submission.node.title}" — score: ${avgScore}%`,
          read: false,
        },
      });
    }

    return NextResponse.json({ ok: true, autoGradedCount, gradedCount, avgScore, allGraded });
  } catch (e) {
    console.error("[auto-grade]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
