/**
 * AI Grading Service
 * Uses AI to grade subjective questions (short, essay, code, etc.)
 * Provides rubric-based scoring for teacher review
 */

import { prisma } from '@/lib/prisma';

export type GradingResult = {
  score: number;
  maxScore: number;
  percentage: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  rubricBreakdown?: Record<string, number>;
};

/**
 * Grade a subjective answer using AI
 */
export async function gradeSubjectiveAnswer(
  questionText: string,
  questionType: string,
  studentAnswer: string,
  rubric: string,
  maxPoints: number,
  context?: string
): Promise<GradingResult> {
  try {
    // Build grading prompt
    const prompt = buildGradingPrompt(
      questionText,
      questionType,
      studentAnswer,
      rubric,
      maxPoints,
      context
    );

    // Call AI model (using existing AI service)
    const aiResponse = await callAIModel(prompt);

    // Parse AI response
    const result = parseGradingResponse(aiResponse, maxPoints);

    return result;
  } catch (error) {
    console.error('[AI Grader] Error:', error);

    // Fallback: return neutral score
    return {
      score: maxPoints * 0.5,
      maxScore: maxPoints,
      percentage: 50,
      feedback: 'Auto-grading failed. Manual review required.',
      strengths: [],
      improvements: ['AI grading encountered an error. Please review manually.']
    };
  }
}

/**
 * Build comprehensive grading prompt
 */
function buildGradingPrompt(
  questionText: string,
  questionType: string,
  studentAnswer: string,
  rubric: string,
  maxPoints: number,
  context?: string
): string {
  return `You are an expert educator grading a ${questionType} question. Grade the following student response fairly and constructively.

QUESTION:
${questionText}

GRADING RUBRIC:
${rubric}

MAXIMUM POINTS: ${maxPoints}

STUDENT ANSWER:
${studentAnswer || '(No answer provided)'}

${context ? `\nADDITIONAL CONTEXT:\n${context}` : ''}

GRADING INSTRUCTIONS:
1. Evaluate the answer against the rubric criteria
2. Award points based on:
   - Correctness and accuracy of content
   - Completeness (addresses all parts of the question)
   - Clarity and organization
   - Technical accuracy (for code/technical questions)
   - Depth of understanding
3. Be fair but thorough
4. Consider partial credit where appropriate
5. Provide constructive feedback

RESPOND IN STRICT JSON FORMAT:
{
  "score": <number between 0 and ${maxPoints}>,
  "percentage": <score as percentage>,
  "feedback": "<2-3 sentence overall feedback>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "improvements": ["<area for improvement 1>", "<area for improvement 2>", ...],
  "rubricBreakdown": {
    "<criteria 1>": <points awarded>,
    "<criteria 2>": <points awarded>
  }
}

IMPORTANT: Return ONLY valid JSON, no other text.`;
}

/**
 * Call AI model for grading
 */
