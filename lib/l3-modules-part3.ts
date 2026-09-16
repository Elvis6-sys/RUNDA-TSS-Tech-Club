// Part 3: JavaScript LO2 - Manipulate Data with JavaScript

export const jsDataManipulation = {
  lo2: {
    number: 2,
    title: "Manipulate Data with JavaScript",
    learningHours: 50,
    indicativeContents: [
      {
        id: "swdjf301-lo2-ic1",
        title: "Strings and Conditional Statements",
        topics: [
          {
            id: "swdjf301-lo2-ic1-t1",
            title: "Using Strings in JavaScript",
            blocks: [
              {
                id: "swdjf301-lo2-ic1-t1-text1",
                type: "text",
                content: `## JavaScript Strings

Strings are sequences of characters enclosed in quotes.

### String Methods:
- \`length\` – string length
- \`toUpperCase()\` / \`toLowerCase()\`
- \`trim()\` – remove whitespace
- \`includes()\` – check if contains substring
- \`startsWith()\` / \`endsWith()\`
- \`indexOf()\` / \`lastIndexOf()\`
- \`slice(start, end)\` – extract part of string
- \`replace()\` – replace text
- \`split()\` – split into array

### Template Literals (ES6):
Use backticks (\`) to embed expressions: \`\${variable}\``
              },
              {
                id: "swdjf301-lo2-ic1-t1-code1",
                type: "code",
                language: "javascript",
                caption: "String operations and methods",
                code: `let firstName = "Alice";
let lastName = "Wonderland";

// Concatenation
let fullName = firstName + " " + lastName;
console.log(fullName);  // Alice Wonderland

// Template literal
let greeting = \`Hello, \${firstName}!\`;
console.log(greeting);  // Hello, Alice!

// String methods
console.log(fullName.length);           // 16
console.log(fullName.toUpperCase());    // ALICE WONDERLAND
console.log(fullName.includes("Alice")); // true
console.log(fullName.replace("Alice", "Bob")); // Bob Wonderland

// Escape characters
let message = "She said \\"Hello\\"";
let path = "C:\\\\Users\\\\Documents";`
              },
              {
                id: "swdjf301-lo2-ic1-t1-quiz1",
                type: "quiz",
                question: "What is the output of: 'hello'.toUpperCase()?",
                options: ["'hello'", "'HELLO'", "'Hello'", "Error"],
                correct: 1,
                explanation: "toUpperCase() converts all characters in a string to uppercase."
              }
            ]
          },
          {
            id: "swdjf301-lo2-ic1-t2",
            title: "Conditional Statements",
            blocks: [
              {
                id: "swdjf301-lo2-ic1-t2-text1",
                type: "text",
                content: `## Conditional Statements

Control the flow of execution based on conditions.

### Types:
- **if**: Execute if condition is true
- **if...else**: Execute one of two blocks
- **if...else if...else**: Multiple conditions
- **switch**: Match a value against cases
- **ternary**: Short if/else for simple conditions`
              },
              {
                id: "swdjf301-lo2-ic1-t2-code1",
                type: "code",
                language: "javascript",
                caption: "If, else if, else, and switch",
                code: `let score = 75;

// if...else if...else
if (score >= 90) {
  console.log("Grade: A");
} else if (score >= 80) {
  console.log("Grade: B");
} else if (score >= 70) {
  console.log("Grade: C");
} else {
  console.log("Grade: F");
}

// switch statement
let day = 3;
switch (day) {
  case 1:
    console.log("Monday");
    break;
  case 2:
    console.log("Tuesday");
    break;
  case 3:
    console.log("Wednesday");
    break;
  default:
    console.log("Another day");
}

// Ternary
let result = score >= 70 ? "Pass" : "Fail";
console.log(result); // Pass`
              },
              {
                id: "swdjf301-lo2-ic1-t2-quiz1",
                type: "quiz",
                question: "What happens if you omit 'break' in a switch case?",
                options: [
                  "An error is thrown",
                  "The switch stops immediately",
                  "Execution falls through to the next case",
                  "Nothing changes"
                ],
                correct: 2,
                explanation: "Without 'break', JavaScript 'falls through' and continues executing the next case(s) until it hits a break or the end of the switch."
              }
            ]
          }
        ]
      },
      {
        id: "swdjf301-lo2-ic2",
        title: "Loops and Functions",
        topics: [
          {
            id: "swdjf301-lo2-ic2-t1",
            title: "Loop Functions in JavaScript",
            blocks: [
              {
                id: "swdjf301-lo2-ic2-t1-text1",
                type: "text",
                content: `## JavaScript Loops

Loops execute a block of code repeatedly.

### Types of Loops:
- **for**: Known number of iterations
- **for...in**: Iterate over object properties
- **for...of**: Iterate over iterable values (arrays, strings)
- **while**: Loop while condition is true
- **do...while**: Execute at least once, then check condition`
              },
              {
                id: "swdjf301-lo2-ic2-t1-code1",
                type: "code",
                language: "javascript",
                caption: "All types of loops",
                code: `// for loop
for (let i = 0; i < 5; i++) {
  console.log(i); // 0, 1, 2, 3, 4
}

// for...in (object properties)
const student = { name: "Alice", age: 20, city: "Kigali" };
for (let key in student) {
  console.log(key + ": " + student[key]);
}

// for...of (array values)
const fruits = ["apple", "banana", "mango"];
for (let fruit of fruits) {
  console.log(fruit);
}

// while loop
let count = 0;
while (count < 3) {
  console.log("Count: " + count);
  count++;
}

// do...while (executes at least once)
let n = 0;
do {
  console.log("n is: " + n);
  n++;
} while (n < 3);`
              },
              {
                id: "swdjf301-lo2-ic2-t1-quiz1",
                type: "quiz",
                question: "Which loop is guaranteed to execute at least once?",
                options: ["for", "while", "for...of", "do...while"],
                correct: 3,
                explanation: "do...while always executes the body first, then checks the condition — so it always runs at least once."
              }
            ]
          },
          {
            id: "swdjf301-lo2-ic2-t2",
            title: "Functions in JavaScript",
            blocks: [
              {
                id: "swdjf301-lo2-ic2-t2-text1",
                type: "text",
                content: `## JavaScript Functions

Functions are reusable blocks of code.

### Types of Functions:
- **Function Declaration**: Classic named function
- **Function Expression**: Function assigned to a variable
- **Arrow Function** (ES6): Concise syntax
- **Built-in Functions**: alert(), parseInt(), etc.

### Advanced:
- **Callback**: Function passed as an argument
- **Closure**: Function remembering outer variables
- **Async/Await**: Handling asynchronous operations
- **Promise**: Object representing future completion`
              },
              {
                id: "swdjf301-lo2-ic2-t2-code1",
                type: "code",
                language: "javascript",
                caption: "Different types of functions",
                code: `// Function Declaration
function greet(name) {
  return "Hello, " + name + "!";
}
console.log(greet("Alice")); // Hello, Alice!

// Function Expression
const add = function(a, b) {
  return a + b;
};
console.log(add(5, 3)); // 8

// Arrow Function (ES6)
const multiply = (a, b) => a * b;
console.log(multiply(4, 5)); // 20

// Default parameters
function welcome(name = "Guest") {
  return "Welcome, " + name;
}
console.log(welcome());        // Welcome, Guest
console.log(welcome("Bob"));   // Welcome, Bob

// Async function with Promise
async function fetchData() {
  try {
    const response = await fetch("https://api.example.com/data");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error:", error);
  }
}`
              },
              {
                id: "swdjf301-lo2-ic2-t2-chk1",
                type: "checklist",
                items: [
                  "I can write function declarations and expressions",
                  "I can use arrow functions",
                  "I understand function parameters and return values",
                  "I know the difference between synchronous and asynchronous functions"
                ]
              }
            ]
          }
        ]
      },
      {
        id: "swdjf301-lo2-ic3",
        title: "Objects, Arrays, Events, and DOM",
        topics: [
          {
            id: "swdjf301-lo2-ic3-t1",
            title: "Objects and Arrays",
            blocks: [
              {
                id: "swdjf301-lo2-ic3-t1-code1",
                type: "code",
                language: "javascript",
                caption: "Working with Objects and Arrays",
                code: `// --- OBJECTS ---
const student = {
  name: "Alice",
  age: 20,
  greet() {
    return "Hi, I am " + this.name;
  }
};

console.log(student.name);       // Alice
console.log(student["age"]);     // 20
console.log(student.greet());    // Hi, I am Alice

// Object constructor
function Person(name, age) {
  this.name = name;
  this.age = age;
}
const p1 = new Person("Bob", 25);

// --- ARRAYS ---
const numbers = [10, 20, 30, 40, 50];

// Array methods
console.log(numbers.length);          // 5
numbers.push(60);                     // add to end
numbers.pop();                        // remove from end
console.log(numbers.includes(30));    // true

// Array iteration
numbers.forEach((num) => console.log(num));
const doubled = numbers.map(num => num * 2);
const evens = numbers.filter(num => num % 2 === 0);
const sum = numbers.reduce((acc, num) => acc + num, 0);`
              },
              {
                id: "swdjf301-lo2-ic3-t1-quiz1",
                type: "quiz",
                question: "Which array method creates a new array with only elements that pass a test?",
                options: ["map()", "filter()", "reduce()", "forEach()"],
                correct: 1,
                explanation: "filter() creates a new array containing only elements for which the callback function returns true."
              }
            ]
          },
          {
            id: "swdjf301-lo2-ic3-t2",
            title: "HTML Events, DOM Manipulation, and Error Handling",
            blocks: [
              {
                id: "swdjf301-lo2-ic3-t2-code1",
                type: "code",
                language: "javascript",
                caption: "HTML Events and DOM Manipulation",
                code: `// HTML Events
document.getElementById("myBtn").addEventListener("click", function() {
  alert("Button clicked!");
});

// Window Object methods
// alert("Hello");
// let name = prompt("Enter your name:");
// setTimeout(() => console.log("Delayed"), 2000);
// setInterval(() => console.log("Repeating"), 1000);

// --- DOM Manipulation ---
// Select elements
const heading = document.getElementById("title");
const items = document.getElementsByClassName("item");
const firstPara = document.querySelector("p");
const allParas = document.querySelectorAll("p");

// Change content
heading.innerHTML = "<em>New Title</em>";
firstPara.textContent = "Updated text";

// Change styles
heading.style.color = "blue";
heading.style.fontSize = "24px";

// Form validation
function validateForm() {
  const email = document.getElementById("email").value;
  if (!email.includes("@")) {
    alert("Please enter a valid email");
    return false;
  }
  return true;
}`
              },
              {
                id: "swdjf301-lo2-ic3-t2-code2",
                type: "code",
                language: "javascript",
                caption: "Error Handling with try/catch",
                code: `// Error types: SyntaxError, ReferenceError, TypeError, RangeError

// try...catch
try {
  let result = undeclaredVariable + 10;
} catch (error) {
  console.error("Error caught:", error.message);
} finally {
  console.log("This always runs");
}

// Throw custom errors
function divide(a, b) {
  if (b === 0) {
    throw new Error("Division by zero is not allowed");
  }
  return a / b;
}

try {
  console.log(divide(10, 0));
} catch (err) {
  console.error(err.message);
}`
              },
              {
                id: "swdjf301-lo2-ic3-t2-quiz1",
                type: "quiz",
                question: "Which DOM method selects a single element by its id attribute?",
                options: [
                  "getElementsByClassName()",
                  "querySelector()",
                  "getElementById()",
                  "querySelectorAll()"
                ],
                correct: 2,
                explanation: "getElementById() returns the single element with the specified id attribute."
              },
              {
                id: "swdjf301-lo2-ic3-t2-chk1",
                type: "checklist",
                items: [
                  "I can create and manipulate JavaScript objects",
                  "I can use common array methods (map, filter, reduce)",
                  "I can handle HTML events with addEventListener",
                  "I can select and modify DOM elements",
                  "I can validate forms with JavaScript",
                  "I can handle errors with try/catch"
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  lo3: {
    number: 3,
    title: "Apply JavaScript in a Web Project",
    learningHours: 30,
    indicativeContents: [
      {
        id: "swdjf301-lo3-ic1",
        title: "Build a Web Project with JavaScript",
        topics: [
          {
            id: "swdjf301-lo3-ic1-t1",
            title: "Setting Up the Project Environment",
            blocks: [
              {
                id: "swdjf301-lo3-ic1-t1-text1",
                type: "text",
                content: `## Project Structure Setup

### Steps to set up a web project:
1. Create a project folder
2. Structure folders: \`css/\`, \`js/\`, \`images/\`
3. Create \`index.html\`, \`style.css\`, \`script.js\`
4. Link CSS and JS files in HTML
5. Open in VS Code and start coding`
              },
              {
                id: "swdjf301-lo3-ic1-t1-code1",
                type: "code",
                language: "html",
                caption: "Complete project structure template",
                code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My JS Project</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>

  <!-- Page content -->
  <div id="app">
    <h1>Currency Converter</h1>
    <input type="number" id="amount" placeholder="Enter amount">
    <select id="currency">
      <option value="USD">USD</option>
      <option value="EUR">EUR</option>
      <option value="RWF">RWF</option>
    </select>
    <button id="convertBtn">Convert</button>
    <p id="result"></p>
  </div>

  <!-- Link JavaScript at bottom of body -->
  <script src="js/script.js"></script>
</body>
</html>`
              },
              {
                id: "swdjf301-lo3-ic1-t1-code2",
                type: "code",
                language: "javascript",
                caption: "Currency converter JS logic",
                code: `// Currency exchange rates (to USD)
const rates = {
  USD: 1,
  EUR: 0.92,
  RWF: 1275
};

document.getElementById("convertBtn").addEventListener("click", function() {
  const amount = parseFloat(document.getElementById("amount").value);
  const targetCurrency = document.getElementById("currency").value;
  const resultEl = document.getElementById("result");

  // Validation
  if (isNaN(amount) || amount <= 0) {
    resultEl.textContent = "Please enter a valid amount.";
    resultEl.style.color = "red";
    return;
  }

  // Conversion
  const converted = (amount * rates[targetCurrency]).toFixed(2);
  resultEl.textContent = \`\${amount} USD = \${converted} \${targetCurrency}\`;
  resultEl.style.color = "green";
});`
              },
              {
                id: "swdjf301-lo3-ic1-t1-chk1",
                type: "checklist",
                items: [
                  "I have created a project folder with proper structure",
                  "I have linked HTML, CSS, and JavaScript files",
                  "I can apply variables, operators, and conditional statements",
                  "I can use functions in a real project",
                  "I can implement form validation with JavaScript"
                ]
              }
            ]
          }
        ]
      }
    ]
  }
};
