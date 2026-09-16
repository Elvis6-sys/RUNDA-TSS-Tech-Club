/**
 * Entrance Test Question Templates
 * Predefined questions for each trade and level combination
 * All stored offline in the app
 */

export type EntranceTestQuestion = {
  id: string;
  type: 'mcq' | 'truefalse' | 'fillin' | 'multiselect' | 'short' | 'essay' | 'code' | 'drawing';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  points: number;
  rubric?: string; // For subjective questions
};

export type EntranceTestTemplate = {
  trade: string;
  level: string;
  duration: number; // minutes
  passingScore: number; // percentage
  questions: EntranceTestQuestion[];
};

// ═══════════════════════════════════════════════════════════════════════════
// SOFTWARE DEVELOPMENT - LEVEL 3
// ═══════════════════════════════════════════════════════════════════════════
export const SOFTWARE_DEV_L3: EntranceTestTemplate = {
  trade: 'software-development',
  level: 'l3',
  duration: 90,
  passingScore: 60,
  questions: [
    {
      id: 'sd-l3-1',
      type: 'mcq',
      question: 'What does HTML stand for?',
      options: [
        'Hyper Text Markup Language',
        'High Tech Modern Language',
        'Home Tool Markup Language',
        'Hyperlinks and Text Markup Language'
      ],
      correctAnswer: 'Hyper Text Markup Language',
      points: 2
    },
    {
      id: 'sd-l3-2',
      type: 'mcq',
      question: 'Which CSS property is used to change text color?',
      options: ['text-color', 'color', 'font-color', 'text-style'],
      correctAnswer: 'color',
      points: 2
    },
    {
      id: 'sd-l3-3',
      type: 'truefalse',
      question: 'JavaScript is the same as Java programming language.',
      options: ['True', 'False'],
      correctAnswer: 'False',
      points: 2
    },
    {
      id: 'sd-l3-4',
      type: 'multiselect',
      question: 'Which of the following are programming languages? (Select all that apply)',
      options: ['Python', 'HTML', 'JavaScript', 'CSS', 'Java'],
      correctAnswer: ['Python', 'JavaScript', 'Java'],
      points: 3
    },
    {
      id: 'sd-l3-5',
      type: 'fillin',
      question: 'The _____ tag is used to create a hyperlink in HTML.',
      correctAnswer: '<a>',
      points: 2
    },
    {
      id: 'sd-l3-6',
      type: 'short',
      question: 'What is the purpose of a variable in programming?',
      correctAnswer: 'A variable stores data values that can be used and modified in a program',
      points: 4,
      rubric: 'Should mention: storage, data, values, reusable'
    },
    {
      id: 'sd-l3-7',
      type: 'code',
      question: 'Write a simple HTML structure with a heading and a paragraph.',
      correctAnswer: `<!DOCTYPE html>
<html>
<head><title>Page</title></head>
<body>
  <h1>Heading</h1>
  <p>Paragraph</p>
</body>
</html>`,
      points: 5,
      rubric: 'Must include: DOCTYPE, html tags, head, body, h1, p tags with proper closing'
    },
    {
      id: 'sd-l3-8',
      type: 'essay',
      question: 'Explain what you understand about the Internet and how websites work. (100-150 words)',
      correctAnswer: '',
      points: 10,
      rubric: 'Should cover: client-server model, browsers, HTTP, web pages, basic connectivity concepts'
    }
  ]
};

