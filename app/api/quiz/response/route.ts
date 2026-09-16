/**
 * POST /api/quiz/response (ENHANCED WITH SECURITY)
 *
 * Saves a student's answer for one question in a quiz block.
 * Now includes: rate limiting, device fingerprinting, time validation
 */
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import MODULES from "@/lib/learnContent";
import {
  checkRateLimit,
  generateFingerprint,
  recordQuestionAnswer,
  getTimingStats,
} from "@/lib/quiz-security";

// ─── Objective types — graded instantly ──────────────────────────────────────
const AUTO_GRADABLE = new Set(["mcq", "truefalse", "fillin", "matching", "ordering", "multiselect"]);

function findQuestion(nodeBlocks: unknown, blockId: string, idx: number) {
  // node.blocks is a Prisma Json field — guard against null/non-array values
  const blocks: any[] = Array.isArray(nodeBlocks) ? nodeBlocks : [];
  const block = blocks.find((b: any) => b.id === blockId && b.type === "quiz");
  if (block?.questions?.[idx]) return block.questions[idx];
  if (block && idx === 0 && block.question) return block;
  return null;
}

function findQuestionInModules(blockId: string, idx: number) {
  for (const mod of MODULES) {
    for (const outcome of mod.outcomes) {
      for (const ic of outcome.indicativeContents) {
        for (const topic of ic.topics) {
          const block = topic.blocks.find((b) => b.id === blockId && b.type === "quiz") as any;
          if (!block) continue;
          if (block.questions?.[idx]) return block.questions[idx];
          if (idx === 0 && block.question) return block;
        }
      }
    }
  }
  return null;
}

function autoGrade(
  qt: string,
  answerChoice: number | null | undefined,
  answerText: string | null | undefined,
  q: any,
): { score: number; feedback: string } | null {
  if (!AUTO_GRADABLE.has(qt)) return null;

  if (qt === "mcq") {
    const correct = q.correct ?? 0;
    const hit = answerChoice === correct;
    return {
      score: hit ? 100 : 0,
      feedback: hit
        ? `✓ Correct!${q.explanation ? " " + q.explanation : ""}`
        : `✗ Incorrect. Correct answer: ${String.fromCharCode(65 + correct)}.${q.explanation ? " " + q.explanation : ""}`,
    };
  }

  if (qt === "truefalse") {
    const correct = q.correct ?? 0;
    const hit = answerChoice === correct;
    return {
      score: hit ? 100 : 0,
      feedback: hit
        ? `✓ Correct!${q.explanation ? " " + q.explanation : ""}`
        : `✗ Incorrect. Answer: ${correct === 0 ? "True" : "False"}.${q.explanation ? " " + q.explanation : ""}`,
    };
  }

  if (qt === "multiselect" && Array.isArray(q.correct)) {
    try {
      const student: number[] = JSON.parse(answerText || "[]");
      const correctSet = new Set<number>(q.correct);
      const studentSet = new Set<number>(student);
      const matched = [...correctSet].filter(c => studentSet.has(c)).length;
      const extra = [...studentSet].filter(c => !correctSet.has(c)).length;
      const score = Math.max(0, Math.round(((matched - extra) / correctSet.size) * 100));
      return {
        score,
        feedback: score === 100
          ? `✓ All correct!${q.explanation ? " " + q.explanation : ""}`
          : `${matched}/${correctSet.size} correct. ${extra > 0 ? `${extra} wrong choice(s).` : ""}`,
      };
    } catch { return { score: 0, feedback: "Could not parse answer." }; }
  }

  if (qt === "fillin" && Array.isArray(q.blanks) && q.blanks.length > 0) {
    try {
      const student: string[] = JSON.parse(answerText || "[]");
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
    } catch { return { score: 0, feedback: "Could not parse fill-in answer." }; }
  }

  if (qt === "matching" && q.correctPairs && typeof q.correctPairs === "object") {
    try {
      const student: Record<string, string> = JSON.parse(answerText || "{}");
      const pairs = q.correctPairs as Record<string, string>;
      const total = Object.keys(pairs).length;
      if (total === 0) return { score: 100, feedback: "No pairs defined." };
      const hits = Object.entries(pairs).filter(([k, v]) => student[k] === v).length;
      return {
        score: Math.round((hits / total) * 100),
        feedback: `${hits}/${total} pairs correct.${q.explanation ? " " + q.explanation : ""}`,
      };
    } catch { return { score: 0, feedback: "Could not parse matching answer." }; }
  }

  if (qt === "ordering" && Array.isArray(q.correctOrder)) {
    try {
      const student: number[] = JSON.parse(answerText || "[]");
      const correct: number[] = q.correctOrder;
      const hits = correct.filter((v, i) => student[i] === v).length;
      const score = Math.round((hits / correct.length) * 100);
      return {
        score,
        feedback: score === 100
          ? `✓ Perfect order!${q.explanation ? " " + q.explanation : ""}`
          : `${hits}/${correct.length} items in correct position.`,
      };
    } catch { return { score: 0, feedback: "Could not parse ordering answer." }; }
  }

  return null;
}

