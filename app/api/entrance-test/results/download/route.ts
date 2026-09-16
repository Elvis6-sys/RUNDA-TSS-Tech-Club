/**
 * API Route: Download Entrance Test Results as PDF
 * GET /api/entrance-test/results/download
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

    // Get entrance test with all details
    const entranceTest = await prisma.entranceTest.findFirst({
      where: {
        userId: user.id,
        marksReleasedAt: { not: null } // Only released results
      },
      include: {
        user: true, // UserProfile - no need to include profile as it IS the profile
        responses: {
          include: {
            subjectiveGrading: true
          },
          orderBy: { id: 'asc' }
        }
      }
    });

    if (!entranceTest) {
      return NextResponse.json({ error: 'No released results found' }, { status: 404 });
    }

    // Generate HTML for PDF
    const html = generateResultsPDF(entranceTest);

    // In a real implementation, you'd use a library like puppeteer or react-pdf
    // For now, return HTML that can be printed as PDF
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="entrance-test-results-${entranceTest.id}.html"`
      }
    });

  } catch (error) {
    console.error('[Download Results API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateResultsPDF(test: any): string {
  const passed = test.percentage >= test.passingScore;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Entrance Test Results - ${test.user.name}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
    body {
      font-family: 'Arial', sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      color: #1e293b;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid ${passed ? '#10b981' : '#ef4444'};
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: ${passed ? '#10b981' : '#ef4444'};
      margin: 0;
      font-size: 32px;
    }
    .header .subtitle {
      color: #64748b;
      margin-top: 5px;
    }
    .result-box {
      background: ${passed ? '#dcfce7' : '#fee2e2'};
      border: 2px solid ${passed ? '#10b981' : '#ef4444'};
      border-radius: 8px;
      padding: 24px;
      margin: 20px 0;
      text-align: center;
    }
    .result-box .score {
      font-size: 48px;
      font-weight: bold;
      color: ${passed ? '#10b981' : '#ef4444'};
      margin: 10px 0;
    }
    .result-box .status {
      font-size: 24px;
      font-weight: bold;
      color: ${passed ? '#10b981' : '#ef4444'};
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 20px 0;
    }
    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
    }
    .info-card h3 {
      margin: 0 0 8px 0;
      color: #475569;
      font-size: 14px;
    }
    .info-card .value {
      font-size: 24px;
      font-weight: bold;
      color: #1e293b;
    }
    .section {
      margin: 30px 0;
      page-break-inside: avoid;
    }
    .section h2 {
      color: #1e293b;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 8px;
      margin-bottom: 16px;
    }
    .question {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
      page-break-inside: avoid;
    }
    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 12px;
    }
    .question-text {
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 12px;
    }
    .answer-box {
      background: #f8fafc;
      border-left: 4px solid #3b82f6;
      padding: 12px;
      margin: 8px 0;
    }
    .correct-answer {
      background: #dcfce7;
      border-left: 4px solid #10b981;
      padding: 12px;
      margin: 8px 0;
    }
    .feedback-box {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 12px;
      margin: 8px 0;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-correct {
      background: #dcfce7;
      color: #10b981;
    }
    .badge-incorrect {
      background: #fee2e2;
      color: #ef4444;
    }
    .badge-type {
      background: #dbeafe;
      color: #3b82f6;
    }
    .score-badge {
      font-size: 20px;
      font-weight: bold;
      color: #1e293b;
    }
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #3b82f6;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }
    .print-button:hover {
      background: #2563eb;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    th, td {
      text-align: left;
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      background: #f8fafc;
      font-weight: 600;
      color: #475569;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">🖨️ Print / Save as PDF</button>

  <div class="header">
    <h1>RUNDA TSS Tech Club</h1>
    <div class="subtitle">Entrance Test Results</div>
  </div>

  <div class="result-box">
    <div class="status">${passed ? '✓ PASSED' : '✗ NOT PASSED'}</div>
    <div class="score">${test.percentage.toFixed(1)}%</div>
    <div>${test.scoredPoints.toFixed(1)} / ${test.totalPoints} points</div>
    <div style="margin-top: 8px; color: #64748b;">Passing Score: ${test.passingScore}%</div>
  </div>

  <table>
    <tr>
      <th>Student Name</th>
      <td>${test.user.name}</td>
    </tr>
    <tr>
      <th>Email</th>
      <td>${test.user.email}</td>
    </tr>
    <tr>
      <th>Trade/Program</th>
      <td>${test.trade.replace(/-/g, ' ').toUpperCase()}</td>
    </tr>
    <tr>
      <th>Level</th>
      <td>Level ${test.level.replace('l', '')}</td>
    </tr>
    <tr>
      <th>Submitted</th>
      <td>${new Date(test.submittedAt).toLocaleString()}</td>
    </tr>
    ${test.reviewedAt ? `
    <tr>
      <th>Reviewed</th>
      <td>${new Date(test.reviewedAt).toLocaleString()}</td>
    </tr>
    ` : ''}
  </table>

  <div class="info-grid">
    <div class="info-card">
      <h3>Objective Questions</h3>
      <div class="value">${test.objectiveScore.toFixed(1)} / ${test.objectivePoints}</div>
      <div style="color: #64748b; margin-top: 4px;">
        ${((test.objectiveScore / test.objectivePoints) * 100).toFixed(1)}%
      </div>
    </div>
    <div class="info-card">
      <h3>Subjective Questions</h3>
      <div class="value">${test.subjectiveScore.toFixed(1)} / ${test.subjectivePoints}</div>
      <div style="color: #64748b; margin-top: 4px;">
        ${((test.subjectiveScore / test.subjectivePoints) * 100).toFixed(1)}%
      </div>
    </div>
  </div>

  ${test.reviewNotes ? `
  <div class="section">
    <h2>Teacher's Notes</h2>
    <div class="feedback-box">
      ${test.reviewNotes}
    </div>
  </div>
  ` : ''}

  <div class="section">
    <h2>Detailed Question Breakdown</h2>
    ${test.responses.map((response: any, index: number) => {
    let studentAnswer = '(No answer)';
    try {
      const parsed = JSON.parse(response.studentAnswer);
      if (Array.isArray(parsed)) {
        studentAnswer = parsed.join(', ');
      } else if (typeof parsed === 'object') {
        studentAnswer = JSON.stringify(parsed, null, 2);
      } else {
        studentAnswer = parsed || '(No answer)';
      }
    } catch {
      studentAnswer = response.studentAnswer || '(No answer)';
    }

    let correctAnswer = null;
    if (response.correctAnswer) {
      try {
        const parsed = JSON.parse(response.correctAnswer);
        correctAnswer = Array.isArray(parsed) ? parsed.join(', ') : parsed;
      } catch {
        correctAnswer = response.correctAnswer;
      }
    }

    return `
      <div class="question">
        <div class="question-header">
          <div>
            <span style="color: #64748b; font-weight: 600;">Question ${index + 1}</span>
            <span class="badge badge-type">${response.questionType.toUpperCase()}</span>
            ${response.isCorrect !== null ? `
              <span class="badge ${response.isCorrect ? 'badge-correct' : 'badge-incorrect'}">
                ${response.isCorrect ? '✓ Correct' : '✗ Incorrect'}
              </span>
            ` : ''}
          </div>
          <div class="score-badge">
            ${response.pointsAwarded.toFixed(1)} / ${response.maxPoints}
          </div>
        </div>
        
        <div class="question-text">${response.questionText}</div>
        
        <div class="answer-box">
          <strong>Your Answer:</strong><br>
          ${studentAnswer}
        </div>
        
        ${correctAnswer ? `
        <div class="correct-answer">
          <strong>Correct Answer:</strong><br>
          ${correctAnswer}
        </div>
        ` : ''}
        
        ${response.subjectiveGrading?.teacherFeedback ? `
        <div class="feedback-box">
          <strong>Teacher's Feedback:</strong><br>
          ${response.subjectiveGrading.teacherFeedback}
        </div>
        ` : response.subjectiveGrading?.aiFeedback ? `
        <div class="feedback-box">
          <strong>Feedback:</strong><br>
          ${response.subjectiveGrading.aiFeedback}
        </div>
        ` : response.feedback ? `
        <div class="feedback-box">
          ${response.feedback}
        </div>
        ` : ''}
      </div>
      `;
  }).join('')}
  </div>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b;">
    <p>This is an official record of your entrance test results.</p>
    <p>Generated on ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
  `.trim();
}
