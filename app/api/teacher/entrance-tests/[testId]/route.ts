/**
 * API Route: Get Entrance Test Detail for Teacher Review
 * GET /api/teacher/entrance-tests/[testId]
 * 
 * DEPARTMENT-SPECIFIC ACCESS:
 * - Trainers can only view tests from their assigned department
 * - Admins can view all tests
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/local-auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is trainer or admin
    const userProfile = await prisma.userProfile.findUnique({
      where: { id: user.id },
      select: {
        role: true,
        department: true,
        name: true
      }
    });

    if (!userProfile || (userProfile.role !== 'trainer' && userProfile.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden - Teacher access required' }, { status: 403 });
    }

    const testId = params.testId;

    // Fetch test with all responses and grading
    const test = await prisma.entranceTest.findUnique({
      where: { id: testId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        responses: {
          include: {
            subjectiveGrading: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // DEPARTMENT ACCESS CHECK (Trainers only)
    if (userProfile.role === 'trainer') {
      if (test.trade !== userProfile.department) {
        console.log(`[Teacher API] Access denied: Trainer ${userProfile.name} (${userProfile.department}) tried to access test for ${test.trade}`);
        return NextResponse.json({
          error: 'Forbidden',
          message: `You can only review tests for your assigned department (${userProfile.department})`
        }, { status: 403 });
      }
    }

    // Format response
    const formattedTest = {
      id: test.id,
      student: {
        name: test.user.name || 'Unknown',
        email: test.user.email
      },
      trade: test.trade,
      level: test.level,
      status: test.status,
      totalPoints: test.totalPoints,
      objectiveScore: test.objectiveScore,
      subjectiveScore: test.subjectiveScore,
      scoredPoints: test.scoredPoints,
      percentage: test.percentage,
      passingScore: test.passingScore,
      submittedAt: test.submittedAt?.toISOString() || '',
      duration: test.duration || 0,
      responses: test.responses.map(r => ({
        id: r.id,
        questionId: r.questionId,
        questionType: r.questionType,
        questionText: r.questionText,
        studentAnswer: r.studentAnswer,
        correctAnswer: r.correctAnswer,
        isCorrect: r.isCorrect,
        pointsAwarded: r.pointsAwarded,
        maxPoints: r.maxPoints,
        rubric: r.rubric,
        aiScore: r.aiScore,
        feedback: r.feedback,
        subjectiveGrading: r.subjectiveGrading ? {
          id: r.subjectiveGrading.id,
          aiScore: r.subjectiveGrading.aiScore || 0,
          aiFeedback: r.subjectiveGrading.aiFeedback || '',
          aiStrengths: r.subjectiveGrading.aiStrengths || '',
          aiImprovements: r.subjectiveGrading.aiImprovements || '',
          teacherScore: r.subjectiveGrading.teacherScore,
          teacherFeedback: r.subjectiveGrading.teacherFeedback
        } : null
      }))
    };

    return NextResponse.json({ test: formattedTest });

  } catch (error) {
    console.error('[Teacher API] Get test detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
