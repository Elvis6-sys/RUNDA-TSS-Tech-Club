/**
 * Curriculum-Based Test Generator - DATABASE DRIVEN
 * Generates entrance test questions from ALL curriculum modules in database
 * Automatically selects modules based on student department and level
 * Adjusts difficulty based on RQF level (L3 easier, L5 harder)
 */

import { prisma } from '@/lib/prisma';

export type GeneratedQuestion = {
  id: string;
  type: 'mcq' | 'truefalse' | 'fillin' | 'multiselect' | 'short' | 'essay' | 'code';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  points: number;
  rubric?: string;
  moduleCode: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
};

/**
 * Get relevant curriculum modules from database based on department and level
 */
export async function getRelevantModulesForTest(
  department: string,
  level: string
): Promise<Array<{ code: string; name: string; category: string }>> {
  try {
    // Fetch ONLY CORE modules from database for this department and level
    // Excludes: general modules and CCM modules (languages, entrepreneurship)
    const modules = await prisma.curriculumModule.findMany({
      where: {
        department,
        level,
        category: 'core', // ONLY CORE/SPECIFIC MODULES
        isActive: true
      },
      select: {
        code: true,
        name: true,
        category: true,
        description: true
      },
      orderBy: [
        { code: 'asc' }
      ]
    });

    console.log(`[Test Generator] Found ${modules.length} CORE modules for ${department} ${level}`);
    console.log(`[Test Generator] Core modules: ${modules.map(m => m.code).join(', ')}`);

    return modules;
  } catch (error) {
    console.error('[Test Generator] Database error:', error);
    return [];
  }
}

/**
 * Extract curriculum content and learning objectives
 */
async function extractCurriculumContent(moduleCode: string, moduleName: string): Promise<{
  learningObjectives: string[];
  topics: string[];
  keyTerms: string[];
}> {
  // Try to get from database description
  try {
    const module = await prisma.curriculumModule.findUnique({
      where: { code: moduleCode },
      select: { description: true, name: true }
    });

    if (module?.description) {
      // Could parse description for objectives if formatted properly
    }
  } catch (error) {
    console.log(`[Test Generator] Could not fetch module ${moduleCode} details`);
  }

  // Generate objectives based on module name
  const objectives = generateGenericObjectives(moduleCode, moduleName);

  return objectives;
}

/**
 * Generate learning objectives based on module name
 */
function generateGenericObjectives(moduleCode: string, moduleName: string): {
  learningObjectives: string[];
  topics: string[];
  keyTerms: string[];
} {
  return {
    learningObjectives: [
      `Understand core concepts of ${moduleName}`,
      `Apply fundamental principles from ${moduleName} curriculum`,
      `Demonstrate knowledge of key topics in ${moduleName}`,
      `Analyze and solve problems related to ${moduleName}`
    ],
    topics: [
      `${moduleName} Fundamentals`,
      `Core Concepts`,
      `Practical Applications`,
      `Problem Solving`
    ],
    keyTerms: extractKeyTermsFromName(moduleName)
  };
}

/**
 * Extract key terms from module name
 */
function extractKeyTermsFromName(name: string): string[] {
  const words = name.split(' ').filter(w => w.length > 3);
  return words.slice(0, 5);
}

/**
 * Generate entrance test questions using AI based on curriculum content
 */
export async function generateEntranceTestFromCurriculum(
  moduleCodes: string[],
  level: string,
  questionCount: number = 20
): Promise<GeneratedQuestion[]> {

  const allQuestions: GeneratedQuestion[] = [];
  const usedQuestionIds = new Set<string>(); // Track used questions to prevent duplicates

  // Get module details from database
  const modules = await prisma.curriculumModule.findMany({
    where: {
      code: { in: moduleCodes }
    },
    select: {
      code: true,
      name: true,
      category: true
    }
  });

  console.log(`[Test Generator] Generating questions for ${modules.length} modules`);

  for (const module of modules) {
    // Extract curriculum content
    const content = await extractCurriculumContent(module.code, module.name);

    // Calculate questions per module (distribute evenly)
    const questionsPerModule = Math.ceil(questionCount / modules.length);

    // Generate questions using AI
    const prompt = buildQuestionGenerationPrompt(
      module.code,
      module.name,
      content,
      questionsPerModule,
      level
    );

    const questions = await generateQuestionsWithAI(prompt, module.code);

    // Filter out duplicates and add to collection
    for (const q of questions) {
      const questionHash = `${q.question}-${q.correctAnswer}`;
      if (!usedQuestionIds.has(questionHash)) {
        usedQuestionIds.add(questionHash);
        allQuestions.push(q);
      }
    }
  }

  // Ensure we have at least 20 questions
  if (allQuestions.length < questionCount) {
    console.log(`[Test Generator] Only ${allQuestions.length} questions, need ${questionCount}`);
  }

  // Balance question types and difficulty, ensure no duplicates
  return balanceQuestions(allQuestions, questionCount, level);
}

/**
 * Build AI prompt for question generation
 */
