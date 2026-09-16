import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/quiz/integrity-report
 * Receives an integrity report (audit log) from Electron's main process and stores
 * it in QuizBlockSubmission.cheatLog (Json field).
 * Also increments the cheatAttempts count based on high-severity events.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { submissionId, report } = body;

    if (!submissionId || !report) {
      return NextResponse.json(
        { error: 'Missing submissionId or report' },
        { status: 400 }
      );
    }

    // Count "cheat attempts" — high-severity events that were actually caught
    const highSeverityTypes = [
      'PROCESS_DETECTED',  // with severity: 'high'
      'PROCESS_KILLED',
      'DISPLAY_ADDED',
      'CLIPBOARD_CHANGED', // any clipboard change during exam is suspicious
    ];

    const cheatCount = (report.auditEvents || []).filter((ev: any) => {
      if (ev.type === 'PROCESS_DETECTED' && ev.severity !== 'high') return false;
      return highSeverityTypes.includes(ev.type);
    }).length;

    // Update the submission with the full audit log + cheat count
    await prisma.quizBlockSubmission.update({
      where: { id: submissionId },
      data: {
        cheatLog: report as any, // Prisma Json type
        cheatAttempts: cheatCount,
      },
    });

    return NextResponse.json({ success: true, cheatAttempts: cheatCount });
  } catch (error: any) {
    console.error('[integrity-report] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to store integrity report' },
      { status: 500 }
    );
  }
}
