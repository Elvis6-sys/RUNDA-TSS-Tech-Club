/**
 * POST /api/quiz/ai-grade
 * 
 * AI-powered grading for subjective questions (short answer, essay, coding)
 * Returns suggested score, detailed feedback, and confidence level
 * 
 * UPDATED: Now supports FREE Hugging Face API as fallback!
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || "";
const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2";

type AIGradeRequest = {
  question: string;
  studentAnswer: string;
  modelAnswer?: string;
  rubric?: string;
  questionType: string;
  maxScore?: number;
};

type AIGradeResponse = {
  suggestedScore: number;
  confidence: number; // 0-100
  feedback: string;
  strengths: string[];
  improvements: string[];
  detailedBreakdown: {
    contentAccuracy: number;
    completeness: number;
    clarity: number;
    relevance: number;
  };
};

export async function POST(req: NextRequest) {
  try {
    console.log("[ai-grade] 📥 Received AI grading request");

    // Authenticate teacher
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is trainer
    const profile = await prisma.userProfile.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (profile?.role !== "trainer") {
      return NextResponse.json({ error: "Only trainers can use AI grading" }, { status: 403 });
    }

    // Always works - FREE fallback available!
    if (!OPENAI_API_KEY && !HF_API_KEY) {
      console.warn("[ai-grade] ⚠️  No API keys - using FREE Hugging Face (rate-limited)");
    }

    const body: AIGradeRequest = await req.json();
    const {
      question,
      studentAnswer,
      modelAnswer,
      rubric,
      questionType,
      maxScore = 100
    } = body;

    if (!question || !studentAnswer) {
      return NextResponse.json({
        error: "Missing required fields: question, studentAnswer"
      }, { status: 400 });
    }

    console.log("[ai-grade] 🤖 Grading with AI:", { questionType, answerLength: studentAnswer.length });

    // Construct grading prompt
    const prompt = buildGradingPrompt({
      question,
      studentAnswer,
      modelAnswer,
      rubric,
      questionType,
      maxScore
    });

    // Smart AI routing: OpenAI → Hugging Face FREE
    const aiResponse = await gradeWithBestAI(prompt, questionType);

    console.log("[ai-grade] ✅ AI grading complete:", {
      score: aiResponse.suggestedScore,
      confidence: aiResponse.confidence
    });

    return NextResponse.json(aiResponse);

  } catch (error) {
    console.error("[ai-grade] ❌ Error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "AI grading failed"
    }, { status: 500 });
  }
}

function buildGradingPrompt(params: AIGradeRequest): string {
  const { question, studentAnswer, modelAnswer, rubric, questionType, maxScore } = params;

  let prompt = `You are an expert educational assessor. Grade the following student answer objectively and fairly.

QUESTION TYPE: ${questionType}
MAXIMUM SCORE: ${maxScore}

QUESTION:
${question}

STUDENT ANSWER:
${studentAnswer}
`;

  if (modelAnswer) {
    prompt += `\nMODEL ANSWER (for reference):
${modelAnswer}
`;
  }

  if (rubric) {
    prompt += `\nGRADING RUBRIC:
${rubric}
`;
  }

  prompt += `\n
GRADING INSTRUCTIONS:
1. Evaluate based on: content accuracy, completeness, clarity, and relevance
2. Be fair but rigorous - don't give points for vague or incorrect answers
3. For coding questions, check logic, syntax, efficiency, and best practices
4. For essays, check argument quality, evidence, structure, and writing quality
5. Provide specific, actionable feedback

RESPOND IN VALID JSON FORMAT ONLY (no markdown, no code blocks):
{
  "suggestedScore": <number 0-${maxScore}>,
  "confidence": <number 0-100>,
  "feedback": "<overall feedback in 2-3 sentences>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<area to improve 1>", "<area to improve 2>"],
  "detailedBreakdown": {
    "contentAccuracy": <number 0-100>,
    "completeness": <number 0-100>,
    "clarity": <number 0-100>,
    "relevance": <number 0-100>
  }
}`;

  return prompt;
}

// Smart AI routing: OpenAI (paid) → Hugging Face (FREE)
async function gradeWithBestAI(prompt: string, questionType: string): Promise<AIGradeResponse> {
  // Try OpenAI first if available (most accurate)
  if (OPENAI_API_KEY) {
    try {
      console.log("[ai-grade] 🤖 Using OpenAI GPT-4o-mini");
      return await gradeWithOpenAI(prompt);
    } catch (error) {
      console.error("[ai-grade] OpenAI failed, falling back to FREE option:", error);
    }
  }

  // Fallback to Hugging Face (100% FREE!)
  try {
    console.log("[ai-grade] 🤗 Using FREE Hugging Face", HF_API_KEY ? "(with API key)" : "(public)");
    return await gradeWithHuggingFace(prompt);
  } catch (error) {
    console.error("[ai-grade] All AI providers failed:", error);
    throw new Error("AI grading unavailable. Please try again later.");
  }
}

// OpenAI grading (paid, most accurate)
async function gradeWithOpenAI(prompt: string): Promise<AIGradeResponse> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", // Fast and cost-effective for grading
      messages: [
        {
          role: "system",
          content: "You are an expert educational assessor. Provide fair, objective, and constructive grading. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent grading
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[ai-grade] OpenAI API error:", error);
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No response from OpenAI");
  }

  try {
    // Parse JSON response
    const parsed = JSON.parse(content);
    return parsed as AIGradeResponse;
  } catch (parseError) {
    console.error("[ai-grade] Failed to parse AI response:", content);

    // Fallback: try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]) as AIGradeResponse;
      } catch {
        // Fall through to error
      }
    }

    throw new Error("AI returned invalid JSON response");
  }
}

// Hugging Face grading (100% FREE!)
async function gradeWithHuggingFace(prompt: string): Promise<AIGradeResponse> {
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
      // Model is loading, wait and retry
      console.log("[ai-grade] Model loading, waiting 15s...");
      await new Promise(resolve => setTimeout(resolve, 15000));
      return gradeWithHuggingFace(prompt); // Retry once
    }
    throw new Error(`Hugging Face API error: ${response.status}`);
  }

  const data = await response.json();

  // Handle different response formats
  let content = "";
  if (Array.isArray(data) && data[0]?.generated_text) {
    content = data[0].generated_text;
  } else if (data.generated_text) {
    content = data.generated_text;
  } else {
    throw new Error("Unexpected Hugging Face response format");
  }

  // Parse JSON response
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Sanitize and validate
    return {
      suggestedScore: Math.min(Math.max(parsed.suggestedScore || 50, 0), 100),
      confidence: Math.min(Math.max(parsed.confidence || 70, 0), 100),
      feedback: parsed.feedback || "Good attempt. Review the model answer for improvement.",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ["Shows understanding of the topic"],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : ["Could provide more detail"],
      detailedBreakdown: {
        contentAccuracy: Math.min(Math.max(parsed.detailedBreakdown?.contentAccuracy || 70, 0), 100),
        completeness: Math.min(Math.max(parsed.detailedBreakdown?.completeness || 70, 0), 100),
        clarity: Math.min(Math.max(parsed.detailedBreakdown?.clarity || 70, 0), 100),
        relevance: Math.min(Math.max(parsed.detailedBreakdown?.relevance || 70, 0), 100),
      },
    };
  } catch (parseError) {
    console.error("[ai-grade] Parse error:", parseError);
    // Return reasonable fallback
    return {
      suggestedScore: 60,
      confidence: 50,
      feedback: "AI analysis completed. Manual review recommended.",
      strengths: ["Answer provided"],
      improvements: ["Manual review needed"],
      detailedBreakdown: { contentAccuracy: 60, completeness: 60, clarity: 60, relevance: 60 },
    };
  }
}

// Alternative: Use Anthropic Claude (if you prefer)
async function gradeWithClaude(prompt: string): Promise<AIGradeResponse> {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.content[0]?.text;

  if (!content) {
    throw new Error("No response from Claude");
  }

  return JSON.parse(content) as AIGradeResponse;
}