function buildQuestionGenerationPrompt(
  moduleCode: string,
  moduleName: string,
  content: { learningObjectives: string[]; topics: string[]; keyTerms: string[] },
  count: number,
  level: string
): string {
  // Adjust difficulty based on RQF level
  const difficultyGuidance = {
    'l3': 'Focus on basic understanding and recall. Questions should test fundamental knowledge.',
    'l4': 'Mix of understanding and application. Include practical scenarios.',
    'l5': 'Higher-order thinking: analysis, evaluation, and problem-solving. Include complex scenarios.'
  };

  return `You are an expert TVET educator creating an entrance test question for ${moduleName} (${moduleCode}).

RQF LEVEL: ${level.toUpperCase()}
DIFFICULTY GUIDANCE: ${difficultyGuidance[level as keyof typeof difficultyGuidance] || difficultyGuidance['l4']}

MODULE: ${moduleName} (${moduleCode})

LEARNING OBJECTIVES:
${content.learningObjectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

TOPICS: ${content.topics.join(', ')}
KEY TERMS: ${content.keyTerms.join(', ')}

TASK: Generate ${count} entrance test questions for this module.

CRITICAL REQUIREMENTS:
- ONLY objective questions that can be auto-graded
- Question types: MCQ, True/False, Fill-in-the-blank, Multiple Select
- NO essay, NO code questions
- Each question must be unique and test different concepts

QUESTION TYPE DISTRIBUTION (for full test):
- 30% Multiple Choice (MCQ) - 4 options each
- 30% Multiple Select - 4-5 options, 2-3 correct answers
- 20% True/False
- 20% Fill-in-the-blank - single word or short phrase answer

For this module, generate a balanced mix of these types.

DIFFICULTY FOR ${level.toUpperCase()}:
${level === 'l3' ? '- 60% Easy, 30% Medium, 10% Hard' : ''}
${level === 'l4' ? '- 40% Easy, 40% Medium, 20% Hard' : ''}
${level === 'l5' ? '- 20% Easy, 50% Medium, 30% Hard' : ''}

POINTS:
- Easy: 2-3 points
- Medium: 3-4 points
- Hard: 4-5 points

RESPOND IN STRICT JSON FORMAT:
{
  "questions": [
    {
      "id": "unique-id",
      "type": "mcq|truefalse|fillin|multiselect|short|essay",
      "question": "Question text",
      "options": ["option1", "option2", ...] (for mcq/multiselect/truefalse),
      "correctAnswer": "answer" or ["answer1", "answer2"],
      "points": number,
      "rubric": "grading criteria for subjective questions",
      "topic": "specific topic",
      "difficulty": "easy|medium|hard"
    }
  ]
}

IMPORTANT: Return ONLY valid JSON, no other text.`;
}

/**
 * Generate questions using AI
 */
async function generateQuestionsWithAI(prompt: string, moduleCode: string): Promise<GeneratedQuestion[]> {
  try {
    // Call AI API (use environment-aware endpoint)
    const aiEndpoint = process.env.AI_API_ENDPOINT || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const apiUrl = `${aiEndpoint}/api/chat`;

    console.log(`[Test Generator] Calling AI API for ${moduleCode}...`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are an expert TVET curriculum designer. You create high-quality assessment questions. Always respond in valid JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: false
      })
    });

    if (!response.ok) {
      console.error(`[Test Generator] AI API returned ${response.status}`);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    let responseText = data.message || data.response || '';

    // Clean JSON from markdown
    responseText = responseText.trim();
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (responseText.startsWith('```')) {
      responseText = responseText.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(responseText);

    // Add moduleCode to each question
    const questions = parsed.questions.map((q: any) => ({
      ...q,
      moduleCode,
      id: `${moduleCode}-${q.id || Math.random().toString(36).substring(7)}`
    }));

    console.log(`[Test Generator] AI generated ${questions.length} questions for ${moduleCode}`);
    return questions;

  } catch (error) {
    console.error(`[Test Generator] AI generation failed for ${moduleCode}:`, error);
    console.log(`[Test Generator] Using fallback questions for ${moduleCode}`);
    // Return fallback questions
    return getFallbackQuestions(moduleCode);
  }
}

/**
 * Balance question distribution based on type requirements
 * Ensures: 4 True/False, 6 MCQ, 4 Fill-in, 6 Multiselect
 * Every module gets at least 1 question
 */
