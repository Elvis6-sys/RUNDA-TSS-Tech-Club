/**
 * API Route: Get User's Entrance Test
 * GET /api/entrance-test/get
 * Returns the test with questions if available
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/local-auth';
import { prisma } from '@/lib/prisma';
import { getEntranceTestTemplate, calculateTotalPoints, calculatePointsBreakdown } from '@/lib/entrance-test-templates';
import { generateEntranceTestFromCurriculum, getRelevantModulesForTest } from '@/lib/curriculum-based-test-generator';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's entrance test record
    const entranceTest = await prisma.entranceTest.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            department: true,
            level: true
          }
        }
      }
    });

    if (!entranceTest) {
      return NextResponse.json({
        error: 'No entrance test found',
        hasTest: false
      }, { status: 404 });
    }

    // If already completed, return status only
    if (entranceTest.status !== 'pending') {
      return NextResponse.json({
        hasTest: true,
        status: entranceTest.status,
        percentage: entranceTest.percentage,
        scoredPoints: entranceTest.scoredPoints,
        totalPoints: entranceTest.totalPoints,
        objectiveScore: entranceTest.objectiveScore,
        subjectiveScore: entranceTest.subjectiveScore,
        objectivePoints: entranceTest.objectivePoints,
        subjectivePoints: entranceTest.subjectivePoints,
        passingScore: entranceTest.passingScore,
        finalStatus: entranceTest.finalStatus,
        marksReleasedAt: entranceTest.marksReleasedAt,
        reviewNotes: entranceTest.reviewNotes,
        submittedAt: entranceTest.submittedAt,
        teacherReviewedAt: entranceTest.teacherReviewedAt
      });
    }

    // Get test template - TRY CURRICULUM-BASED FIRST
    let template = getEntranceTestTemplate(entranceTest.trade, entranceTest.level);

    // If no template exists, generate from curriculum
    if (!template) {
      console.log(`[Entrance Test] No template found, generating from curriculum for ${entranceTest.trade} ${entranceTest.level}`);

      // Determine which curriculum modules to use based on trade and level
      const modules = await getRelevantModulesForTest(entranceTest.trade, entranceTest.level);
      const moduleCodes = modules.map(m => m.code);

      if (moduleCodes.length > 0) {
        try {
          // Generate questions from curriculum
          const generatedQuestions = await generateEntranceTestFromCurriculum(
            moduleCodes,
            entranceTest.level,
            20 // 20 questions total
          );

          // Convert to template format
          template = {
            trade: entranceTest.trade,
            level: entranceTest.level,
            duration: 90, // 90 minutes
            passingScore: entranceTest.passingScore,
            questions: generatedQuestions.map(q => ({
              id: q.id,
              type: q.type,
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
              points: q.points,
              rubric: q.rubric
            }))
          };

          // SAVE GENERATED TEMPLATE TO DATABASE
          await prisma.entranceTest.update({
            where: { id: entranceTest.id },
            data: {
              templateData: JSON.stringify(template)
            }
          });

          console.log(`[Entrance Test] Generated ${generatedQuestions.length} questions from ${modules.length} curriculum modules: ${moduleCodes.join(', ')}`);
        } catch (error) {
          console.error('[Entrance Test] Curriculum generation failed:', error);
        }
      } else {
        console.error(`[Entrance Test] No CORE modules found for ${entranceTest.trade} ${entranceTest.level}`);
      }
    }

    if (!template) {
      return NextResponse.json({
        error: `No test template found for ${entranceTest.trade} - ${entranceTest.level}`,
        hasTest: false
      }, { status: 404 });
    }

    // Calculate points
    const totalPoints = calculateTotalPoints(template);
    const { objectivePoints, subjectivePoints } = calculatePointsBreakdown(template);

    // Update entrance test with totals if not already set
    if (entranceTest.totalPoints === 0) {
      await prisma.entranceTest.update({
        where: { id: entranceTest.id },
        data: {
          totalQuestions: template.questions.length,
          totalPoints,
          objectivePoints,
          subjectivePoints
        }
      });
    }

    // Return test with questions
    return NextResponse.json({
      hasTest: true,
      status: 'pending',
      test: {
        id: entranceTest.id,
        trade: entranceTest.trade,
        level: entranceTest.level,
        duration: template.duration,
        passingScore: entranceTest.passingScore,
        totalQuestions: template.questions.length,
        totalPoints,
        objectivePoints,
        subjectivePoints,
        questions: template.questions.map((q, index) => ({
          ...q,
          index,
          // Don't send correct answers to client for objective questions
          correctAnswer: undefined
        }))
      }
    });

  } catch (error) {
    console.error('[Entrance Test] Get error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