async function callAIModel(prompt: string): Promise<string> {
  try {
    // Try to get AI endpoint from environment or use default
    const aiEndpoint = process.env.AI_API_ENDPOINT || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const apiUrl = `${aiEndpoint}/api/chat`;

    console.log(`[AI Grader] Calling AI API at: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are an expert educator and grading assistant. You provide fair, constructive, and accurate assessments of student work. Always respond in valid JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: false
      })
    });

    if (!response.ok) {
      console.error(`[AI Grader] API returned status ${response.status}`);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const message = data.message || data.response || data.content || '';

    if (!message) {
      console.error('[AI Grader] Empty response from AI');
      throw new Error('Empty AI response');
    }

    console.log('[AI Grader] AI response received successfully');
    return message;
  } catch (error) {
    console.error('[AI Grader] API call failed:', error);
    throw error;
  }
}

/**
 * Parse AI response into structured result
 */
function parseGradingResponse(aiResponse: string, maxPoints: number): GradingResult {
  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = aiResponse.trim();

    // Remove markdown code block if present
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(jsonStr);

    // Validate and sanitize
    const score = Math.max(0, Math.min(maxPoints, parsed.score || 0));
    const percentage = (score / maxPoints) * 100;

    return {
      score,
      maxScore: maxPoints,
      percentage,
      feedback: parsed.feedback || 'No feedback provided',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      rubricBreakdown: parsed.rubricBreakdown || {}
    };
  } catch (error) {
    console.error('[AI Grader] Failed to parse response:', error);
    console.error('Response was:', aiResponse);

    // Fallback parsing: look for score in text
    const scoreMatch = aiResponse.match(/score["\s:]+(\d+\.?\d*)/i);
    const score = scoreMatch ? parseFloat(scoreMatch[1]) : maxPoints * 0.5;

    return {
      score: Math.min(score, maxPoints),
      maxScore: maxPoints,
      percentage: (score / maxPoints) * 100,
      feedback: 'Auto-grading completed. Review recommended.',
      strengths: [],
      improvements: ['Manual review recommended']
    };
  }
}

/**
 * Grade all pending subjective responses for a test
 */
export async function gradeTestSubjectiveQuestions(testId: string): Promise<{
  gradedCount: number;
  totalSubjectiveScore: number;
  results: any[];
}> {
  console.log(`[AI Grader] Starting grading for test ${testId}...`);

  // Get all subjective responses needing grading
  const responses = await prisma.testResponse.findMany({
    where: {
      entranceTestId: testId,
      needsGrading: true
    },
    orderBy: { id: 'asc' }
  });

  if (responses.length === 0) {
    console.log(`[AI Grader] No subjective questions to grade`);
    return { gradedCount: 0, totalSubjectiveScore: 0, results: [] };
  }

  console.log(`[AI Grader] Found ${responses.length} subjective questions to grade`);

  const results: any[] = [];
  let totalSubjectiveScore = 0;

  // Grade each response
  for (const response of responses) {
    console.log(`[AI Grader] Grading question ${response.questionId}...`);

    try {
      const studentAnswer = JSON.parse(response.studentAnswer || '""');

      const gradingResult = await gradeSubjectiveAnswer(
        response.questionText,
        response.questionType,
        studentAnswer,
        response.rubric || '',
        response.maxPoints
      );

      // Update response with AI grading
      await prisma.testResponse.update({
        where: { id: response.id },
        data: {
          pointsAwarded: gradingResult.score,
          aiScore: gradingResult.score,
          feedback: gradingResult.feedback,
          needsGrading: false,
          gradedAt: new Date()
        }
      });

      // Create SubjectiveGrading record for teacher review
      await prisma.subjectiveGrading.create({
        data: {
          responseId: response.id,
          aiScore: gradingResult.score,
          aiFeedback: gradingResult.feedback,
          aiStrengths: gradingResult.strengths.join('\n'),
          aiImprovements: gradingResult.improvements.join('\n'),
          rubricBreakdown: JSON.stringify(gradingResult.rubricBreakdown),
          reviewStatus: 'pending'
        }
      });

      totalSubjectiveScore += gradingResult.score;
      results.push({
        questionId: response.questionId,
        score: gradingResult.score,
        maxPoints: response.maxPoints,
        percentage: gradingResult.percentage
      });

      console.log(`[AI Grader] Question ${response.questionId}: ${gradingResult.score}/${response.maxPoints} (${gradingResult.percentage.toFixed(1)}%)`);

    } catch (error) {
      console.error(`[AI Grader] Failed to grade question ${response.questionId}:`, error);

      // Give partial credit on error
      const partialScore = response.maxPoints * 0.5;
      await prisma.testResponse.update({
        where: { id: response.id },
        data: {
          pointsAwarded: partialScore,
          aiScore: partialScore,
          feedback: 'Auto-grading failed. Manual review required.',
          needsGrading: false,
          gradedAt: new Date()
        }
      });

      await prisma.subjectiveGrading.create({
        data: {
          responseId: response.id,
          aiScore: partialScore,
          aiFeedback: 'Auto-grading encountered an error',
          reviewStatus: 'pending'
        }
      });

      totalSubjectiveScore += partialScore;
    }
  }

  // Update entrance test with total score
  const entranceTest = await prisma.entranceTest.findUnique({
    where: { id: testId }
  });

  if (entranceTest) {
    const totalScore = (entranceTest.objectiveScore || 0) + totalSubjectiveScore;
    const percentage = (totalScore / entranceTest.totalPoints) * 100;

    await prisma.entranceTest.update({
      where: { id: testId },
      data: {
        subjectiveScore: totalSubjectiveScore,
        scoredPoints: totalScore,
        percentage,
        status: 'under_review', // Now ready for teacher review
        aiGradedAt: new Date()
      }
    });

    console.log(`[AI Grader] Test ${testId} complete:`);
    console.log(`  - Objective: ${entranceTest.objectiveScore}/${entranceTest.objectivePoints}`);
    console.log(`  - Subjective: ${totalSubjectiveScore}/${entranceTest.subjectivePoints}`);
    console.log(`  - Total: ${totalScore}/${entranceTest.totalPoints} (${percentage.toFixed(1)}%)`);
  }

  return {
    gradedCount: responses.length,
    totalSubjectiveScore,
    results
  };
}

/**
 * Queue AI grading job (called after test submission)
 */
export async function queueAIGrading(testId: string): Promise<void> {
  console.log(`[AI Grader] Queueing grading for test ${testId}`);

  // In production, this would queue a background job
  // For now, run immediately (non-blocking in real implementation)

  // Use setTimeout to simulate async job queue
  setTimeout(async () => {
    try {
      await gradeTestSubjectiveQuestions(testId);
    } catch (error) {
      console.error(`[AI Grader] Queue job failed for test ${testId}:`, error);
    }
  }, 1000);
}