function balanceQuestions(
  questions: GeneratedQuestion[],
  targetCount: number,
  level: string
): GeneratedQuestion[] {
  // Remove duplicates based on question text + answer
  const uniqueQuestions = new Map<string, GeneratedQuestion>();

  for (const q of questions) {
    const key = `${q.question}-${JSON.stringify(q.correctAnswer)}`;
    if (!uniqueQuestions.has(key)) {
      uniqueQuestions.set(key, q);
    }
  }

  const dedupedQuestions = Array.from(uniqueQuestions.values());

  console.log(`[Test Generator] After deduplication: ${dedupedQuestions.length} unique questions`);

  // Target distribution: 4 TF, 6 MCQ, 4 Fill-in, 6 Multiselect
  const typeDistribution = {
    truefalse: 4,
    mcq: 6,
    fillin: 4,
    multiselect: 6
  };

  // Group by module to ensure every module gets at least 1 question
  const byModule = new Map<string, GeneratedQuestion[]>();
  for (const q of dedupedQuestions) {
    if (!byModule.has(q.moduleCode)) {
      byModule.set(q.moduleCode, []);
    }
    byModule.get(q.moduleCode)!.push(q);
  }

  // First, select 1 question per module (priority)
  const selected: GeneratedQuestion[] = [];
  const usedKeys = new Set<string>();

  // Use Array.from to iterate over Map entries
  for (const [moduleCode, moduleQuestions] of Array.from(byModule.entries())) {
    const shuffled = shuffleArray(moduleQuestions);
    const firstQuestion = shuffled[0];
    if (firstQuestion) {
      const key = `${firstQuestion.question}-${JSON.stringify(firstQuestion.correctAnswer)}`;
      selected.push(firstQuestion);
      usedKeys.add(key);
      console.log(`[Test Generator] Selected 1 question from module ${moduleCode}`);
    }
  }

  // Now fill remaining slots by type
  const remaining = dedupedQuestions.filter(q => {
    const key = `${q.question}-${JSON.stringify(q.correctAnswer)}`;
    return !usedKeys.has(key);
  });

  // Group remaining by type
  const byType: Record<string, GeneratedQuestion[]> = {
    truefalse: [],
    mcq: [],
    fillin: [],
    multiselect: []
  };

  for (const q of remaining) {
    if (byType[q.type]) {
      byType[q.type].push(q);
    }
  }

  // Add questions to reach target distribution
  for (const [type, targetQty] of Object.entries(typeDistribution)) {
    const currentCount = selected.filter(q => q.type === type).length;
    const needed = targetQty - currentCount;

    if (needed > 0 && byType[type].length > 0) {
      const shuffled = shuffleArray(byType[type]);
      const toAdd = shuffled.slice(0, needed);
      selected.push(...toAdd);
      console.log(`[Test Generator] Added ${toAdd.length} ${type} questions (needed ${needed})`);
    }
  }

  console.log(`[Test Generator] Final selection: ${selected.length} questions`);
  console.log(`[Test Generator] Type breakdown: TF=${selected.filter(q => q.type === 'truefalse').length}, MCQ=${selected.filter(q => q.type === 'mcq').length}, Fill-in=${selected.filter(q => q.type === 'fillin').length}, Multiselect=${selected.filter(q => q.type === 'multiselect').length}`);

  // Shuffle final selection
  return shuffleArray(selected.slice(0, targetCount));
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Fallback questions if AI fails
 * Generates realistic technical questions based on module information
 * ONLY MCQ and True/False questions for easy AI grading
 */
function getFallbackQuestions(moduleCode: string): GeneratedQuestion[] {
  // Parse module code to understand subject area
  const subject = getSubjectFromCode(moduleCode);

  // Get question pool (10+ questions per subject)
  const questionPool = getQuestionTemplates(subject);

  // Filter to objective question types only (no essay, no code)
  const objectiveOnly = questionPool.filter(q =>
    q.type === 'mcq' ||
    q.type === 'truefalse' ||
    q.type === 'fillin' ||
    q.type === 'multiselect'
  );

  // Shuffle and select 4-5 random questions per module to reach 20 total
  const shuffled = shuffleArray(objectiveOnly);
  const selectedTemplates = shuffled.slice(0, 5); // Increased to 5 per module

  // Map to final questions with unique IDs based on content hash
  return selectedTemplates.map((template) => {
    const contentHash = `${template.question.substring(0, 20)}-${template.correctAnswer}`;
    const uniqueId = `${moduleCode}-${Date.now()}-${contentHash.replace(/\s/g, '').substring(0, 10)}`;

    return {
      id: uniqueId,
      type: template.type,
      question: template.question,
      options: template.options,
      correctAnswer: template.correctAnswer,
      points: template.points,
      rubric: template.rubric,
      moduleCode,
      topic: template.topic,
      difficulty: template.difficulty
    };
  });
}

/**
 * Determine subject area from module code
 */
function getSubjectFromCode(code: string): string {
  const codeMap: Record<string, string> = {
    // Software Development
    'SWD': 'Software Development',
    'SWDBD': 'Backend Development',
    'SWDBS': 'Backend Systems',
    'SWDDA': 'Data Structures & Algorithms',
    'SWDDD': 'Database Development',
    'SWDPP': 'PHP Programming',
    'SWDWS': 'Windows Server',

    // Computer Systems
    'CSA': 'Computer Systems Architecture',
    'CSACD': 'Computer Diagnostics',
    'CSACI': 'Computer Installation',
    'CSACM': 'Computer Maintenance',
    'CSAPA': 'PC Assembly',
    'CSAPD': 'PC Diagnostics',
    'CSATM': 'Troubleshooting & Maintenance',

    // Networking
    'NET': 'Networking',
    'GENBN': 'Networking Basics',

    // General
    'GEN': 'General Studies',
    'GENFA': 'Mathematics',
    'GENMP': 'Mechanics & Physics'
  };

  for (const [prefix, subject] of Object.entries(codeMap)) {
    if (code.startsWith(prefix)) {
      return subject;
    }
  }

  return 'Technical Studies';
}

/**
 * Generate realistic questions based on subject area
 */
function generateContextualQuestions(moduleCode: string, subject: string): GeneratedQuestion[] {
  // THIS FUNCTION IS NO LONGER USED - REMOVED
  // Keeping for backwards compatibility but not called
  return [];
}

/**
 * Question templates by subject
 */
function getQuestionTemplates(subject: string): Array<{
  type: GeneratedQuestion['type'];
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  points: number;
  rubric?: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}> {

  // Backend Development / PHP
  if (subject.includes('Backend') || subject.includes('PHP')) {
    return [
      // MCQ Questions
      {
        type: 'mcq',
        question: 'Which HTTP method is used to update an existing resource in a RESTful API?',
        options: ['GET', 'POST', 'PUT', 'DELETE'],
        correctAnswer: 'PUT',
        points: 3,
        topic: 'REST APIs',
        difficulty: 'easy'
      },
      {
        type: 'mcq',
        question: 'What is the purpose of prepared statements in database queries?',
        options: [
          'To make queries run faster',
          'To prevent SQL injection attacks',
          'To format query results',
          'To cache database connections'
        ],
        correctAnswer: 'To prevent SQL injection attacks',
        points: 3,
        topic: 'Security',
        difficulty: 'medium'
      },
      {
        type: 'mcq',
        question: 'Which status code indicates a successful HTTP POST request that created a new resource?',
        options: ['200 OK', '201 Created', '204 No Content', '301 Moved Permanently'],
        correctAnswer: '201 Created',
        points: 3,
        topic: 'HTTP Status Codes',
        difficulty: 'medium'
      },
      {
        type: 'mcq',
        question: 'Which PHP superglobal is used to collect form data sent via POST method?',
        options: ['$_GET', '$_POST', '$_REQUEST', '$_FORM'],
        correctAnswer: '$_POST',
        points: 2,
        topic: 'PHP Basics',
        difficulty: 'easy'
      },
      {
        type: 'mcq',
        question: 'What is the purpose of the Content-Type header in HTTP requests?',
        options: [
          'To specify authentication credentials',
          'To indicate the media type of the request body',
          'To set cookies',
          'To define caching rules'
        ],
        correctAnswer: 'To indicate the media type of the request body',
        points: 3,
        topic: 'HTTP Headers',
        difficulty: 'medium'
      },
      // True/False Questions
      {
        type: 'truefalse',
        question: 'In MVC architecture, the Controller handles business logic and data manipulation.',
        options: ['True', 'False'],
        correctAnswer: 'False',
        points: 2,
        topic: 'Architecture',
        difficulty: 'easy'
      },
      {
        type: 'truefalse',
        question: 'Session data is stored on the client side in cookies.',
        options: ['True', 'False'],
        correctAnswer: 'False',
        points: 2,
        topic: 'Session Management',
        difficulty: 'easy'
      },
      {
        type: 'truefalse',
        question: 'REST APIs must use JSON for data exchange.',
        options: ['True', 'False'],
        correctAnswer: 'False',
        points: 2,
        topic: 'REST APIs',
        difficulty: 'medium'
      },
      // Fill-in-the-blank Questions
      {
        type: 'fillin',
        question: 'JSON stands for JavaScript Object _______.',
        correctAnswer: 'Notation',
        points: 2,
        topic: 'Data Formats',
        difficulty: 'easy'
      },
      {
        type: 'fillin',
        question: 'The HTTP method used to delete a resource is _______.',
        correctAnswer: 'DELETE',
        points: 2,
        topic: 'HTTP Methods',
        difficulty: 'easy'
      },
      {
        type: 'fillin',
        question: 'In MVC architecture, the _______ component handles user interactions and updates the model.',
        correctAnswer: 'Controller',
        points: 3,
        topic: 'Architecture',
        difficulty: 'medium'
      },
      // Multiple Select Questions
      {
        type: 'multiselect',
        question: 'Which of the following are valid HTTP request methods? (Select all that apply)',
        options: ['GET', 'POST', 'SEND', 'PUT', 'FETCH'],
        correctAnswer: ['GET', 'POST', 'PUT'],
        points: 4,
        topic: 'HTTP Methods',
        difficulty: 'medium'
      },
      {
        type: 'multiselect',
        question: 'Which of these are components of the MVC architecture pattern? (Select all that apply)',
        options: ['Model', 'View', 'Controller', 'Router', 'Service'],
        correctAnswer: ['Model', 'View', 'Controller'],
        points: 4,
        topic: 'Architecture',
        difficulty: 'easy'
      },
      {
        type: 'multiselect',
        question: 'Which PHP superglobals can be used to access request data? (Select all that apply)',
        options: ['$_GET', '$_POST', '$_REQUEST', '$_FORM', '$_DATA'],
        correctAnswer: ['$_GET', '$_POST', '$_REQUEST'],
        points: 4,
        topic: 'PHP Basics',
        difficulty: 'medium'
      }
    ];
  }

  // Database Development
  if (subject.includes('Database')) {
    return [
      {
        type: 'mcq',
        question: 'Which SQL clause is used to filter records returned by a SELECT statement?',
        options: ['FILTER', 'WHERE', 'HAVING', 'GROUP BY'],
        correctAnswer: 'WHERE',
        points: 2,
        topic: 'SQL Basics',
        difficulty: 'easy'
      },
      {
        type: 'mcq',
        question: 'What type of relationship exists when one record in Table A can relate to multiple records in Table B?',
        options: ['One-to-One', 'One-to-Many', 'Many-to-Many', 'Self-referencing'],
        correctAnswer: 'One-to-Many',
        points: 3,
        topic: 'Database Design',
        difficulty: 'medium'
      },
      {
        type: 'mcq',
        question: 'Which normal form requires that all non-key attributes depend on the entire primary key?',
        options: ['1NF', '2NF', '3NF', 'BCNF'],
        correctAnswer: '2NF',
        points: 4,
        topic: 'Normalization',
        difficulty: 'medium'
      },
      {
        type: 'mcq',
        question: 'What SQL command is used to retrieve data from a database?',
        options: ['GET', 'SELECT', 'FETCH', 'RETRIEVE'],
        correctAnswer: 'SELECT',
        points: 2,
        topic: 'SQL Basics',
        difficulty: 'easy'
      },
      {
        type: 'mcq',
        question: 'Which SQL JOIN returns all records from the left table and matched records from the right table?',
        options: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN'],
        correctAnswer: 'LEFT JOIN',
        points: 3,
        topic: 'SQL Joins',
        difficulty: 'medium'
      },
      {
        type: 'truefalse',
        question: 'A primary key can contain NULL values.',
        options: ['True', 'False'],
        correctAnswer: 'False',
        points: 2,
        topic: 'Database Constraints',
        difficulty: 'easy'
      },
      {
        type: 'mcq',
        question: 'What does ACID stand for in database transactions?',
        options: [
          'Atomicity, Consistency, Isolation, Durability',
          'Accuracy, Consistency, Integrity, Data',
          'Atomic, Complete, Isolated, Durable',
          'Access, Control, Isolation, Data'
        ],
        correctAnswer: 'Atomicity, Consistency, Isolation, Durability',
        points: 4,
        topic: 'Transactions',
        difficulty: 'medium'
      },
      {
        type: 'mcq',
        question: 'Which SQL clause is used to sort query results?',
        options: ['SORT BY', 'ORDER BY', 'GROUP BY', 'ARRANGE BY'],
        correctAnswer: 'ORDER BY',
        points: 2,
        topic: 'SQL Basics',
        difficulty: 'easy'
      },
      {
        type: 'truefalse',
        question: 'A foreign key creates a relationship between two tables.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        points: 2,
        topic: 'Database Design',
        difficulty: 'easy'
      },
      {
        type: 'mcq',
        question: 'What is denormalization in database design?',
        options: [
          'Removing all relationships between tables',
          'Adding redundancy to improve query performance',
          'Normalizing data to 4NF',
          'Deleting duplicate records'
        ],
        correctAnswer: 'Adding redundancy to improve query performance',
        points: 4,
        topic: 'Optimization',
        difficulty: 'hard'
      },
      {
        type: 'mcq',
        question: 'Which SQL aggregate function calculates the average of a numeric column?',
        options: ['SUM()', 'AVG()', 'MEAN()', 'AVERAGE()'],
        correctAnswer: 'AVG()',
        points: 2,
        topic: 'SQL Functions',
        difficulty: 'easy'
      }
    ];
  }

  // Data Structures & Algorithms
  if (subject.includes('Data Structures') || subject.includes('Algorithm')) {
    return [
      {
        type: 'mcq',
        question: 'What is the time complexity of searching for an element in a balanced binary search tree?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
        correctAnswer: 'O(log n)',
        points: 3,
        topic: 'Complexity Analysis',
        difficulty: 'medium'
      },
      {
        type: 'mcq',
        question: 'Which data structure follows the LIFO (Last In First Out) principle?',
        options: ['Queue', 'Stack', 'Linked List', 'Array'],
        correctAnswer: 'Stack',
        points: 2,
        topic: 'Data Structures',
        difficulty: 'easy'
      },
      {
        type: 'truefalse',
        question: 'A hash table provides O(1) average-case time complexity for insert and search operations.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        points: 2,
        topic: 'Hash Tables',
        difficulty: 'easy'
      },
      {
        type: 'mcq',
        question: 'Which sorting algorithm has the best average-case time complexity?',
        options: ['Bubble Sort', 'Insertion Sort', 'Quick Sort', 'Selection Sort'],
        correctAnswer: 'Quick Sort',
        points: 3,
        topic: 'Sorting Algorithms',
        difficulty: 'medium'
      },
      {
        type: 'mcq',
        question: 'What data structure is used to implement a priority queue?',
        options: ['Array', 'Linked List', 'Heap', 'Stack'],
        correctAnswer: 'Heap',
        points: 3,
        topic: 'Priority Queues',
        difficulty: 'medium'
      },
      {
        type: 'truefalse',
        question: 'An array provides constant-time access to elements by index.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        points: 2,
        topic: 'Arrays',
        difficulty: 'easy'
      },
      {
        type: 'mcq',
        question: 'Which data structure is best for implementing undo functionality in a text editor?',
        options: ['Queue', 'Stack', 'Tree', 'Graph'],
        correctAnswer: 'Stack',
        points: 3,
        topic: 'Application',
        difficulty: 'medium'
      },
      {
        type: 'mcq',
        question: 'What is the space complexity of recursive algorithms that make n recursive calls?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
        correctAnswer: 'O(n)',
        points: 4,
        topic: 'Space Complexity',
        difficulty: 'hard'
      },
      {
        type: 'truefalse',
        question: 'A linked list allows faster insertion at the beginning compared to an array.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        points: 2,
        topic: 'Linked Lists',
        difficulty: 'easy'
      },
      {
        type: 'mcq',
        question: 'Which traversal method visits nodes level by level in a tree?',
        options: ['In-order', 'Pre-order', 'Post-order', 'Breadth-first'],
        correctAnswer: 'Breadth-first',
        points: 3,
        topic: 'Tree Traversal',
        difficulty: 'medium'
      },
      {
        type: 'mcq',
        question: 'What is the worst-case time complexity of binary search?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        correctAnswer: 'O(log n)',
        points: 3,
        topic: 'Search Algorithms',
        difficulty: 'medium'
      }
    ];
  }

  // Computer Systems / Hardware
  if (subject.includes('Computer Systems') || subject.includes('PC') || subject.includes('Hardware') || subject.includes('Assembly') || subject.includes('Installation') || subject.includes('Maintenance')) {
    return [
      // MCQ Questions (6)
      {
        type: 'mcq',
        question: 'What component is responsible for temporarily storing data that the CPU is actively using?',
        options: ['Hard Drive', 'RAM', 'Cache', 'ROM'],
        correctAnswer: 'RAM',
        points: 2,
        topic: 'Hardware Components',
        difficulty: 'easy'
      },
      {
        type: 'mcq',
        question: 'Which bus connects the CPU to memory and other components on the motherboard?',
        options: ['USB', 'PCI', 'System Bus', 'SATA'],
        correctAnswer: 'System Bus',
        points: 3,
        topic: 'System Architecture',
        difficulty: 'medium'
      },
      {
        type: 'mcq',
        question: 'What is the primary function of the BIOS/UEFI?',
        options: [
          'Run the operating system',
          'Initialize hardware and boot the OS',
          'Manage file storage',
          'Control network connections'
        ],
        correctAnswer: 'Initialize hardware and boot the OS',
        points: 3,
        topic: 'System Boot',
        difficulty: 'medium'
      },
      {
        type: 'mcq',
        question: 'Which component supplies power to all internal computer components?',
        options: ['Motherboard', 'Power Supply Unit (PSU)', 'Battery', 'Capacitor'],
        correctAnswer: 'Power Supply Unit (PSU)',
        points: 2,
        topic: 'Power Systems',
        difficulty: 'easy'
      },
      {
        type: 'mcq',
        question: 'What is thermal paste used for in PC assembly?',
        options: [
          'To stick components together',
          'To improve heat transfer between CPU and heatsink',
          'To insulate electrical connections',
          'To seal the case from dust'
        ],
        correctAnswer: 'To improve heat transfer between CPU and heatsink',
        points: 3,
        topic: 'Cooling Systems',
        difficulty: 'medium'
      },
      {
        type: 'mcq',
        question: 'Which expansion slot is commonly used for graphics cards?',
        options: ['PCI', 'PCIe x16', 'AGP', 'ISA'],
        correctAnswer: 'PCIe x16',
        points: 3,
        topic: 'Expansion Slots',
        difficulty: 'medium'
      },
      // True/False Questions (3)
      {
        type: 'truefalse',
        question: 'The CPU cache is faster than RAM but smaller in size.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        points: 2,
        topic: 'Memory Hierarchy',
        difficulty: 'easy'
      },
      {
        type: 'truefalse',
        question: 'SSD drives have moving mechanical parts like traditional hard drives.',
        options: ['True', 'False'],
        correctAnswer: 'False',
        points: 2,
        topic: 'Storage Devices',
        difficulty: 'easy'
      },
      {
        type: 'truefalse',
        question: 'ROM (Read-Only Memory) retains data even when power is turned off.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        points: 2,
        topic: 'Memory Types',
        difficulty: 'easy'
      },
      // Fill-in-the-blank Questions (3)
      {
        type: 'fillin',
        question: 'The _______ is the main circuit board that connects all components of a computer.',
        correctAnswer: 'motherboard',
        points: 2,
        topic: 'Hardware Components',
        difficulty: 'easy'
      },
      {
        type: 'fillin',
        question: 'POST stands for Power On _______-Test.',
        correctAnswer: 'Self',
        points: 2,
        topic: 'Boot Process',
        difficulty: 'easy'
      },
      {
        type: 'fillin',
        question: 'The ALU (Arithmetic Logic Unit) is a component of the _______.',
        correctAnswer: 'CPU',
        points: 3,
        topic: 'CPU Components',
        difficulty: 'medium'
      },
      // Multiple Select Questions (3)
      {
        type: 'multiselect',
        question: 'Which of the following are types of computer memory? (Select all that apply)',
        options: ['RAM', 'ROM', 'Cache', 'BIOS', 'POST'],
        correctAnswer: ['RAM', 'ROM', 'Cache'],
        points: 4,
        topic: 'Memory Types',
        difficulty: 'medium'
      },
      {
        type: 'multiselect',
        question: 'Which ports are commonly used for video output? (Select all that apply)',
        options: ['HDMI', 'DisplayPort', 'Ethernet', 'VGA', 'USB-A'],
        correctAnswer: ['HDMI', 'DisplayPort', 'VGA'],
        points: 4,
        topic: 'Ports and Connectors',
        difficulty: 'easy'
      },
      {
        type: 'multiselect',
        question: 'Which are storage device types? (Select all that apply)',
        options: ['HDD', 'SSD', 'RAM', 'NVMe', 'Cache'],
        correctAnswer: ['HDD', 'SSD', 'NVMe'],
        points: 4,
        topic: 'Storage Devices',
        difficulty: 'medium'
      }
    ];
  }

  // Troubleshooting & Maintenance
  if (subject.includes('Troubleshooting') || subject.includes('Maintenance') || subject.includes('Diagnostic')) {
    return [
      // MCQ Questions (6)
      {
        type: 'mcq',
        question: 'A computer fails to boot and emits three short beeps. What does this typically indicate?',
        options: [
          'Power supply failure',
          'Memory error',
          'Hard drive failure',
          'CPU overheating'
        ],
        correctAnswer: 'Memory error',
        points: 3,
        topic: 'Hardware Diagnostics',
        difficulty: 'medium'
      },
      {
        type: 'mcq',
        question: 'Which tool is commonly used to test power supply output voltages?',
        options: ['Oscilloscope', 'Multimeter', 'Logic analyzer', 'Cable tester'],
        correctAnswer: 'Multimeter',
        points: 2,
        topic: 'Diagnostic Tools',
        difficulty: 'easy'
      },
      {
        type: 'mcq',
        question: 'What is the first step in a systematic troubleshooting approach?',
        options: [
          'Replace suspected faulty components',
          'Identify the problem and gather information',
          'Test the solution',
          'Document findings'
        ],
        correctAnswer: 'Identify the problem and gather information',
        points: 3,
        topic: 'Troubleshooting Process',
        difficulty: 'medium'
      },
      {
        type: 'mcq',
        question: 'A computer is overheating. Which component should you check first?',
        options: ['RAM', 'Hard drive', 'Cooling fans and heatsink', 'Power supply'],
        correctAnswer: 'Cooling fans and heatsink',
        points: 2,
        topic: 'Thermal Issues',
        difficulty: 'easy'
      },
      {
        type: 'mcq',
        question: 'What does a continuous beep sound during POST usually indicate?',
        options: [
          'Normal startup',
          'Memory not detected',
          'Power supply failure',
          'Keyboard error'
        ],
        correctAnswer: 'Power supply failure',
        points: 3,
        topic: 'Beep Codes',
        difficulty: 'medium'
      },
      {
        type: 'mcq',
        question: 'Which utility in Windows is used to check and repair disk errors?',
        options: ['Disk Defragmenter', 'CHKDSK', 'Task Manager', 'Device Manager'],
        correctAnswer: 'CHKDSK',
        points: 2,
        topic: 'Disk Maintenance',
        difficulty: 'easy'
      },
      // True/False Questions (3)
      {
        type: 'truefalse',
        question: 'When troubleshooting, you should always start by replacing the most expensive component first.',
        options: ['True', 'False'],
        correctAnswer: 'False',
        points: 2,
        topic: 'Troubleshooting Methods',
        difficulty: 'easy'
      },
      {
        type: 'truefalse',
        question: 'Blue Screen of Death (BSOD) errors are always caused by hardware failures.',
        options: ['True', 'False'],
        correctAnswer: 'False',
        points: 2,
        topic: 'System Errors',
        difficulty: 'easy'
      },
      {
        type: 'truefalse',
        question: 'Regular cleaning of dust from computer components can prevent overheating.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        points: 2,
        topic: 'Preventive Maintenance',
        difficulty: 'easy'
      },
      // Fill-in-the-blank Questions (3)
      {
        type: 'fillin',
        question: 'Before opening a computer case, you should discharge _______ electricity to prevent component damage.',
        correctAnswer: 'static',
        points: 2,
        topic: 'Safety Procedures',
        difficulty: 'easy'
      },
      {
        type: 'fillin',
        question: 'A computer that randomly restarts is often caused by _______ or power supply issues.',
        correctAnswer: 'overheating',
        points: 3,
        topic: 'System Stability',
        difficulty: 'medium'
      },
      {
        type: 'fillin',
        question: 'The systematic approach to troubleshooting follows these steps: Identify, Establish, Test, Implement, Verify, and _______.',
        correctAnswer: 'Document',
        points: 3,
        topic: 'Troubleshooting Process',
        difficulty: 'medium'
      },
      // Multiple Select Questions (3)
      {
        type: 'multiselect',
        question: 'Which tools are commonly used for PC troubleshooting? (Select all that apply)',
        options: ['Multimeter', 'POST card', 'Hammer', 'Loopback adapter', 'Glue gun'],
        correctAnswer: ['Multimeter', 'POST card', 'Loopback adapter'],
        points: 4,
        topic: 'Diagnostic Tools',
        difficulty: 'medium'
      },
      {
        type: 'multiselect',
        question: 'Which are common causes of computer overheating? (Select all that apply)',
        options: ['Dust buildup', 'Failed cooling fan', 'Too much RAM', 'Blocked air vents', 'Old CPU'],
        correctAnswer: ['Dust buildup', 'Failed cooling fan', 'Blocked air vents'],
        points: 4,
        topic: 'Thermal Issues',
        difficulty: 'easy'
      },
      {
        type: 'multiselect',
        question: 'Which are valid troubleshooting steps? (Select all that apply)',
        options: ['Identify the problem', 'Guess randomly', 'Document findings', 'Test the solution', 'Ignore warnings'],
        correctAnswer: ['Identify the problem', 'Document findings', 'Test the solution'],
        points: 4,
        topic: 'Troubleshooting Process',
        difficulty: 'medium'
      }
    ];
  }

  // Networking
  if (subject.includes('Network')) {
    return [
      {
        type: 'mcq',
        question: 'Which OSI layer is responsible for end-to-end communication and error recovery?',
        options: ['Network Layer', 'Transport Layer', 'Session Layer', 'Application Layer'],
        correctAnswer: 'Transport Layer',
        points: 3,
        topic: 'OSI Model',
        difficulty: 'medium'
      },
      {
        type: 'mcq',
        question: 'What is the default subnet mask for a Class C IP address?',
        options: ['255.0.0.0', '255.255.0.0', '255.255.255.0', '255.255.255.255'],
        correctAnswer: '255.255.255.0',
        points: 2,
        topic: 'IP Addressing',
        difficulty: 'easy'
      },
      {
        type: 'mcq',
        question: 'Which protocol is used to automatically assign IP addresses to devices on a network?',
        options: ['DNS', 'DHCP', 'FTP', 'HTTP'],
        correctAnswer: 'DHCP',
        points: 2,
        topic: 'Network Protocols',
        difficulty: 'easy'
      },
      {
        type: 'mcq',
        question: 'What is the purpose of DNS in networking?',
        options: [
          'Assign IP addresses',
          'Translate domain names to IP addresses',
          'Transfer files between computers',
          'Secure network connections'
        ],
        correctAnswer: 'Translate domain names to IP addresses',
        points: 3,
        topic: 'DNS',
        difficulty: 'medium'
      },
      {
        type: 'truefalse',
        question: 'TCP provides reliable, connection-oriented communication.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        points: 2,
        topic: 'Transport Protocols',
        difficulty: 'easy'
      },
      {
        type: 'mcq',
        question: 'Which device operates at Layer 3 of the OSI model?',
        options: ['Hub', 'Switch', 'Router', 'Bridge'],
        correctAnswer: 'Router',
        points: 3,
        topic: 'Network Devices',
        difficulty: 'medium'
      },
      {
        type: 'mcq',
        question: 'What is the maximum number of hosts in a /24 subnet (excluding network and broadcast addresses)?',
        options: ['254', '256', '255', '253'],
        correctAnswer: '254',
        points: 3,
        topic: 'Subnetting',
        difficulty: 'medium'
      },
      {
        type: 'truefalse',
        question: 'A switch operates at the Data Link layer of the OSI model.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        points: 2,
        topic: 'Network Devices',
        difficulty: 'easy'
      },
      {
        type: 'mcq',
        question: 'Which cable type is most resistant to electromagnetic interference?',
        options: ['Coaxial', 'Twisted Pair (UTP)', 'Fiber Optic', 'Flat Cable'],
        correctAnswer: 'Fiber Optic',
        points: 3,
        topic: 'Cabling',
        difficulty: 'medium'
      },
      {
        type: 'mcq',
        question: 'What port does HTTP use by default?',
        options: ['21', '22', '80', '443'],
        correctAnswer: '80',
        points: 2,
        topic: 'Ports',
        difficulty: 'easy'
      },
      {
        type: 'mcq',
        question: 'Which protocol is used to send email?',
        options: ['SMTP', 'POP3', 'IMAP', 'FTP'],
        correctAnswer: 'SMTP',
        points: 2,
        topic: 'Email Protocols',
        difficulty: 'easy'
      },
      {
        type: 'truefalse',
        question: 'IPv6 addresses are 128 bits long.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        points: 2,
        topic: 'IP Versions',
        difficulty: 'easy'
      }
    ];
  }

  // Windows Server
  if (subject.includes('Windows Server')) {
    return [
      {
        type: 'mcq',
        question: 'What service in Windows Server provides centralized authentication and authorization?',
        options: ['IIS', 'Active Directory', 'DNS', 'DHCP'],
        correctAnswer: 'Active Directory',
        points: 3,
        topic: 'Directory Services',
        difficulty: 'medium'
      },
      {
        type: 'mcq',
        question: 'Which Windows Server role is used to host websites and web applications?',
        options: ['File Services', 'Print Services', 'IIS', 'Hyper-V'],
        correctAnswer: 'IIS',
        points: 2,
        topic: 'Server Roles',
        difficulty: 'easy'
      },
      {
        type: 'truefalse',
        question: 'Group Policy Objects (GPO) can be used to enforce security settings across multiple computers.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        points: 2,
        topic: 'Group Policy',
        difficulty: 'easy'
      },
      {
        type: 'mcq',
        question: 'What is the primary purpose of Active Directory Domain Services (AD DS)?',
        options: [
          'Host websites',
          'Manage network resources and users centrally',
          'Run virtual machines',
          'Store files'
        ],
        correctAnswer: 'Manage network resources and users centrally',
        points: 3,
        topic: 'Active Directory',
        difficulty: 'medium'
      },
      {
        type: 'mcq',
        question: 'Which tool is used to manage server roles and features in Windows Server?',
        options: ['Control Panel', 'Server Manager', 'Task Manager', 'Registry Editor'],
        correctAnswer: 'Server Manager',
        points: 2,
        topic: 'Server Management',
        difficulty: 'easy'
      },
      {
        type: 'truefalse',
        question: 'Hyper-V is a virtualization platform built into Windows Server.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        points: 2,
        topic: 'Virtualization',
        difficulty: 'easy'
      },
      {
        type: 'mcq',
        question: 'What does NTFS stand for?',
        options: [
          'Network Transfer File System',
          'New Technology File System',
          'Network Time File Sharing',
          'New Transfer File Standard'
        ],
        correctAnswer: 'New Technology File System',
        points: 2,
        topic: 'File Systems',
        difficulty: 'easy'
      },
      {
        type: 'mcq',
        question: 'Which command-line tool is used to configure network settings in Windows Server?',
        options: ['ipconfig', 'netstat', 'netsh', 'ping'],
        correctAnswer: 'netsh',
        points: 3,
        topic: 'Network Configuration',
        difficulty: 'medium'
      },
      {
        type: 'mcq',
        question: 'What is the purpose of Windows Server Update Services (WSUS)?',
        options: [
          'Backup server data',
          'Manage updates centrally for network computers',
          'Monitor server performance',
          'Configure firewall rules'
        ],
        correctAnswer: 'Manage updates centrally for network computers',
        points: 3,
        topic: 'Update Management',
        difficulty: 'medium'
      },
      {
        type: 'truefalse',
        question: 'Windows Server Core is a minimal installation option without a graphical interface.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        points: 2,
        topic: 'Installation Options',
        difficulty: 'easy'
      },
      {
        type: 'mcq',
        question: 'Which port does Remote Desktop Protocol (RDP) use by default?',
        options: ['3389', '443', '22', '80'],
        correctAnswer: '3389',
        points: 2,
        topic: 'Remote Access',
        difficulty: 'easy'
      }
    ];
  }

  // Default/Generic technical questions
  return [
    {
      type: 'mcq',
      question: 'What does the acronym "TVET" stand for?',
      options: [
        'Technical and Vocational Education and Training',
        'Technology and Virtual Education Training',
        'Technical Verification and Evaluation Test',
        'Training and Validation for Employment Technology'
      ],
      correctAnswer: 'Technical and Vocational Education and Training',
      points: 2,
      topic: 'General Knowledge',
      difficulty: 'easy'
    },
    {
      type: 'mcq',
      question: 'Which of the following is a fundamental principle of good software design?',
      options: [
        'Complexity over simplicity',
        'Tight coupling between components',
        'Separation of concerns',
        'Avoiding documentation'
      ],
      correctAnswer: 'Separation of concerns',
      points: 3,
      topic: 'Software Engineering',
      difficulty: 'medium'
    },
    {
      type: 'truefalse',
      question: 'Testing is an essential part of the software development lifecycle.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      points: 2,
      topic: 'Development Process',
      difficulty: 'easy'
    }
  ];
}

/**
 * Get list of all available curriculum modules
 */
export async function getAllCurriculumModules() {
  const modules = await prisma.curriculumModule.findMany({
    where: { isActive: true },
    select: {
      code: true,
      name: true,
      department: true,
      level: true,
      category: true,
      credits: true
    },
    orderBy: [
      { department: 'asc' },
      { level: 'asc' },
      { code: 'asc' }
    ]
  });

  return modules;
}
