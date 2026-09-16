// L3 Module: Javascript Fundamentals (SWDJF301)
import { LearnModule } from './learnContent';

export const javascriptFundamentals: LearnModule = {
  slug: "l3-specific-modules-swdjf301-javascript-fundamentals",
  moduleCode: "SWDJF301",
  title: "JavaScript Fundamentals",
  tier: "l3",
  trackName: "L3 — Specific Modules",
  xpReward: 100,
  estimatedMinutes: 360,
  description: "Develop dynamic websites using JavaScript. This module covers JavaScript basic concepts, data manipulation, and web project integration.",
  outcomes: [
    {
      number: 1,
      title: "Apply JavaScript Basic Concepts",
      learningHours: 20,
      indicativeContents: [
        {
          id: "swdjf301-lo1-ic1",
          title: "Introduction to JavaScript",
          topics: [
            {
              id: "swdjf301-lo1-ic1-t1",
              title: "Definition and Applications of JavaScript",
              blocks: [
                {
                  id: "swdjf301-lo1-ic1-t1-text1",
                  type: "text",
                  content: `## What is JavaScript?

**JavaScript** is a high-level, interpreted programming language that enables interactive web pages and dynamic content.

### Key Concepts:
- **Variable**: Container for storing data values
- **Data Types**: String, Number, Boolean, Object, Array, Undefined, Null
- **Operators**: Symbols that perform operations on values (+, -, *, /, %)
- **Expressions**: Combinations of values, variables, and operators
- **Keywords**: Reserved words with special meaning (let, const, if, function)
- **Comments**: Notes in code that are ignored by the interpreter

### Applications:
- Interactive web pages
- Web applications (Gmail, Facebook)
- Mobile apps (React Native)
- Server-side development (Node.js)
- Game development
- IoT and embedded systems`
                },
                {
                  id: "swdjf301-lo1-ic1-t1-quiz1",
                  type: "quiz",
  questions: [{
    id: "swdjf301-lo1-ic1-t1-quiz1-q1",
    questionType: "mcq",
    question: "Which of the following is NOT a JavaScript data type?",
    options: ["String", "Number", "Character", "Boolean"],
    correct: 2,
    explanation: "JavaScript doesn't have a 'Character' type — individual characters are represented as strings of length 1."
  }],
                }
              ]
            },
            {
              id: "swdjf301-lo1-ic1-t2",
              title: "JavaScript Ecosystem: Libraries, Frameworks & Runtime",
              blocks: [
                {
                  id: "swdjf301-lo1-ic1-t2-text1",
                  type: "text",
                  content: `## JavaScript Ecosystem

### Popular Libraries:
- **React**: UI component library by Facebook
- **jQuery**: Simplifies DOM manipulation
- **Three.js**: 3D graphics library

### Popular Frameworks:
- **Vue.js**: Progressive framework for building UIs
- **Angular**: Full-featured framework by Google
- **Express.js**: Minimal web framework for Node.js

### Runtime Environments:
- **Node.js**: Server-side JavaScript runtime
- **V8 Engine**: High-performance JavaScript engine by Google (powers Node.js and Chrome)

### JavaScript Versions:
- **ES5 (2009)**: Widely supported, baseline JavaScript
- **ES6/ES2015**: Major update with let/const, arrow functions, classes
- **ES2016+**: Annual updates with new features`
                },
                {
                  id: "swdjf301-lo1-ic1-t2-quiz1",
                  type: "quiz",
  questions: [{
    id: "swdjf301-lo1-ic1-t2-quiz1-q1",
    questionType: "mcq",
    question: "What is Node.js?",
    options: [
    "A JavaScript library",
    "A JavaScript runtime environment",
    "A CSS framework",
    "A database management system"
    ],
    correct: 1,
    explanation: "Node.js is a JavaScript runtime built on Chrome's V8 engine, allowing JavaScript to run on the server side."
  }],
                }
              ]
            }
          ]
        },
        {
          id: "swdjf301-lo1-ic2",
          title: "Integration of JavaScript to HTML",
          topics: [
            {
              id: "swdjf301-lo1-ic2-t1",
              title: "Using <script> Tag in HTML",
              blocks: [
                {
                  id: "swdjf301-lo1-ic2-t1-text1",
                  type: "text",
                  content: `## Integrating JavaScript into HTML

There are three main ways to add JavaScript to HTML:

1. **Inline in <head>**: Executes before page loads
2. **Inline in <body>**: Executes when encountered
3. **External file**: Best practice for maintainability
4. **CDN reference**: For third-party libraries`
                },
                {
                  id: "swdjf301-lo1-ic2-t1-code1",
                  type: "code",
                  language: "html",
                  caption: "JavaScript in <head>",
                  code: `<!DOCTYPE html>
<html>
<head>
  <title>JS in Head</title>
  <script>
    console.log("JavaScript in head - runs first");
  </script>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>`
                },
                {
                  id: "swdjf301-lo1-ic2-t1-code2",
                  type: "code",
                  language: "html",
                  caption: "External JavaScript file",
                  code: `<!DOCTYPE html>
<html>
<head>
  <title>External JS</title>
</head>
<body>
  <h1>Hello World</h1>
  
  <!-- External JS file (recommended) -->
  <script src="script.js"></script>
</body>
</html>`
                },
                {
                  id: "swdjf301-lo1-ic2-t1-code3",
                  type: "code",
                  language: "html",
                  caption: "Using CDN reference",
                  code: `<!DOCTYPE html>
<html>
<head>
  <title>CDN Example</title>
</head>
<body>
  <h1>Using jQuery from CDN</h1>
  
  <!-- jQuery from CDN -->
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  <script>
    $(document).ready(function() {
      console.log("jQuery is loaded!");
    });
  </script>
</body>
</html>`
                },
                {
                  id: "swdjf301-lo1-ic2-t1-chk1",
                  type: "checklist",
                  items: [
                    "I can add JavaScript to HTML using <script> tag",
                    "I understand the difference between inline and external JS",
                    "I know how to reference external libraries via CDN"
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};
