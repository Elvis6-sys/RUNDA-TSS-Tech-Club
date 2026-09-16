// Part 2: JavaScript Fundamentals - Variables, Data Types, and Operators

export const jsVariablesAndOperators = {
  id: "swdjf301-lo1-ic3",
  title: "Variables, Data Types, and Operators",
  topics: [
    {
      id: "swdjf301-lo1-ic3-t1",
      title: "Working with Variables in JavaScript",
      blocks: [
        {
          id: "swdjf301-lo1-ic3-t1-text1",
          type: "text",
          content: `## JavaScript Variables

Variables are containers for storing data values.

### Naming Conventions:
- Must start with letter, $, or _
- Can contain letters, digits, underscores, dollar signs
- Case-sensitive (age and Age are different)
- Use camelCase for variable names (firstName, lastName)

### Variable Declaration Keywords:
- **var**: Old way, function-scoped (avoid in modern JS)
- **let**: Block-scoped, can be reassigned
- **const**: Block-scoped, cannot be reassigned (use for constants)`
        },
        {
          id: "swdjf301-lo1-ic3-t1-code1",
          type: "code",
          language: "javascript",
          caption: "Variable declaration and initialization",
          code: `// Variable declaration
let firstName;

// Variable initialization
firstName = "John";

// Declaration + initialization
let lastName = "Doe";
const birthYear = 1990;

// Re-declaration with let (block scope)
let age = 25;
age = 26; // ✓ Allowed

// const cannot be reassigned
const PI = 3.14159;
// PI = 3.14; // ✗ Error!

console.log(firstName, lastName, age);`
        },
        {
          id: "swdjf301-lo1-ic3-t1-quiz1",
          type: "quiz",
          question: "Which keyword should you use for a value that will never change?",
          options: ["var", "let", "const", "static"],
          correct: 2,
          explanation: "Use 'const' for values that should remain constant throughout your program."
        }
      ]
    },
    {
      id: "swdjf301-lo1-ic3-t2",
      title: "JavaScript Data Types",
      blocks: [
        {
          id: "swdjf301-lo1-ic3-t2-text1",
          type: "text",
          content: `## Data Types in JavaScript

### Primitive Data Types:
1. **String**: Text values ("hello", 'world')
2. **Number**: Integers and decimals (42, 3.14)
3. **Boolean**: true or false
4. **Undefined**: Variable declared but not assigned
5. **Null**: Intentional absence of value
6. **Symbol**: Unique identifier (ES6)
7. **BigInt**: Very large integers (ES2020)

### Non-Primitive (Reference) Types:
1. **Object**: Collections of key-value pairs
2. **Array**: Ordered list of values
3. **Function**: Reusable code blocks

### Type Casting:
Converting one data type to another`
        },
        {
          id: "swdjf301-lo1-ic3-t2-code1",
          type: "code",
          language: "javascript",
          caption: "Data types examples",
          code: `// Primitive types
let name = "Alice";           // String
let age = 30;                 // Number
let isStudent = true;         // Boolean
let job;                      // Undefined
let salary = null;            // Null

// Check data type
console.log(typeof name);     // "string"
console.log(typeof age);      // "number"
console.log(typeof isStudent); // "boolean"

// Type casting
let numStr = "123";
let num = Number(numStr);     // String to Number
console.log(num + 10);        // 133

let value = 456;
let str = String(value);      // Number to String
console.log(str + "7");       // "4567"

// Non-primitive types
let person = {                // Object
  name: "Bob",
  age: 25
};

let colors = ["red", "green", "blue"]; // Array`
        },
        {
          id: "swdjf301-lo1-ic3-t2-quiz1",
          type: "quiz",
          question: "What will typeof null return?",
          options: ["'null'", "'undefined'", "'object'", "'number'"],
          correct: 2,
          explanation: "This is a known JavaScript quirk — typeof null returns 'object', which is considered a historical bug in JavaScript."
        }
      ]
    },
    {
      id: "swdjf301-lo1-ic3-t3",
      title: "JavaScript Operators",
      blocks: [
        {
          id: "swdjf301-lo1-ic3-t3-text1",
          type: "text",
          content: `## JavaScript Operators

### Assignment Operators:
- \`=\` assign
- \`+=\` add and assign
- \`-=\` subtract and assign
- \`*=\` multiply and assign

### Arithmetic Operators:
- \`+\` addition
- \`-\` subtraction
- \`*\` multiplication
- \`/\` division
- \`%\` modulus (remainder)
- \`**\` exponentiation

### Comparison Operators:
- \`==\` equal to (loose)
- \`===\` equal to (strict)
- \`!=\` not equal (loose)
- \`!==\` not equal (strict)
- \`>\`, \`<\`, \`>=\`, \`<=\`

### Logical Operators:
- \`&&\` AND
- \`||\` OR
- \`!\` NOT

### Ternary Operator:
- \`condition ? valueIfTrue : valueIfFalse\``
        },
        {
          id: "swdjf301-lo1-ic3-t3-code1",
          type: "code",
          language: "javascript",
          caption: "Operators in action",
          code: `// Arithmetic
let x = 10;
let y = 3;
console.log(x + y);    // 13
console.log(x - y);    // 7
console.log(x * y);    // 30
console.log(x / y);    // 3.333...
console.log(x % y);    // 1 (remainder)
console.log(2 ** 3);   // 8 (2^3)

// Assignment
let score = 100;
score += 50;           // score = score + 50
console.log(score);    // 150

// Comparison
console.log(5 == "5");   // true (loose comparison)
console.log(5 === "5");  // false (strict comparison)
console.log(10 > 5);     // true

// Logical
let age = 20;
let hasLicense = true;
console.log(age >= 18 && hasLicense); // true (both conditions)

// Ternary
let status = age >= 18 ? "Adult" : "Minor";
console.log(status);  // "Adult"`
        },
        {
          id: "swdjf301-lo1-ic3-t3-quiz1",
          type: "quiz",
          question: "What is the result of: 10 % 3?",
          options: ["0", "1", "3", "3.33"],
          correct: 1,
          explanation: "The modulus operator (%) returns the remainder of division. 10 divided by 3 is 3 with remainder 1."
        },
        {
          id: "swdjf301-lo1-ic3-t3-chk1",
          type: "checklist",
          items: [
            "I understand JavaScript naming conventions",
            "I can declare and initialize variables with let and const",
            "I know the primitive and non-primitive data types",
            "I can use arithmetic, comparison, and logical operators"
          ]
        }
      ]
    }
  ]
};
