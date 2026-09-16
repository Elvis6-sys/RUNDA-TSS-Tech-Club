/**
 * API Route: Get Detailed Test Results
 * GET /api/entrance-test/results
 * Returns question-by-question feedback for student
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/local-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's entrance test
    const entranceTest = await prisma.entranceTest.findUnique({
      where: { userId: user.id },
      include: {
        responses: {
          include: {
            subjectiveGrading: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!entranceTest) {
      return NextResponse.json({
        error: 'No entrance test found'
      }, { status: 404 });
    }

    // Check if marks have been released
    if (!entranceTest.marksReleasedAt) {
      return NextResponse.json({
        error: 'Results not yet available. Your test is still under review.'
      }, { status: 403 });
    }

    // Format responses
    const formattedResponses = entranceTest.responses.map(r => ({
      id: r.id,
      questionId: r.questionId,
      questionType: r.questionType,
      questionText: r.questionText,
      studentAnswer: r.studentAnswer,
      correctAnswer: r.correctAnswer,
      isCorrect: r.isCorrect,
      pointsAwarded: r.pointsAwarded,
      maxPoints: r.maxPoints,
      feedback: r.feedback,
      subjectiveGrading: r.subjectiveGrading ? {
        aiFeedback: r.subjectiveGrading.aiFeedback || '',
        aiStrengths: r.subjectiveGrading.aiStrengths || '',
        aiImprovements: r.subjectiveGrading.aiImprovements || '',
        teacherFeedback: r.subjectiveGrading.teacherFeedback
      } : null
    }));

    return NextResponse.json({
      test: {
        id: entranceTest.id,
        trade: entranceTest.trade,
        level: entranceTest.level,
        status: entranceTest.finalStatus || entranceTest.status, // Use finalStatus for released results
        totalPoints: entranceTest.totalPoints,
        scoredPoints: entranceTest.scoredPoints,
        percentage: entranceTest.percentage,
        passingScore: entranceTest.passingScore,
        passed: entranceTest.percentage >= entranceTest.passingScore,
        submittedAt: entranceTest.submittedAt?.toISOString() || null,
        reviewedAt: entranceTest.teacherReviewedAt?.toISOString() || null,
        reviewNotes: entranceTest.reviewNotes,
        objectiveScore: entranceTest.objectiveScore || 0,
        objectivePoints: entranceTest.objectivePoints || 0,
        subjectiveScore: entranceTest.subjectiveScore || 0,
        subjectivePoints: entranceTest.subjectivePoints || 0,
        responses: formattedResponses
      }
    });

  } catch (error) {
    console.error('[Entrance Test] Results error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
