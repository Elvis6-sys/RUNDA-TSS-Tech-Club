/**
 * API Route: Trigger AI Grading
 * POST /api/entrance-test/grade-ai
 * Grades all subjective questions using AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/local-auth';
import { prisma } from '@/lib/prisma';
import { gradeTestSubjectiveQuestions } from '@/lib/ai-grader';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { testId } = body;

    if (!testId) {
      return NextResponse.json({ error: 'Test ID required' }, { status: 400 });
    }

    // Verify test exists and belongs to user (or user is admin/teacher)
    const entranceTest = await prisma.entranceTest.findUnique({
      where: { id: testId },
      include: { user: true }
    });

    if (!entranceTest) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Check permission (user owns test OR user is teacher/admin)
    const userProfile = await prisma.userProfile.findUnique({
      where: { id: user.id }
    });

    const isOwner = entranceTest.userId === user.id;
    const isTeacher = userProfile?.role === 'trainer' || userProfile?.role === 'admin';

    if (!isOwner && !isTeacher) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if already graded
    if (entranceTest.status !== 'submitted') {
      return NextResponse.json({
        error: 'Test must be in submitted status',
        currentStatus: entranceTest.status
      }, { status: 400 });
    }

    // Run AI grading
    console.log(`[API] Starting AI grading for test ${testId}...`);
    const result = await gradeTestSubjectiveQuestions(testId);

    return NextResponse.json({
      success: true,
      message: 'AI grading completed',
      gradedCount: result.gradedCount,
      totalSubjectiveScore: result.totalSubjectiveScore,
      results: result.results
    });

  } catch (error) {
    console.error('[AI Grading API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
