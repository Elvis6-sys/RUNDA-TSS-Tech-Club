/**
 * API Route: Submit Teacher Review
 * POST /api/teacher/entrance-tests/[testId]/review
 * Updates scores, adds feedback, and approves/rejects the test
 * 
 * DEPARTMENT-SPECIFIC ACCESS:
 * - Trainers can only review tests from their assigned department
 * - Admins can review all tests
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/local-auth';
import { prisma } from '@/lib/prisma';

export async function POST(
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
    const body = await req.json();
    const { decision, reviewNotes, scoreModifications, feedbackModifications } = body;

    // Validate decision
    if (!decision || !['approved', 'rejected'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
    }

    // Get test
    const test = await prisma.entranceTest.findUnique({
      where: { id: testId },
      include: {
        responses: {
          include: {
            subjectiveGrading: true
          }
        }
      }
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // DEPARTMENT ACCESS CHECK (Trainers only)
    if (userProfile.role === 'trainer') {
      if (test.trade !== userProfile.department) {
        console.log(`[Teacher Review] Access denied: Trainer ${userProfile.name} (${userProfile.department}) tried to review test for ${test.trade}`);
        return NextResponse.json({
          error: 'Forbidden',
          message: `You can only review tests for your assigned department (${userProfile.department})`
        }, { status: 403 });
      }
    }

    // Apply score modifications
    let adjustedTotalScore = test.scoredPoints;

    for (const [responseId, newScore] of Object.entries(scoreModifications || {})) {
      const response = test.responses.find(r => r.id === responseId);
      if (!response) continue;

      const scoreDiff = (newScore as number) - response.pointsAwarded;
      adjustedTotalScore += scoreDiff;

      // Update response
      await prisma.testResponse.update({
        where: { id: responseId },
        data: {
          pointsAwarded: newScore as number
        }
      });

      // Update subjective grading if exists
      if (response.subjectiveGrading) {
        await prisma.subjectiveGrading.update({
          where: { id: response.subjectiveGrading.id },
          data: {
            teacherScore: newScore as number,
            reviewStatus: 'reviewed',
            reviewedBy: user.id,
            reviewedAt: new Date()
          }
        });
      }
    }

    // Apply feedback modifications
    for (const [responseId, feedback] of Object.entries(feedbackModifications || {})) {
      const response = test.responses.find(r => r.id === responseId);
      if (!response || !response.subjectiveGrading) continue;

      await prisma.subjectiveGrading.update({
        where: { id: response.subjectiveGrading.id },
        data: {
          teacherFeedback: feedback as string
        }
      });
    }

    // Calculate final percentage
    const finalPercentage = (adjustedTotalScore / test.totalPoints) * 100;

    // Update entrance test with final review
    await prisma.entranceTest.update({
      where: { id: testId },
      data: {
        status: decision === 'approved' ? 'approved' : 'rejected',
        finalStatus: decision,
        scoredPoints: adjustedTotalScore,
        percentage: finalPercentage,
        reviewedBy: user.id,
        reviewNotes: reviewNotes || null,
        teacherReviewedAt: new Date(),
        marksReleasedAt: new Date(),
        marksReleasedBy: user.id
      }
    });

    // Update user role if approved
    if (decision === 'approved') {
      await prisma.userProfile.update({
        where: { id: test.userId },
        data: {
          role: test.level, // l3, l4, or l5
          status: 'approved'
        }
      });

      console.log(`[Teacher Review] ${userProfile.role === 'admin' ? 'Admin' : 'Trainer'} ${userProfile.name} approved student ${test.userId} with role ${test.level}`);
    } else {
      await prisma.userProfile.update({
        where: { id: test.userId },
        data: {
          status: 'rejected'
        }
      });

      console.log(`[Teacher Review] ${userProfile.role === 'admin' ? 'Admin' : 'Trainer'} ${userProfile.name} rejected student ${test.userId}`);
    }

    return NextResponse.json({
      success: true,
      message: `Test ${decision}. Marks released to student.`,
      finalScore: adjustedTotalScore,
      finalPercentage: finalPercentage.toFixed(1),
      decision
    });

  } catch (error) {
    console.error('[Teacher API] Review submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
