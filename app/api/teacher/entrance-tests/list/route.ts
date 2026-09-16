/**
 * API Route: List Entrance Tests for Teacher Review
 * GET /api/teacher/entrance-tests/list?filter=all|pending|reviewed
 * 
 * DEPARTMENT-SPECIFIC FILTERING:
 * - Trainers can only see tests from their assigned department
 * - Admins can see all tests
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

    // Get filter from query
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all';

    // Build where clause
    let whereClause: any = {};

    // STATUS FILTER
    if (filter === 'pending') {
      whereClause.status = { in: ['submitted', 'under_review'] };
    } else if (filter === 'reviewed') {
      whereClause.finalStatus = { not: null };
    }

    // DEPARTMENT FILTER (Trainers only see their department)
    if (userProfile.role === 'trainer') {
      if (!userProfile.department) {
        return NextResponse.json({
          error: 'No department assigned',
          message: 'Your account does not have a department assigned. Please contact an administrator.',
          tests: [],
          total: 0
        }, { status: 403 });
      }

      whereClause.trade = userProfile.department;
      console.log(`[Teacher API] Trainer ${userProfile.name} filtering tests for department: ${userProfile.department}`);
    } else {
      // Admin can see all departments
      console.log(`[Teacher API] Admin ${userProfile.name} viewing all entrance tests`);
    }

    // Fetch entrance tests
    const tests = await prisma.entranceTest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        responses: {
          where: {
            needsGrading: false,
            isCorrect: null // Subjective questions
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { submittedAt: 'desc' }
      ]
    });

    // Format response
    const formattedTests = tests.map(test => ({
      id: test.id,
      student: {
        name: test.user.name || 'Unknown',
        email: test.user.email
      },
      trade: test.trade,
      level: test.level,
      status: test.status,
      percentage: test.percentage || 0,
      totalPoints: test.totalPoints,
      scoredPoints: test.scoredPoints || 0,
      submittedAt: test.submittedAt?.toISOString() || '',
      aiGradedAt: test.aiGradedAt?.toISOString() || null,
      needsReview: test.status === 'under_review' || test.status === 'submitted',
      subjectiveCount: test.responses.length
    }));

    return NextResponse.json({
      tests: formattedTests,
      total: formattedTests.length,
      department: userProfile.department || 'all', // Return department info for UI
      isAdmin: userProfile.role === 'admin'
    });

  } catch (error) {
    console.error('[Teacher API] List tests error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
