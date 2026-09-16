/**
 * API Route: Submit Entrance Test
 * POST /api/entrance-test/submit
 * Auto-grades objective questions, stores subjective for AI grading
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/local-auth';
import { prisma } from '@/lib/prisma';
import { getEntranceTestTemplate } from '@/lib/entrance-test-templates';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { testId, answers, duration, autoSubmitted } = body;

    // Validate
    if (!testId || !answers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get entrance test
    const entranceTest = await prisma.entranceTest.findUnique({
      where: { id: testId, userId: user.id }
    });

    if (!entranceTest) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    if (entranceTest.status !== 'pending') {
      return NextResponse.json({ error: 'Test already submitted' }, { status: 400 });
    }

    // Get template - Try static template first, then database
    let template = getEntranceTestTemplate(entranceTest.trade, entranceTest.level);

    // If no static template, try to get from database (dynamically generated)
    if (!template && entranceTest.templateData) {
      try {
        template = JSON.parse(entranceTest.templateData);
        console.log(`[Entrance Test] Loaded template from database (${template?.questions?.length || 0} questions)`);
      } catch (error) {
        console.error('[Entrance Test] Failed to parse templateData:', error);
      }
    }

    if (!template) {
      return NextResponse.json({ error: 'Test template not found' }, { status: 404 });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AUTO-GRADE OBJECTIVE QUESTIONS
    // ═══════════════════════════════════════════════════════════════════════════
    const objectiveTypes = ['mcq', 'truefalse', 'fillin', 'multiselect'];
    let objectiveScore = 0;
    let objectiveTotal = 0;
    const gradedResponses: any[] = [];
    const subjectiveResponses: any[] = [];

    for (let i = 0; i < template.questions.length; i++) {
      const question = template.questions[i];
      const studentAnswer = answers[i];

      if (objectiveTypes.includes(question.type)) {
        objectiveTotal += question.points;

        let isCorrect = false;
        let earnedPoints = 0;

        // Grade based on type
        if (question.type === 'mcq' || question.type === 'truefalse' || question.type === 'fillin') {
          const correctAnswer = typeof question.correctAnswer === 'string' ? question.correctAnswer : '';
          const answer = typeof studentAnswer === 'string' ? studentAnswer : '';
          isCorrect = answer?.toLowerCase()?.trim() === correctAnswer?.toLowerCase()?.trim();
          earnedPoints = isCorrect ? question.points : 0;
        } else if (question.type === 'multiselect') {
          const correctAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
          const answers = Array.isArray(studentAnswer) ? studentAnswer : [];
          const correctSet = new Set(correctAnswers.map(a => a.toLowerCase()));
          const answerSet = new Set(answers.map((a: string) => a.toLowerCase()));
          isCorrect = correctSet.size === answerSet.size &&
            [...correctSet].every(a => answerSet.has(a));
          earnedPoints = isCorrect ? question.points : 0;
        }

        objectiveScore += earnedPoints;

        gradedResponses.push({
          questionId: question.id,
          questionType: question.type,
          questionText: question.question,
          studentAnswer: JSON.stringify(studentAnswer),
          correctAnswer: JSON.stringify(question.correctAnswer),
          isCorrect,
          pointsAwarded: earnedPoints,
          maxPoints: question.points
        });
      } else {
        // Subjective - store for AI grading
        subjectiveResponses.push({
          questionId: question.id,
          questionType: question.type,
          questionText: question.question,
          studentAnswer: JSON.stringify(studentAnswer),
          rubric: question.rubric || '',
          maxPoints: question.points,
          pointsAwarded: 0, // Will be updated by AI
          isCorrect: null,
          needsGrading: true
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SAVE ALL RESPONSES
    // ═══════════════════════════════════════════════════════════════════════════
    const allResponses = [...gradedResponses, ...subjectiveResponses];

    await prisma.testResponse.createMany({
      data: allResponses.map(r => ({
        entranceTestId: testId,
        ...r
      }))
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // UPDATE ENTRANCE TEST STATUS
    // ═══════════════════════════════════════════════════════════════════════════
    const totalPoints = template.questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = (objectiveScore / totalPoints) * 100;

    await prisma.entranceTest.update({
      where: { id: testId },
      data: {
        status: subjectiveResponses.length > 0 ? 'submitted' : 'under_review',
        submittedAt: new Date(),
        duration,
        autoSubmitted,
        objectiveScore,
        scoredPoints: objectiveScore, // Partial, will be updated after AI grading
        percentage: percentage,
        answeredQuestions: Object.keys(answers).length,
        // Totals
        totalQuestions: template.questions.length,
        totalPoints,
        objectivePoints: objectiveTotal,
        subjectivePoints: totalPoints - objectiveTotal
      }
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // TRIGGER AI GRADING FOR SUBJECTIVE QUESTIONS
    // ═══════════════════════════════════════════════════════════════════════════
    if (subjectiveResponses.length > 0) {
      console.log(`[Entrance Test] Queued ${subjectiveResponses.length} subjective questions for AI grading`);

      // Import AI grading service
      const { queueAIGrading } = await import('@/lib/ai-grader');
      await queueAIGrading(testId);
    }

    return NextResponse.json({
      success: true,
      message: 'Test submitted successfully',
      objectiveScore,
      totalPoints,
      percentage: percentage.toFixed(1),
      subjectiveCount: subjectiveResponses.length,
      status: subjectiveResponses.length > 0 ? 'submitted' : 'under_review'
    });

  } catch (error) {
    console.error('[Entrance Test] Submit error:', error);
    console.error('[Entrance Test] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('[Entrance Test] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