// ─── POST (ENHANCED WITH SECURITY) ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    console.log("[quiz/response] 📥 Received quiz submission request");
    // Local auth
    const user = await getCurrentUser();
    if (!user) {
      console.log("[quiz/response] ❌ No user found - Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("[quiz/response] ✅ User authenticated:", user.id, user.email);

    // ── Security Check 1: Rate Limiting ───────────────────────────────────
    const rateLimit = checkRateLimit(user.id, "quiz_answer", {
      maxAttempts: 30,      // 30 submissions
      windowMs: 60 * 1000,  // per minute
      penaltyMs: 2 * 60 * 1000, // 2 minute penalty
    });

    if (!rateLimit.allowed) {
      console.warn(`⚠️ Rate limit exceeded for user ${user.id}`);
      return NextResponse.json({
        error: "Too many submissions. Please slow down.",
        resetAt: rateLimit.resetAt,
        penaltyUntil: rateLimit.penaltyUntil,
      }, { status: 429 });
    }

    const {
      nodeId, blockId, questionIdx, questionType,
      answerChoice, answerText, totalQuestions,
      deviceFingerprint, questionViewTime, trackId: providedTrackId,
      fileUrl: submittedFileUrl,
    } = await req.json() as {
      nodeId: string; blockId: string; questionIdx: number;
      questionType: string; answerChoice?: number;
      answerText?: string; totalQuestions?: number;
      deviceFingerprint?: string; questionViewTime?: number;
      trackId?: string;
      fileUrl?: string;
    };

    console.log("[quiz/response] 📦 Request body:", { nodeId, blockId, questionIdx, questionType, providedTrackId, totalQuestions });

    if (!nodeId || !blockId || questionIdx === undefined || !questionType) {
      console.log("[quiz/response] ❌ Missing required fields");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ── Fetch node for trackId EARLY (needed for timing validation) ─────────
    const node = await prisma.skillNode.findUnique({
      where: { id: nodeId },
      select: { trackId: true, blocks: true },
    });
    if (!node) {
      console.log("[quiz/response] ❌ Node not found:", nodeId);
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    // Use provided trackId if available, otherwise use from database
    const trackId = providedTrackId || node.trackId || "";
    console.log("[quiz/response] 📍 TrackId resolved:", trackId);
    const nodeBlocks: any[] = Array.isArray(node.blocks) ? node.blocks as any[] : [];

    // ── Security Check 2: Device Fingerprinting ──────────────────────────
    const currentFingerprint = await generateFingerprint();

    // Check if submission exists with different fingerprint
    const existingSubmission = await prisma.quizBlockSubmission.findUnique({
      where: { userId_nodeId_blockId: { userId: user.id, nodeId, blockId } },
      select: { cheatLog: true },
    });

    if (existingSubmission) {
      const cheatLog: any[] = existingSubmission.cheatLog
        ? JSON.parse(existingSubmission.cheatLog)
        : [];

      // Check for device switches
      const initialFingerprint = cheatLog.find(e => e.type === 'session_start')?.metadata?.fingerprint;

      if (initialFingerprint && initialFingerprint !== currentFingerprint.hash) {
        console.warn(`🚨 Device fingerprint mismatch for user ${user.id}`);

        // Log as cheat event
        await prisma.quizBlockSubmission.update({
          where: { userId_nodeId_blockId: { userId: user.id, nodeId, blockId } },
          data: {
            cheatAttempts: { increment: 1 },
            cheatLog: JSON.stringify([
              ...cheatLog,
              {
                type: 'device_switch',
                timestamp: new Date().toISOString(),
                metadata: {
                  initial: initialFingerprint,
                  current: currentFingerprint.hash,
                },
              },
            ]),
          },
        });
      }
    }

    // ── Security Check 3: Time-based Validation ──────────────────────────
    const quizId = `${nodeId}:${blockId}`;
    const timingResult = recordQuestionAnswer(user.id, quizId, `${blockId}-${questionIdx}`);

    if (timingResult.suspicious) {
      console.warn(`⏱️ Suspicious timing for user ${user.id}: ${timingResult.reason}`);

      // Get existing submission to append to cheatLog
      const existingSuspiciousSubmission = await prisma.quizBlockSubmission.findUnique({
        where: { userId_nodeId_blockId: { userId: user.id, nodeId, blockId } },
        select: { cheatLog: true }
      });

      const existingCheatLog = existingSuspiciousSubmission?.cheatLog
        ? JSON.parse(existingSuspiciousSubmission.cheatLog)
        : [];

      // Log as suspicious activity
      await prisma.quizBlockSubmission.upsert({
        where: { userId_nodeId_blockId: { userId: user.id, nodeId, blockId } },
        create: {
          userId: user.id,
          nodeId,
          blockId,
          trackId,
          status: "submitted",
          totalQuestions: totalQuestions || 1,
          gradedCount: 0,
          cheatAttempts: 1,
          cheatLog: JSON.stringify([{
            type: 'suspicious_timing',
            timestamp: new Date().toISOString(),
            metadata: {
              timeSpentMs: timingResult.timeSpentMs,
              reason: timingResult.reason,
            },
          }]),
        },
        update: {
          cheatAttempts: { increment: 1 },
          cheatLog: JSON.stringify([
            ...existingCheatLog,
            {
              type: 'suspicious_timing',
              timestamp: new Date().toISOString(),
              metadata: {
                timeSpentMs: timingResult.timeSpentMs,
                reason: timingResult.reason,
              },
            },
          ]),
        },
      });
    }

    // ── Try auto-grade ──────────────────────────────────────────────────────
    let gradeData: {
      gradeScore: number; gradeNotes: string;
      autoGraded: boolean; autoScore: number;
      gradedAt: Date; gradedBy: string;
    } | undefined;

    if (AUTO_GRADABLE.has(questionType)) {
      const q = findQuestion(nodeBlocks, blockId, questionIdx)
        ?? findQuestionInModules(blockId, questionIdx);
      if (q) {
        const result = autoGrade(questionType, answerChoice, answerText, q);
        if (result) {
          gradeData = {
            gradeScore: result.score,
            gradeNotes: result.feedback,
            autoGraded: true,
            autoScore: result.score,
            gradedAt: new Date(),
            gradedBy: "system",
          };
        }
      }
    }

    // ── Save response (upsert so re-submitting updates gracefully) ──────────
    console.log("[quiz/response] 💾 Saving QuizResponse...");
    const saved = await prisma.quizResponse.upsert({
      where: { userId_nodeId_blockId_questionIdx: { userId: user.id, nodeId, blockId, questionIdx } },
      create: {
        userId: user.id, nodeId, blockId, questionIdx, questionType,
        answerChoice, answerText,
        ...(submittedFileUrl ? { fileUrl: submittedFileUrl } : {}),
        ...(gradeData ?? {}),
      },
      update: {
        answerChoice, answerText, updatedAt: new Date(),
        ...(submittedFileUrl ? { fileUrl: submittedFileUrl } : {}),
        // Re-grade on re-submit (unless manually overridden)
        ...(gradeData ? {
          gradeScore: gradeData.gradeScore,
          gradeNotes: gradeData.gradeNotes,
          autoGraded: true,
          autoScore: gradeData.autoScore,
          gradedAt: gradeData.gradedAt,
          gradedBy: gradeData.gradedBy,
          manualOverride: false,
        } : {}),
      },
    });

    // ── Upsert the block submission summary ─────────────────────────────────
    const responseCount = await prisma.quizResponse.count({
      where: { userId: user.id, nodeId, blockId },
    });
    const total = totalQuestions ?? responseCount;

    // ── Calculate grading stats BEFORE creating submission/notifications ─────
    const allResponses = await prisma.quizResponse.findMany({
      where: { userId: user.id, nodeId, blockId },
    });
    const gradedResponses = allResponses.filter(r => r.gradeScore !== null);
    const gradedCount = gradedResponses.length;
    const avgScore = gradedCount > 0
      ? Math.round(gradedResponses.reduce((s, r) => s + (r.gradeScore ?? 0), 0) / gradedCount)
      : null;
    const allGraded = gradedCount === allResponses.length;

    // Detect auto-submit
    const isAutoSubmit = answerText === "[AUTO-SUBMITTED]";
    console.log("[quiz/response] 🚨 Auto-submit detected:", isAutoSubmit);
    console.log("[quiz/response] 💾 About to upsert QuizBlockSubmission with:", {
      userId: user.id,
      nodeId,
      blockId,
      trackId,
      totalQuestions: total
    });

    const submission = await prisma.quizBlockSubmission.upsert({
      where: { userId_nodeId_blockId: { userId: user.id, nodeId, blockId } },
      create: {
        userId: user.id, nodeId, blockId, trackId,
        status: "submitted",
        totalQuestions: total,
        gradedCount: 0,
        autoSubmitted: isAutoSubmit, // Mark if auto-submitted
        cheatLog: JSON.stringify([{
          type: 'session_start',
          timestamp: new Date().toISOString(),
          metadata: {
            fingerprint: currentFingerprint.hash,
            ip: currentFingerprint.ip,
            userAgent: currentFingerprint.userAgent,
          },
        }]),
      },
      update: {
        totalQuestions: total,
        updatedAt: new Date(),
        ...(isAutoSubmit ? { autoSubmitted: true } : {}), // Mark if auto-submitted
      },
    });

    // ── Notify teacher about quiz submission ────────────────────────────────
    // Create notification when: first answer, auto-submit, or completed
    const isFirstAnswer = responseCount === 1;
    const isCompleted = allGraded && avgScore !== null;

    if (isFirstAnswer || isAutoSubmit || isCompleted) {
      prisma.skillTrack.findUnique({ where: { id: trackId }, select: { trainerId: true } })
        .then(async track => {
          if (!track?.trainerId) return;

          const [student, nodeInfo] = await Promise.all([
            prisma.userProfile.findUnique({ where: { id: user.id }, select: { name: true, email: true } }),
            prisma.skillNode.findUnique({ where: { id: nodeId }, select: { title: true } }),
          ]);

          const studentName = student?.name ?? student?.email ?? "Student";
          const quizTitle = nodeInfo?.title ?? "Quiz";

          // Create notification for teacher
          if (isAutoSubmit) {
            // HIGH PRIORITY: Auto-submitted due to violations
            await prisma.cheatNotification.create({
              data: {
                trackId,
                studentId: user.id,
                blockSubmissionId: submission.id,
                studentName,
                nodeTitle: `🚨 ${quizTitle} - Auto-Submitted`,
                attemptNumber: 1,
                autoSubmitted: true,
              },
            });
          } else if (isFirstAnswer) {
            // Notify: Student started quiz
            await prisma.cheatNotification.create({
              data: {
                trackId,
                studentId: user.id,
                blockSubmissionId: submission.id,
                studentName,
                nodeTitle: quizTitle,
                attemptNumber: 1,
                autoSubmitted: false,
              },
            });
          } else if (isCompleted) {
            // Notify: Quiz auto-graded and ready for review
            await prisma.cheatNotification.create({
              data: {
                trackId,
                studentId: user.id,
                blockSubmissionId: submission.id,
                studentName,
                nodeTitle: `${quizTitle} - Completed (${avgScore}%)`,
                attemptNumber: 1,
                autoSubmitted: false,
              },
            });
          }
        }).catch(() => {/* non-fatal */ });
    }

    await prisma.quizBlockSubmission.update({
      where: { id: submission.id },
      data: {
        gradedCount,
        avgScore,
        status: allGraded ? "graded" : gradedCount > 0 ? "grading" : "submitted",
      },
    });

    console.log("[quiz/response] ✅ Submission complete:", {
      submissionId: submission.id,
      gradedCount,
      avgScore,
      allGraded,
      isAutoSubmit
    });

    // Notify student if all questions auto-graded
    if (allGraded && avgScore !== null) {
      const node2 = await prisma.skillNode.findUnique({ where: { id: nodeId }, select: { title: true } });
      await prisma.quizGradeNotification.create({
        data: {
          userId: user.id,
          blockSubmissionId: submission.id,
          title: "Quiz graded!",
          message: `"${node2?.title ?? "Quiz"}" auto-graded. Score: ${avgScore}%`,
        },
      }).catch(() => {/* non-fatal */ });
    }

    return NextResponse.json({
      ok: true,
      submissionId: submission.id,
      autoGraded: !!gradeData,
      score: gradeData?.gradeScore,
      rateLimit: {
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      },
      timingWarning: timingResult.suspicious ? timingResult.reason : null,
    });
  } catch (e) {
    console.error("[quiz/response]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
