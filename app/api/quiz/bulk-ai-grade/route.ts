/**
 * POST /api/quiz/bulk-ai-grade
 * 
 * Bulk AI grading for all question types (objective + subjective)
 * - Objective: MCQ, true/false, fill-in, matching, ordering, multiselect → Auto-graded instantly
 * - Subjective: Short answer, essay, coding → AI-graded with teacher review
 * 
 * UPDATED: Now supports FREE Hugging Face API as fallback!
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import MODULES from "@/lib/learnContent";
import { getCallerProfile, canManageTrack } from "@/lib/trainerGuard";
import { getCurrentAPIKey, handleRateLimitError } from "@/lib/api-key-manager";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || "";
const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2";
// Models confirmed working as of 2026
const GROQ_MODEL_PRIMARY = "openai/gpt-oss-120b";   // Best JSON output, confirmed working
const GROQ_MODEL_FALLBACK = "groq/compound";         // Reliable fallback

type BulkGradeRequest = {
  submissionId: string;
  trackId: string;
};

type GradeResult = {
  responseId: string;
  questionIdx: number;
  questionType: string;
  suggestedScore: number;
  feedback: string;
  confidence: number;
  autoGraded: boolean;
  strengths?: string[];
  improvements?: string[];
};

export async function POST(req: NextRequest) {
  try {
    console.log("[bulk-ai-grade] 📥 Received bulk grading request");

    // Authenticate teacher
    // Local auth
    const user = await getCurrentUser();

    console.log("[bulk-ai-grade] User:", user?.id, user?.email);

    if (!user) {
      console.log("[bulk-ai-grade] ❌ No user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caller = await getCallerProfile(user.id);
    console.log("[bulk-ai-grade] Caller profile:", caller);

    if (!caller) {
      console.log("[bulk-ai-grade] ❌ No caller profile");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { submissionId, trackId }: BulkGradeRequest = await req.json();

    if (!submissionId || !trackId) {
      return NextResponse.json({
        error: "Missing required fields: submissionId, trackId"
      }, { status: 400 });
    }

    // Check if user can manage this track
    if (!(await canManageTrack(caller, trackId))) {
      console.log("[bulk-ai-grade] ❌ Cannot manage track:", trackId);
      return NextResponse.json({ error: "Only trainers can grade" }, { status: 403 });
    }

    console.log("[bulk-ai-grade] ✅ Trainer authenticated");

    // Get submission details
    console.log("[bulk-ai-grade] 📦 Finding submission:", submissionId);
    const submission = await prisma.quizBlockSubmission.findUnique({
      where: { id: submissionId },
      include: {
        node: {
          select: {
            blocks: true,
            title: true,
            id: true,
            trackId: true
          }
        },
      },
    });

    if (!submission) {
      console.log("[bulk-ai-grade] ❌ Submission not found");
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    console.log("[bulk-ai-grade] ✅ Found submission for user:", submission.userId);
    console.log("[bulk-ai-grade] 📦 Node ID:", submission.nodeId);
    console.log("[bulk-ai-grade] 📦 Block ID:", submission.blockId);
    const blocksCount = Array.isArray(submission.node.blocks) ? submission.node.blocks.length :
      (submission.node.blocks && typeof submission.node.blocks === 'object' ? Object.keys(submission.node.blocks).length : 0);
    console.log("[bulk-ai-grade] 📦 Node has blocks:", Array.isArray(submission.node.blocks), "count:", blocksCount);
    console.log("[bulk-ai-grade] 📦 Node.blocks content:", JSON.stringify(submission.node.blocks).substring(0, 500));

    // Get all responses for this submission
    const responses = await prisma.quizResponse.findMany({
      where: {
        userId: submission.userId,
        nodeId: submission.nodeId,
        blockId: submission.blockId,
      },
      orderBy: { questionIdx: "asc" },
    });

    console.log("[bulk-ai-grade] 📝 Found", responses.length, "responses");

    // Get node blocks for question lookup
    // Blocks are stored as { "nodeId-t1": [...blocks], "nodeId-t2": [...blocks] }
    // OR { "default-outcome-0": [...blocks] }
    let nodeBlocks: any[] = [];
    let nodeBlocksObj = submission.node.blocks as any;

    // Parse if it's a JSON string
    if (typeof nodeBlocksObj === 'string') {
      try {
        nodeBlocksObj = JSON.parse(nodeBlocksObj);
        console.log("[bulk-ai-grade] 📦 Parsed JSON string to object");
      } catch (e) {
        console.error("[bulk-ai-grade] ❌ Failed to parse blocks JSON:", e);
        nodeBlocksObj = null;
      }
    }

    console.log("[bulk-ai-grade] 📦 nodeBlocksObj type after parsing:", typeof nodeBlocksObj);
    console.log("[bulk-ai-grade] 📦 nodeBlocksObj keys:", nodeBlocksObj ? Object.keys(nodeBlocksObj) : 'null');

    if (Array.isArray(nodeBlocksObj)) {
      nodeBlocks = nodeBlocksObj;
      console.log("[bulk-ai-grade] 📦 Blocks is array, length:", nodeBlocks.length);
    } else if (nodeBlocksObj && typeof nodeBlocksObj === 'object') {
      // Extract blocks from keyed object structure
      for (const key of Object.keys(nodeBlocksObj)) {
        const blocks = nodeBlocksObj[key];
        console.log(`[bulk-ai-grade] 📦 Processing key "${key}", value type:`, typeof blocks, "isArray:", Array.isArray(blocks));
        if (Array.isArray(blocks)) {
          console.log(`[bulk-ai-grade] 📦 Key "${key}" has ${blocks.length} blocks`);
          nodeBlocks = nodeBlocks.concat(blocks);
        }
      }
    }

    console.log("[bulk-ai-grade] 📦 Extracted", nodeBlocks.length, "blocks from node");
    console.log("[bulk-ai-grade] 📦 Block IDs:", nodeBlocks.map((b: any) => `${b.id}:${b.type}`).join(", "));

    // Helper to find questions (checks database first, then MODULES)
    function findQuestion(blockId: string, questionIdx: number) {
      // Try database blocks first
      const dbBlock = nodeBlocks.find((b: any) => b.id === blockId && b.type === "quiz");
      if (dbBlock?.questions?.[questionIdx]) return dbBlock.questions[questionIdx];
      if (dbBlock && questionIdx === 0 && dbBlock.question) return dbBlock;

      // Then try MODULES
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

    console.log("[bulk-ai-grade] 🎯 Starting bulk grading...");

    console.log("[bulk-ai-grade] 🎯 Grading", responses.length, "responses");

    // Grade all responses
    const results: GradeResult[] = [];

    for (const response of responses) {
      // Skip already graded
      if (response.gradeScore !== null) {
        console.log(`[bulk-ai-grade] ⏭️ Skipping Q${response.questionIdx + 1} (already graded)`);
        continue;
      }

      const question = findQuestion(submission.blockId, response.questionIdx);
      if (!question) {
        console.log(`[bulk-ai-grade] ⚠️  Question ${response.questionIdx + 1} not found in modules`);
        continue;
      }

      console.log(`[bulk-ai-grade] 🔄 Grading Q${response.questionIdx + 1}: ${response.questionType}`);

      // Grade based on question type
      const gradeResult = await gradeQuestion({
        response,
        question,
        questionType: response.questionType,
        nodeTitle: submission.node.title,
      });

      results.push(gradeResult);
    }

    console.log(`[bulk-ai-grade] ✅ Graded ${results.length} questions`);

    // Count network failures
    const networkFailures = results.filter(r =>
      r.feedback.includes('network error') || r.feedback.includes('temporarily unavailable')
    ).length;

    if (networkFailures > 0) {
      console.log(`[bulk-ai-grade] ⚠️ ${networkFailures} questions had network errors - marked for manual review`);
    }

    return NextResponse.json({
      success: true,
      gradedCount: results.length,
      results,
      networkIssues: networkFailures > 0,
      message: networkFailures > 0
        ? `Graded ${results.length} questions. ${networkFailures} subjective questions need manual review due to AI service connectivity issues.`
        : undefined,
    });

  } catch (error) {
    console.error("[bulk-ai-grade] ❌ Error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Bulk grading failed"
    }, { status: 500 });
  }
}

async function gradeQuestion(params: {
  response: any;
  question: any;
  questionType: string;
  nodeTitle: string;
}): Promise<GradeResult> {
  const { response, question, questionType, nodeTitle } = params;

  // Objective questions - auto-grade
  if (isObjectiveQuestion(questionType)) {
    return gradeObjectiveQuestion(response, question, questionType);
  }

  // Subjective questions - AI-grade
  return gradeSubjectiveQuestion(response, question, questionType, nodeTitle);
}

function isObjectiveQuestion(type: string): boolean {
  return ["mcq", "truefalse", "fillin", "matching", "ordering", "multiselect"].includes(type);
}

function gradeObjectiveQuestion(
  response: any,
  question: any,
  questionType: string
): GradeResult {
  let score = 0;
  let feedback = "";

  if (questionType === "mcq") {
    const correct = question.correct ?? 0;
    const hit = response.answerChoice === correct;
    score = hit ? 100 : 0;
    feedback = hit
      ? `✓ Correct!${question.explanation ? " " + question.explanation : ""}`
      : `✗ Incorrect. Correct answer: ${String.fromCharCode(65 + correct)}.${question.explanation ? " " + question.explanation : ""
      }`;
  }

  if (questionType === "truefalse") {
    const correct = question.correct ?? 0;
    const hit = response.answerChoice === correct;
    score = hit ? 100 : 0;
    feedback = hit
      ? `✓ Correct!${question.explanation ? " " + question.explanation : ""}`
      : `✗ Incorrect. Answer: ${correct === 0 ? "True" : "False"}.${question.explanation ? " " + question.explanation : ""
      }`;
  }

  if (questionType === "multiselect" && Array.isArray(question.correct)) {
    try {
      const student: number[] = JSON.parse(response.answerText || "[]");
      const correctSet = new Set<number>(question.correct);
      const studentSet = new Set<number>(student);
      const matched = [...correctSet].filter(c => studentSet.has(c)).length;
      const extra = [...studentSet].filter(c => !correctSet.has(c)).length;
      score = Math.max(0, Math.round(((matched - extra) / correctSet.size) * 100));
      feedback = score === 100
        ? `✓ All correct!${question.explanation ? " " + question.explanation : ""}`
        : `${matched}/${correctSet.size} correct. ${extra > 0 ? `${extra} wrong choice(s).` : ""}`;
    } catch {
      score = 0;
      feedback = "Could not parse answer.";
    }
  }

  if (questionType === "fillin" && Array.isArray(question.blanks)) {
    try {
      const student: string[] = JSON.parse(response.answerText || "[]");
      let hits = 0;
      const details: string[] = [];
      question.blanks.forEach((correct: string, i: number) => {
        const given = (student[i] ?? "").trim().toLowerCase();
        const want = correct.trim().toLowerCase();
        if (given === want) {
          hits++;
          details.push(`Blank ${i + 1}: ✓`);
        } else {
          details.push(`Blank ${i + 1}: ✗ (correct: "${correct}")`);
        }
      });
      score = Math.round((hits / question.blanks.length) * 100);
      feedback = details.join("  ") + (question.explanation ? `  ${question.explanation}` : "");
    } catch {
      score = 0;
      feedback = "Could not parse fill-in answer.";
    }
  }

  if (questionType === "matching" && question.correctPairs) {
    try {
      const student: Record<string, string> = JSON.parse(response.answerText || "{}");
      const pairs = question.correctPairs as Record<string, string>;
      const total = Object.keys(pairs).length;
      if (total === 0) {
        score = 100;
        feedback = "No pairs defined.";
      } else {
        const hits = Object.entries(pairs).filter(([k, v]) => student[k] === v).length;
        score = Math.round((hits / total) * 100);
        feedback = `${hits}/${total} pairs correct.${question.explanation ? " " + question.explanation : ""
          }`;
      }
    } catch {
      score = 0;
      feedback = "Could not parse matching answer.";
    }
  }

  if (questionType === "ordering" && Array.isArray(question.correctOrder)) {
    try {
      const student: number[] = JSON.parse(response.answerText || "[]");
      const correct: number[] = question.correctOrder;
      const hits = correct.filter((v, i) => student[i] === v).length;
      score = Math.round((hits / correct.length) * 100);
      feedback = score === 100
        ? `✓ Perfect order!${question.explanation ? " " + question.explanation : ""}`
        : `${hits}/${correct.length} items in correct position.`;
    } catch {
      score = 0;
      feedback = "Could not parse ordering answer.";
    }
  }

  return {
    responseId: response.id,
    questionIdx: response.questionIdx,
    questionType,
    suggestedScore: score,
    feedback,
    confidence: 100, // Objective questions are 100% certain
    autoGraded: true,
  };
}

async function gradeSubjectiveQuestion(
  response: any,
  question: any,
  questionType: string,
  nodeTitle: string
): Promise<GradeResult> {
  // Always try - FREE fallback available!
  if (!OPENAI_API_KEY && !HF_API_KEY) {
    console.warn(`[bulk-ai-grade] No API keys - using FREE Hugging Face for Q${response.questionIdx + 1}`);
  }

  try {
    const prompt = buildSubjectiveGradingPrompt({
      question: question.question,
      studentAnswer: response.answerText || "",
      modelAnswer: question.sampleAnswer,
      rubric: question.rubric,
      questionType,
    });

    const aiResponse = await callBestAI(prompt);

    return {
      responseId: response.id,
      questionIdx: response.questionIdx,
      questionType,
      suggestedScore: aiResponse.suggestedScore,
      feedback: aiResponse.feedback,
      confidence: aiResponse.confidence,
      autoGraded: false,
      strengths: aiResponse.strengths,
      improvements: aiResponse.improvements,
    };
  } catch (error) {
    console.error(`[bulk-ai-grade] AI grading failed for Q${response.questionIdx + 1}:`, error);

    // Network error - provide helpful fallback
    const isNetworkError = error instanceof Error &&
      (error.message.includes('ENOTFOUND') || error.message.includes('fetch failed'));

    return {
      responseId: response.id,
      questionIdx: response.questionIdx,
      questionType,
      suggestedScore: 50,
      feedback: isNetworkError
        ? "⚠️ AI service temporarily unavailable (network error). Please review and grade manually."
        : "AI grading failed. Please grade manually.",
      confidence: 0,
      autoGraded: false,
    };
  }
}

function buildSubjectiveGradingPrompt(params: {
  question: string;
  studentAnswer: string;
  modelAnswer?: string;
  rubric?: string;
  questionType: string;
}): string {
  const { question, studentAnswer, modelAnswer, rubric, questionType } = params;

  let prompt = `You are an expert educational assessor. Grade this ${questionType} question objectively.

QUESTION:
${question}

STUDENT ANSWER:
${studentAnswer}
`;

  if (modelAnswer) {
    prompt += `\nMODEL ANSWER:
${modelAnswer}
`;
  }

  if (rubric) {
    prompt += `\nGRADING RUBRIC:
${rubric}
`;
  }

  prompt += `\n
Provide fair, constructive grading. Respond with valid JSON only:
{
  "suggestedScore": <0-100>,
  "confidence": <0-100>,
  "feedback": "<2-3 sentences>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"]
}`;

  return prompt;
}

// Smart AI router: OpenAI (paid) → Groq with rotation → Hugging Face (FREE)
async function callBestAI(prompt: string): Promise<any> {
  // Try OpenAI first if available (most accurate)
  if (OPENAI_API_KEY) {
    try {
      console.log("[bulk-ai-grade] 🤖 Using OpenAI");
      return await callOpenAI(prompt);
    } catch (error) {
      console.error("[bulk-ai-grade] OpenAI failed, trying Groq:", error);
    }
  }

  // Try Groq with automatic key rotation (openai/gpt-oss-120b — confirmed working)
  try {
    console.log(`[bulk-ai-grade] ⚡ Using Groq (${GROQ_MODEL_PRIMARY}) with key rotation`);
    return await callGroq(prompt, GROQ_MODEL_PRIMARY);
  } catch (error) {
    console.error(`[bulk-ai-grade] Groq ${GROQ_MODEL_PRIMARY} failed, trying fallback:`, error);

    // Try Groq fallback model
    try {
      console.log(`[bulk-ai-grade] ⚡ Using Groq fallback (${GROQ_MODEL_FALLBACK})`);
      return await callGroq(prompt, GROQ_MODEL_FALLBACK);
    } catch (error2) {
      console.error(`[bulk-ai-grade] Groq ${GROQ_MODEL_FALLBACK} failed, trying Hugging Face:`, error2);
    }
  }

  // Last resort: Hugging Face (FREE)
  console.log("[bulk-ai-grade] 🤗 Using FREE Hugging Face");
  return await callHuggingFace(prompt);
}

// OpenAI grading (paid, most accurate)
async function callOpenAI(prompt: string): Promise<any> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert educational assessor. Respond with valid JSON only."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No response from OpenAI");
  }

  // Try to parse JSON
  try {
    return JSON.parse(content);
  } catch {
    // Try to extract from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    throw new Error("AI returned invalid JSON");
  }
}

// Groq grading (100% FREE, fast!) with automatic key rotation
async function callGroq(prompt: string, model: string = GROQ_MODEL_PRIMARY): Promise<any> {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const apiKey = getCurrentAPIKey(); // Get next available key with rotation

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content: "You are an expert educational assessor. Respond with valid JSON only."
            },
            { role: "user", content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        // Handle rate limiting
        if (response.status === 429) {
          console.log(`[bulk-ai-grade] ⚠️ Rate limit hit, rotating to next API key (attempt ${retryCount + 1}/${maxRetries})`);
          handleRateLimitError(); // Rotate to next key

          if (retryCount < maxRetries - 1) {
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 500));
            continue; // Retry with next key
          }
        }

        throw new Error(`Groq API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error("No response from Groq");
      }

      // Try to parse JSON
      try {
        return JSON.parse(content);
      } catch {
        // Try to extract from markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1]);
        }
        throw new Error("AI returned invalid JSON");
      }
    } catch (error) {
      // If this was a rate limit error and we have retries left, continue
      if (retryCount < maxRetries - 1 && error instanceof Error && error.message.includes('429')) {
        retryCount++;
        continue;
      }
      // Otherwise, throw the error
      throw error;
    }
  }

  throw new Error("All Groq API key rotation attempts exhausted");
}

// Hugging Face grading (100% FREE!)
async function callHuggingFace(prompt: string): Promise<any> {
  const response = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(HF_API_KEY && { Authorization: `Bearer ${HF_API_KEY}` }),
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 800,
        temperature: 0.3,
        top_p: 0.9,
        return_full_text: false,
      },
    }),
  });

  if (!response.ok) {
    if (response.status === 503) {
      console.log("[bulk-ai-grade] Model loading, waiting...");
      await new Promise(resolve => setTimeout(resolve, 10000));
      return callHuggingFace(prompt); // Retry once
    }
    throw new Error(`Hugging Face error: ${response.status}`);
  }

  const data = await response.json();

  // Handle response formats
  let content = "";
  if (Array.isArray(data) && data[0]?.generated_text) {
    content = data[0].generated_text;
  } else if (data.generated_text) {
    content = data.generated_text;
  } else {
    throw new Error("Unexpected HF response format");
  }

  // Parse JSON from response
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in HF response");

    const parsed = JSON.parse(jsonMatch[0]);

    // Sanitize response
    return {
      suggestedScore: Math.min(Math.max(parsed.suggestedScore || 60, 0), 100),
      confidence: Math.min(Math.max(parsed.confidence || 70, 0), 100),
      feedback: parsed.feedback || "Good attempt. Review for improvement.",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ["Shows understanding"],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : ["Add more detail"],
    };
  } catch (parseError) {
    console.error("[bulk-ai-grade] HF parse error:", parseError);
    return {
      suggestedScore: 60,
      confidence: 50,
      feedback: "AI analysis completed. Manual review recommended.",
      strengths: ["Answer provided"],
      improvements: ["Manual review needed"],
    };
  }
}
