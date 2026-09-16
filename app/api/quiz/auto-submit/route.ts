import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/quiz/auto-submit
 * Auto-submit an exam when student exits without proper submission
 * This endpoint is called by the Tauri app when student tries to exit
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { submission_id, reason, student_name, node_title, timestamp } = body;

    console.log('🚨 AUTO-SUBMIT REQUEST:', {
      submission_id,
      reason,
      student_name,
      node_title,
      timestamp,
    });

    if (!submission_id) {
      return NextResponse.json(
        { error: 'Missing submission_id' },
        { status: 400 }
      );
    }

    // 1. Get the submission to check current status
    const submission = await prisma.quizBlockSubmission.findUnique({
      where: { id: submission_id }
    });

    if (!submission) {
      console.error('Error fetching submission: not found');
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // 2. If already submitted, don't auto-submit again
    if (submission.status === 'submitted' || submission.status === 'auto_submitted') {
      console.log('⚠️ Submission already submitted, skipping auto-submit');
      return NextResponse.json({
        success: true,
        message: 'Submission already submitted',
        already_submitted: true,
      });
    }

    // 3. Mark as auto-submitted
    const updated = await prisma.quizBlockSubmission.update({
      where: { id: submission_id },
      data: {
        status: 'auto_submitted',
        autoSubmitted: true,
      }
    });

    console.log('✅ AUTO-SUBMIT SUCCESS:', {
      submission_id: updated.id,
      reason,
      timestamp: updated.updatedAt,
    });

    return NextResponse.json({
      success: true,
      submission: updated,
      auto_submit_reason: reason,
    });
  } catch (error) {
    console.error('Error in auto-submit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/quiz/auto-submit
 * Check if auto-submit is available (health check)
 */
export async function GET() {
  return NextResponse.json({
    service: 'Auto-submit API',
    status: 'operational',
    version: '1.0.0',
  });
}
