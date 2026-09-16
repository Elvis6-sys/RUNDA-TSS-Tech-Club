/**
 * Simple Rule-Based Question Parser
 * No AI - just pattern matching for all 13 question types
 */

export type ParsedQuestion = {
  number: string;
  text: string;
  type: 'mcq' | 'truefalse' | 'fillin' | 'multiselect' | 'matching' | 'ordering' | 'short' | 'essay' | 'code' | 'fileupload' | 'drawing' | 'audio' | 'video';
  options: string[];
  correctAnswer: string[];
  points: number;
  rawText: string;
};

export function parseQuestionsFromText(text: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];

  // Remove header/title lines - find first question
  const lines = text.split('\n');
  const firstQuestionIndex = lines.findIndex(l => /^\s*\d+[.)]\s+/.test(l));
  const contentText = firstQuestionIndex >= 0 ? lines.slice(firstQuestionIndex).join('\n') : text;

  // Split by question numbers at start of line
  const questionPattern = /^(\d+)[.)]\s+/gm;
  const parts = contentText.split(questionPattern).filter(p => p && p.trim());

  // Process in pairs (number, content)
  for (let i = 0; i < parts.length; i += 2) {
    if (i + 1 >= parts.length) break;

    const number = parts[i].trim();
    const content = parts[i + 1].trim();

    const question = parseQuestion(number, content);
    if (question) {
      questions.push(question);
    }
  }

  return questions;
}

function parseQuestion(number: string, content: string): ParsedQuestion | null {
  if (!content) return null;

  // Extract points
  const pointsMatch = content.match(/\[(\d+)\s*(?:pts?|points?|marks?)\]|\((\d+)\s*(?:pts?|points?|marks?)\)/i);
  const points = pointsMatch ? parseInt(pointsMatch[1] || pointsMatch[2]) : 1;

  // Split into lines
  const lines = content.split('\n').map(l => l.trim()).filter(l => l);

  // First line is the question
  const questionText = lines[0].replace(/\[\d+\s*(?:pts?|points?|marks?)\]|\(\d+\s*(?:pts?|points?|marks?)\)/gi, '').trim();

  // Check for explicit answer line (for fill-in, short, essay, code)
  const answerLine = lines.find(l => /^Answer:\s*/i.test(l));
  const explicitAnswer = answerLine ? answerLine.replace(/^Answer:\s*/i, '').trim() : '';

  // Detect question type by keywords and patterns
  const lowerQuestion = questionText.toLowerCase();
  const allContent = content.toLowerCase();

  // Priority 1: Check for specific keywords that are most unique

  // Check for code (MUST come before "write" checks for essay)
  if (lowerQuestion.includes('function') || lowerQuestion.includes('python') || lowerQuestion.includes('javascript') || lowerQuestion.includes('java ') ||
    (lowerQuestion.includes('write') && (lowerQuestion.includes('code') || lowerQuestion.includes('program')))) {
    return {
      number,
      text: questionText,
      type: 'code',
      options: [],
      correctAnswer: [],
      points,
      rawText: content
    };
  }

  // Check for file upload
  if (lowerQuestion.includes('upload') || lowerQuestion.includes('submit file') || lowerQuestion.includes('attach')) {
    return {
      number,
      text: questionText,
      type: 'fileupload',
      options: [],
      correctAnswer: [],
      points,
      rawText: content
    };
  }

  // Check for drawing/diagram
  if (lowerQuestion.includes('draw') || lowerQuestion.includes('sketch') || lowerQuestion.includes('flowchart')) {
    return {
      number,
      text: questionText,
      type: 'drawing',
      options: [],
      correctAnswer: [],
      points,
      rawText: content
    };
  }

  // Check for video (before audio to catch "video demonstration")
  if (lowerQuestion.includes('video') || (lowerQuestion.includes('demonstration') && !lowerQuestion.includes('audio'))) {
    return {
      number,
      text: questionText,
      type: 'video',
      options: [],
      correctAnswer: [],
      points,
      rawText: content
    };
  }

  // Check for audio
  if (lowerQuestion.includes('audio') || (lowerQuestion.includes('record') && lowerQuestion.includes('explanation'))) {
    return {
      number,
      text: questionText,
      type: 'audio',
      options: [],
      correctAnswer: [],
      points,
      rawText: content
    };
  }

  // Check for matching
  if (lowerQuestion.includes('match') || allContent.includes('match the following')) {
    const optionLines = lines.slice(1);
    return {
      number,
      text: questionText,
      type: 'matching',
      options: optionLines,
      correctAnswer: [],
      points,
      rawText: content
    };
  }

  // Check for ordering/sequencing
  if (lowerQuestion.includes('arrange') || lowerQuestion.includes('order') || lowerQuestion.includes('sequence') || lowerQuestion.includes('put in') && lowerQuestion.includes('order')) {
    const optionLines = lines.slice(1);
    return {
      number,
      text: questionText,
      type: 'ordering',
      options: optionLines,
      correctAnswer: [],
      points,
      rawText: content
    };
  }

  // Check for fill in the blank
  if (questionText.includes('_____') || questionText.includes('[blank]') || lowerQuestion.includes('fill in')) {
    return {
      number,
      text: questionText,
      type: 'fillin',
      options: [],
      correctAnswer: explicitAnswer ? [explicitAnswer] : [],
      points,
      rawText: content
    };
  }

  const optionLines = lines.slice(1);

  // Check for True/False
  if (optionLines.some(l => /^(true|false)\s*\*?$/i.test(l))) {
    const correctAnswer = optionLines.find(l => l.includes('*'))?.replace('*', '').trim() || 'True';
    return {
      number,
      text: questionText,
      type: 'truefalse',
      options: ['True', 'False'],
      correctAnswer: [correctAnswer],
      points,
      rawText: content
    };
  }

  // Check for multiple choice (A), B), C), D))
  const mcqOptions: string[] = [];
  const correctAnswers: string[] = [];

  for (const line of optionLines) {
    const optionMatch = line.match(/^([A-E])\)\s*(.+?)(\s*\*)?$/i);
    if (optionMatch) {
      const letter = optionMatch[1].toUpperCase();
      const text = optionMatch[2].trim();
      const isCorrect = !!optionMatch[3];

      mcqOptions.push(`${letter}) ${text}`);
      if (isCorrect) {
        correctAnswers.push(letter);
      }
    }
  }

  if (mcqOptions.length > 0) {
    // Check for multi-select
    if (lowerQuestion.includes('select all') || lowerQuestion.includes('choose all') || correctAnswers.length > 1) {
      return {
        number,
        text: questionText,
        type: 'multiselect',
        options: mcqOptions,
        correctAnswer: correctAnswers,
        points,
        rawText: content
      };
    }

    return {
      number,
      text: questionText,
      type: 'mcq',
      options: mcqOptions,
      correctAnswer: correctAnswers,
      points,
      rawText: content
    };
  }

  // Check for essay - high point value + discussion keywords (but NOT code-related)
  if (points >= 8 && /\b(essay|discuss|describe|elaborate|analyze)\b/i.test(lowerQuestion) &&
    !lowerQuestion.includes('function') && !lowerQuestion.includes('code')) {
    return {
      number,
      text: questionText,
      type: 'essay',
      options: [],
      correctAnswer: [],
      points,
      rawText: content
    };
  }

  // Default to short answer
  return {
    number,
    text: questionText,
    type: 'short',
    options: [],
    correctAnswer: explicitAnswer ? [explicitAnswer] : [],
    points,
    rawText: content
  };
}
