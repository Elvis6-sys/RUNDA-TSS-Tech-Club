import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";

// Hugging Face Inference API - 100% FREE!
const HF_API_URL = "https://api-inference.huggingface.co/models/";

// Free models available (no API key needed for public models)
const FREE_MODELS = {
  // Fast and good for grading (7B parameters)
  mistral: "mistralai/Mistral-7B-Instruct-v0.2",

  // Alternative: Llama 3.1 (8B parameters)
  llama: "meta-llama/Llama-3.1-8B-Instruct",

  // Lightweight option (3B parameters - faster but less accurate)
  phi: "microsoft/Phi-3-mini-4k-instruct",
};

// Default model to use
const DEFAULT_MODEL = FREE_MODELS.mistral;

interface GradeRequest {
  question: string;
  questionType: string;
  studentAnswer: string;
  correctAnswer?: string;
  rubric?: string;
  maxScore?: number;
}

interface GradeResponse {
  suggestedScore: number;
  confidence: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  detailedBreakdown: {
    contentAccuracy: number;
    completeness: number;
    clarity: number;
    relevance: number;
  };
}

async function callHuggingFace(prompt: string, model: string = DEFAULT_MODEL): Promise<string> {
  const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || "";

  try {
    const response = await fetch(`${HF_API_URL}${model}`, {
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
      const error = await response.text();
      console.error("[ai-grade-free] Hugging Face API error:", error);

      // If model is loading, wait and retry
      if (response.status === 503) {
        console.log("[ai-grade-free] Model loading, waiting 20s...");
        await new Promise(resolve => setTimeout(resolve, 20000));
        return callHuggingFace(prompt, model); // Retry once
      }

      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    const data = await response.json();

    // Handle different response formats
    if (Array.isArray(data) && data[0]?.generated_text) {
      return data[0].generated_text;
    } else if (data.generated_text) {
      return data.generated_text;
    } else if (typeof data === "string") {
      return data;
    }

    console.error("[ai-grade-free] Unexpected response format:", data);
    throw new Error("Unexpected response format from Hugging Face");

  } catch (error) {
    console.error("[ai-grade-free] Error calling Hugging Face:", error);
    throw error;
  }
}

async function gradeWithFreeAI(request: GradeRequest): Promise<GradeResponse> {
  const { question, studentAnswer, correctAnswer, rubric, maxScore = 100 } = request;

  // Build grading prompt
  const prompt = `You are an expert teacher grading a student's answer. Be fair and constructive.

QUESTION:
${question}

${correctAnswer ? `CORRECT ANSWER/MODEL ANSWER:\n${correctAnswer}\n` : ""}
${rubric ? `GRADING RUBRIC:\n${rubric}\n` : ""}

STUDENT'S ANSWER:
${studentAnswer}

Please grade this answer and provide feedback in the following JSON format:
{
  "score": <number from 0 to ${maxScore}>,
  "confidence": <number from 0 to 100>,
  "feedback": "<overall feedback in 2-3 sentences>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<area to improve 1>", "<area to improve 2>"],
  "contentAccuracy": <number from 0 to 100>,
  "completeness": <number from 0 to 100>,
  "clarity": <number from 0 to 100>,
  "relevance": <number from 0 to 100>
}

Respond with ONLY the JSON object, no other text.`;

  console.log("[ai-grade-free] Sending prompt to Hugging Face...");

  const aiResponse = await callHuggingFace(prompt);

  console.log("[ai-grade-free] Raw AI response:", aiResponse);

  // Parse JSON response
  try {
    // Extract JSON from response (in case there's extra text)
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      suggestedScore: Math.min(Math.max(parsed.score || 50, 0), maxScore),
      confidence: Math.min(Math.max(parsed.confidence || 70, 0), 100),
      feedback: parsed.feedback || "Good attempt. Review the model answer for improvement.",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ["Shows understanding of the topic"],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : ["Could provide more detail"],
      detailedBreakdown: {
        contentAccuracy: Math.min(Math.max(parsed.contentAccuracy || 70, 0), 100),
        completeness: Math.min(Math.max(parsed.completeness || 70, 0), 100),
        clarity: Math.min(Math.max(parsed.clarity || 70, 0), 100),
        relevance: Math.min(Math.max(parsed.relevance || 70, 0), 100),
      },
    };

  } catch (parseError) {
    console.error("[ai-grade-free] Failed to parse AI response:", parseError);
    console.error("[ai-grade-free] Raw response was:", aiResponse);

    // Return reasonable defaults if parsing fails
    return {
      suggestedScore: Math.round(maxScore * 0.6),
      confidence: 50,
      feedback: "Unable to process AI response. Please review manually. Student's answer: " + studentAnswer.substring(0, 100),
      strengths: ["Answer provided"],
      improvements: ["Manual review recommended"],
      detailedBreakdown: {
        contentAccuracy: 60,
        completeness: 60,
        clarity: 60,
        relevance: 60,
      },
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("[ai-grade-free] 📥 Received FREE AI grading request");

    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      console.log("[ai-grade-free] ❌ Unauthorized - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a trainer
    const profile = await prisma.userProfile.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (profile?.role !== "trainer") {
      console.log("[ai-grade-free] ❌ Forbidden - not a trainer");
      return NextResponse.json(
        { error: "Only trainers can use AI grading" },
        { status: 403 }
      );
    }

    const body: GradeRequest = await req.json();
    console.log("[ai-grade-free] 📝 Grading request:", {
      questionType: body.questionType,
      hasCorrectAnswer: !!body.correctAnswer,
      hasRubric: !!body.rubric,
    });

    // Grade with FREE AI
    const result = await gradeWithFreeAI(body);

    console.log("[ai-grade-free] ✅ Grading complete:", {
      score: result.suggestedScore,
      confidence: result.confidence,
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error("[ai-grade-free] ❌ Error:", error);
    return NextResponse.json(
      {
        error: "Failed to grade with AI",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
