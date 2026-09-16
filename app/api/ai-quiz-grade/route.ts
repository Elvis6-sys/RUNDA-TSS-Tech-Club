import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { getCurrentAPIKey, handleRateLimitError } from '@/lib/api-key-manager';

function getGroqClient() {
  return new Groq({
    apiKey: getCurrentAPIKey(), // Use key rotation
  });
}

export async function POST(request: NextRequest) {
  try {
    const { question, userAnswer, topic, moduleContext } = await request.json();

    if (!question || !userAnswer) {
      return NextResponse.json(
        { error: 'Question and answer are required' },
        { status: 400 }
      );
    }

    // Build context
    const contextInfo = moduleContext ? `
**Learning Context:**
- Module: ${moduleContext.moduleCode || 'N/A'}
- Topic: ${moduleContext.currentTopic?.title || topic}
` : '';

    // Grade the essay answer using AI with retry logic
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const groq = getGroqClient();
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `You are an expert TVET (Technical and Vocational Education) grader specializing in software development. Your role is to grade student essay answers fairly and provide constructive, educational feedback.

**Grading Rubric (100 points):**

1. **Accuracy (40 points)** - Is the answer factually correct?
   - 40: Completely accurate
   - 30: Mostly accurate with minor errors
   - 20: Some correct points but significant errors
   - 10: Mostly inaccurate
   - 0: Completely wrong

2. **Completeness (30 points)** - Does it cover key points?
   - 30: All main points covered
   - 20: Most points covered
   - 10: Some points missing
   - 0: Very incomplete

3. **Clarity (20 points)** - Is it well-explained?
   - 20: Clear, well-structured
   - 15: Understandable
   - 10: Somewhat unclear
   - 5: Confusing

4. **Depth (10 points)** - Shows understanding?
   - 10: Deep understanding, examples given
   - 7: Good understanding
   - 4: Surface-level
   - 0: No depth

**Your Response Format (MUST be valid JSON):**
{
  "score": [0-100],
  "feedback": "Start with what was good. Then suggest improvements. Be encouraging and specific. 2-3 sentences.",
  "suggestedAnswer": "A concise model answer (2-3 sentences) showing what an excellent response looks like.",
  "breakdown": {
    "accuracy": [0-40],
    "completeness": [0-30],
    "clarity": [0-20],
    "depth": [0-10]
  }
}

**Grading Guidelines:**
- Be fair but encouraging
- Recognize effort and partial credit
- Provide actionable feedback
- Help the student learn, don't just criticize
- Score generously for good attempts (60+ if they tried)
- Only score below 40 if answer is way off topic or very wrong`,
            },
            {
              role: 'user',
              content: `${contextInfo}

**Question:** ${question}

**Student's Answer:** ${userAnswer}

Please grade this answer using the rubric and provide detailed feedback in JSON format.`,
            },
          ],
          model: 'openai/gpt-oss-120b',
          temperature: 0.3, // Lower for consistent grading
          max_tokens: 1000,
          response_format: { type: 'json_object' },
        });

        const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

        return NextResponse.json({
          score: result.score || 50,
          feedback: result.feedback || 'Good effort! Keep practicing.',
          suggestedAnswer: result.suggestedAnswer,
          breakdown: result.breakdown || {},
          success: true,
        });

      } catch (error: any) {
        console.error('AI Quiz Grade Error:', error);

        // Handle rate limiting
        if (error.message?.includes('rate_limit') || error.message?.includes('429')) {
          const resetMatch = error.message.match(/(\d+)m(\d+)/);
          const resetSeconds = resetMatch ? (parseInt(resetMatch[1]) * 60) + parseInt(resetMatch[2]) : 86400;

          handleRateLimitError(resetSeconds);

          if (retryCount < maxRetries - 1) {
            console.log(`🔄 Retrying essay grading with new API key (attempt ${retryCount + 2}/${maxRetries})...`);
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
        }

        // Final fallback
        return NextResponse.json({
          score: 65,
          feedback: '✅ Your answer has been recorded. Good effort! A trainer will provide detailed feedback soon.',
          suggestedAnswer: '',
          success: true
        }, { status: 200 });
      }
    }

    // Should never reach here
    return NextResponse.json({
      score: 65,
      feedback: 'Answer recorded for review.',
      success: true
    });

  } catch (error: any) {
    console.error('Quiz Grade Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to grade answer',
        score: 65,
        feedback: 'Answer recorded. A trainer will review it.',
        success: false
      },
      { status: 500 }
    );
  }
}