// ═══════════════════════════════════════════════════════════════════════════
// SOFTWARE DEVELOPMENT - LEVEL 4
// ═══════════════════════════════════════════════════════════════════════════
export const SOFTWARE_DEV_L4: EntranceTestTemplate = {
  trade: 'software-development',
  level: 'l4',
  duration: 120,
  passingScore: 65,
  questions: [
    {
      id: 'sd-l4-1',
      type: 'mcq',
      question: 'What is OOP in programming?',
      options: [
        'Object-Oriented Programming',
        'Online Operating Protocol',
        'Optimal Output Process',
        'Organized Operation Procedure'
      ],
      correctAnswer: 'Object-Oriented Programming',
      points: 2
    },
    {
      id: 'sd-l4-2',
      type: 'multiselect',
      question: 'Which are principles of Object-Oriented Programming? (Select all)',
      options: ['Encapsulation', 'Compilation', 'Inheritance', 'Polymorphism', 'Debugging'],
      correctAnswer: ['Encapsulation', 'Inheritance', 'Polymorphism'],
      points: 4
    },
    {
      id: 'sd-l4-3',
      type: 'mcq',
      question: 'What does SQL stand for?',
      options: [
        'Structured Query Language',
        'Simple Question Language',
        'Standard Quality Logic',
        'Sequential Query List'
      ],
      correctAnswer: 'Structured Query Language',
      points: 2
    },
    {
      id: 'sd-l4-4',
      type: 'truefalse',
      question: 'An API (Application Programming Interface) allows different software to communicate.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      points: 2
    },
    {
      id: 'sd-l4-5',
      type: 'short',
      question: 'What is the difference between frontend and backend development?',
      correctAnswer: 'Frontend deals with user interface/client-side, backend handles server-side logic and databases',
      points: 5,
      rubric: 'Must mention: UI/client-side for frontend, server/database for backend'
    },
    {
      id: 'sd-l4-6',
      type: 'code',
      question: 'Write a JavaScript function that takes two numbers and returns their sum.',
      correctAnswer: `function add(a, b) {
  return a + b;
}`,
      points: 6,
      rubric: 'Must include: function declaration, parameters, return statement, correct logic'
    },
    {
      id: 'sd-l4-7',
      type: 'essay',
      question: 'Explain the importance of databases in web applications and describe the difference between SQL and NoSQL databases. (150-200 words)',
      correctAnswer: '',
      points: 12,
      rubric: 'Should cover: data storage, persistence, SQL (relational/structured), NoSQL (flexible/document), use cases'
    }
  ]
};

// ═══════════════════════════════════════════════════════════════════════════
// SOFTWARE DEVELOPMENT - LEVEL 5
// ═══════════════════════════════════════════════════════════════════════════
export const SOFTWARE_DEV_L5: EntranceTestTemplate = {
  trade: 'software-development',
  level: 'l5',
  duration: 120,
  passingScore: 70,
  questions: [
    {
      id: 'sd-l5-1',
      type: 'mcq',
      question: 'What is a RESTful API?',
      options: [
        'An API that uses HTTP methods and follows REST architectural principles',
        'A tool for debugging web applications',
        'A database management system',
        'A programming language'
      ],
      correctAnswer: 'An API that uses HTTP methods and follows REST architectural principles',
      points: 3
    },
    {
      id: 'sd-l5-2',
      type: 'multiselect',
      question: 'Which HTTP methods are commonly used in RESTful APIs? (Select all)',
      options: ['GET', 'UPDATE', 'POST', 'PUT', 'DELETE', 'SEND'],
      correctAnswer: ['GET', 'POST', 'PUT', 'DELETE'],
      points: 4
    },
    {
      id: 'sd-l5-3',
      type: 'short',
      question: 'Explain what authentication and authorization mean in web security.',
      correctAnswer: 'Authentication verifies who you are (login), authorization determines what you can access (permissions)',
      points: 6,
      rubric: 'Must distinguish between authentication (identity verification) and authorization (access control)'
    },
    {
      id: 'sd-l5-4',
      type: 'code',
      question: 'Write a Python function to check if a number is prime.',
      correctAnswer: `def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            return False
    return True`,
      points: 8,
      rubric: 'Must include: edge case handling, loop logic, divisibility check, correct return values'
    },
    {
      id: 'sd-l5-5',
      type: 'essay',
      question: 'Discuss the importance of software design patterns and explain at least two patterns you know (MVC, Singleton, Factory, etc.). Provide examples of when to use them. (200-250 words)',
      correctAnswer: '',
      points: 15,
      rubric: 'Should cover: reusability, maintainability, at least 2 patterns explained, real-world use cases, best practices'
    }
  ]
};

// ═══════════════════════════════════════════════════════════════════════════
// ELECTRONICS - LEVEL 3
// ═══════════════════════════════════════════════════════════════════════════
export const ELECTRONICS_L3: EntranceTestTemplate = {
  trade: 'electronics',
  level: 'l3',
  duration: 90,
  passingScore: 60,
  questions: [
    {
      id: 'elec-l3-1',
      type: 'mcq',
      question: 'What does LED stand for?',
      options: [
        'Light Emitting Diode',
        'Low Energy Device',
        'Linear Electronic Display',
        'Light Electronic Detector'
      ],
      correctAnswer: 'Light Emitting Diode',
      points: 2
    },
    {
      id: 'elec-l3-2',
      type: 'mcq',
      question: 'What is the unit of electrical resistance?',
      options: ['Volt', 'Ampere', 'Ohm', 'Watt'],
      correctAnswer: 'Ohm',
      points: 2
    },
    {
      id: 'elec-l3-3',
      type: 'truefalse',
      question: 'Ohm\'s Law states that V = I × R.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      points: 2
    },
    {
      id: 'elec-l3-4',
      type: 'multiselect',
      question: 'Which are passive electronic components? (Select all)',
      options: ['Resistor', 'Transistor', 'Capacitor', 'Inductor', 'Diode'],
      correctAnswer: ['Resistor', 'Capacitor', 'Inductor'],
      points: 3
    },
    {
      id: 'elec-l3-5',
      type: 'fillin',
      question: 'A _____ is used to store electrical charge in a circuit.',
      correctAnswer: 'capacitor',
      points: 2
    },
    {
      id: 'elec-l3-6',
      type: 'short',
      question: 'What is the difference between AC and DC current?',
      correctAnswer: 'AC (Alternating Current) periodically reverses direction, DC (Direct Current) flows in one direction',
      points: 4,
      rubric: 'Must mention: AC alternates/reverses, DC constant/one direction'
    },
    {
      id: 'elec-l3-7',
      type: 'drawing',
      question: 'Draw a simple circuit with a battery, resistor, and LED connected in series.',
      correctAnswer: 'Circuit diagram with battery (+/-), resistor symbol, and LED symbol in series',
      points: 6,
      rubric: 'Must include: battery with polarity, resistor symbol, LED symbol, proper connections'
    },
    {
      id: 'elec-l3-8',
      type: 'essay',
      question: 'Explain what you understand about basic electronic circuits and the role of resistors. (100-150 words)',
      correctAnswer: '',
      points: 10,
      rubric: 'Should cover: current flow, voltage, resistance, resistor function (limit current), basic safety'
    }
  ]
};

// ═══════════════════════════════════════════════════════════════════════════
// TEST TEMPLATE REGISTRY
// ═══════════════════════════════════════════════════════════════════════════
export const ENTRANCE_TEST_TEMPLATES: Record<string, Record<string, EntranceTestTemplate>> = {
  'software-development': {
    'l3': SOFTWARE_DEV_L3,
    'l4': SOFTWARE_DEV_L4,
    'l5': SOFTWARE_DEV_L5
  },
  'electronics': {
    'l3': ELECTRONICS_L3,
    // 'l4': ELECTRONICS_L4, // TODO: Add more
    // 'l5': ELECTRONICS_L5
  },
  // More trades to be added:
  // 'ict': { l3, l4, l5 },
  // 'automotive': { l3, l4, l5 },
  // etc.
};

/**
 * Get entrance test template for a specific trade and level
 */
export function getEntranceTestTemplate(trade: string, level: string): EntranceTestTemplate | null {
  return ENTRANCE_TEST_TEMPLATES[trade]?.[level] || null;
}

/**
 * Calculate total points for a test template
 */
export function calculateTotalPoints(template: EntranceTestTemplate): number {
  return template.questions.reduce((sum, q) => sum + q.points, 0);
}

/**
 * Calculate objective vs subjective points
 */
export function calculatePointsBreakdown(template: EntranceTestTemplate) {
  const objectiveTypes = ['mcq', 'truefalse', 'fillin', 'multiselect'];
  const objectivePoints = template.questions
    .filter(q => objectiveTypes.includes(q.type))
    .reduce((sum, q) => sum + q.points, 0);
  
  const subjectivePoints = template.questions
    .filter(q => !objectiveTypes.includes(q.type))
    .reduce((sum, q) => sum + q.points, 0);

  return { objectivePoints, subjectivePoints };
}
