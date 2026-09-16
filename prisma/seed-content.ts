/**
 * seed-content.ts
 *
 * Seeds Learning Outcome 1 content blocks into every SkillNode at order=0.
 * Each node gets a Record<topicId, LearnBlock[]> written to SkillNode.blocks.
 *
 * Block types: text (markdown with tables/visuals), code, quiz, checklist
 *
 * Run:
 *   npx ts-node --compiler-options '{"module":"CommonJS","esModuleInterop":true}' prisma/seed-content.ts
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ─── Block builder helpers ────────────────────────────────────────────────────

let _blockId = 0;
const bid = () => `blk-${++_blockId}`;

type Block = {
  id: string;
  type: "text" | "code" | "quiz" | "checklist";
  [key: string]: unknown;
};

const text = (content: string): Block => ({ id: bid(), type: "text", content });
const code = (language: string, code: string, caption = ""): Block => ({ id: bid(), type: "code", language, code, caption });
const quiz = (question: string, options: string[], correct: number, explanation: string): Block =>
  ({ id: bid(), type: "quiz", question, options, correct, explanation });
const check = (...items: string[]): Block => ({ id: bid(), type: "checklist", items });

// topicId → blocks map for one node
type Blocks = Record<string, Block[]>;
function lo1(nodeId: string, blocks: Block[]): Blocks {
  return { [`${nodeId}-t1`]: blocks };
}

// ─── Content map ──────────────────────────────────────────────────────────────
// nodeId → Blocks (LO1 content)

const CONTENT: Record<string, Blocks> = {

  // ══════════════════════════════════════════════════════════════════════════════
  // LEVEL 3 — SPECIFIC
  // ══════════════════════════════════════════════════════════════════════════════

  "seed-node-seed-track-web-development-0": lo1("seed-node-seed-track-web-development-0", [
    text(`## HTML Structure & Semantics

**HTML (HyperText Markup Language)** is the skeleton of every webpage. It tells the browser *what* content is on the page — the styling comes later with CSS.

### 🏗️ Anatomy of an HTML Document

\`\`\`
<!DOCTYPE html>          ← declare HTML5
<html lang="en">
  <head>                 ← metadata (not shown on page)
    <meta charset="UTF-8">
    <title>My Page</title>
  </head>
  <body>                 ← visible content goes here
    <h1>Hello World</h1>
  </body>
</html>
\`\`\`

### 📋 Semantic vs Non-Semantic Elements

| Non-Semantic | Semantic Equivalent | Purpose |
|---|---|---|
| \`<div id="header">\` | \`<header>\` | Page or section header |
| \`<div id="nav">\` | \`<nav>\` | Navigation links |
| \`<div class="main">\` | \`<main>\` | Primary content |
| \`<div class="article">\` | \`<article>\` | Self-contained content |
| \`<div id="sidebar">\` | \`<aside>\` | Related side content |
| \`<div id="footer">\` | \`<footer>\` | Page or section footer |

> 💡 **Why use semantic HTML?** Screen readers, search engines and developers all benefit. A blind user's screen reader announces *"navigation landmark"* for \`<nav>\` — it can't do that with a bare \`<div>\`.

### 🌐 Visual Page Structure

\`\`\`
┌─────────────────────────────────┐
│           <header>              │  ← logo, site name
├────────────┬────────────────────┤
│   <nav>    │                    │  ← menu links
├────────────┤     <main>         │  ← primary content
│  <aside>   │                    │  ← sidebar
├────────────┴────────────────────┤
│            <footer>             │  ← copyright
└─────────────────────────────────┘
\`\`\`

### Key Semantic Elements Reference

| Element | Use when… |
|---|---|
| \`<header>\` | Introductory content for a page or section |
| \`<nav>\` | A set of navigation links |
| \`<main>\` | The dominant content (once per page) |
| \`<article>\` | Independent, distributable content |
| \`<section>\` | Thematic grouping with a heading |
| \`<aside>\` | Tangentially related content |
| \`<footer>\` | Footer for a page or section |
| \`<figure>\` + \`<figcaption>\` | Image with caption |
| \`<time>\` | Dates and times |
| \`<mark>\` | Highlighted text |`),
    code("html", `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RUNDA TSS Tech Club</title>
</head>
<body>

  <header>
    <h1>RUNDA TSS Tech Club</h1>
    <nav>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
    </nav>
  </header>

  <main>
    <article>
      <h2>Welcome to Web Development</h2>
      <p>This is the <strong>primary content</strong> area.</p>
      <figure>
        <img src="banner.jpg" alt="Students coding at RUNDA TSS">
        <figcaption>Students working on their first web project</figcaption>
      </figure>
    </article>

    <aside>
      <h3>Quick Tips</h3>
      <p>Always close your tags!</p>
    </aside>
  </main>

  <footer>
    <p>&copy; 2025 RUNDA TSS Tech Club</p>
  </footer>

</body>
</html>`, "Complete semantic HTML5 page"),
    quiz("Which HTML element wraps the main navigation links of a website?",
      ["<div class=\"nav\">", "<navigation>", "<nav>", "<menu>"], 2,
      "<nav> is the correct semantic element for navigation. It signals to browsers and assistive technologies that this region contains navigation links."),
    check(
      "I can explain what 'semantic HTML' means",
      "I can identify at least 5 semantic HTML5 elements",
      "I can write a complete HTML5 document with correct DOCTYPE and structure",
      "I have coded a page using <header>, <nav>, <main>, <article>, <aside> and <footer>",
    ),
  ]),

  "seed-node-seed-track-javascript-fundamentals-0": lo1("seed-node-seed-track-javascript-fundamentals-0", [
    text(`## Variables, Types & Operators

JavaScript is the language that makes web pages **interactive**. It runs directly in the browser.

### 📦 Declaring Variables

| Keyword | Scope | Reassignable | Hoisted |
|---|---|---|---|
| \`var\` | Function | ✅ Yes | ✅ Yes (to undefined) |
| \`let\` | Block \`{}\` | ✅ Yes | ❌ No (TDZ) |
| \`const\` | Block \`{}\` | ❌ No | ❌ No (TDZ) |

> 🔒 **Rule of thumb:** Always use \`const\` by default. Only use \`let\` when you know the value will change. Never use \`var\` in modern code.

### 🔢 JavaScript Data Types

\`\`\`
📦 Primitive types (stored by value):
  String     →  "Hello", 'World', \`Template\`
  Number     →  42, 3.14, -7, NaN, Infinity
  Boolean    →  true / false
  undefined  →  variable declared but not assigned
  null       →  intentional absence of a value
  Symbol     →  unique identifier (advanced)
  BigInt     →  very large integers (42n)

📦 Reference types (stored by reference):
  Object     →  { name: "Alice", age: 20 }
  Array      →  [1, 2, 3]  ← actually an Object!
  Function   →  function() {}
\`\`\`

### ➕ Operators at a Glance

| Category | Operators | Example |
|---|---|---|
| Arithmetic | \`+ - * / % **\` | \`2 ** 8 → 256\` |
| Comparison | \`=== !== > < >= <=\` | \`5 === "5" → false\` |
| Logical | \`&& \|\| !\` | \`true && false → false\` |
| Nullish coalescing | \`??\` | \`null ?? "default" → "default"\` |
| Optional chaining | \`?.\` | \`user?.address?.city\` |

> ⚠️ **Always use \`===\` not \`==\`**. Strict equality avoids type coercion surprises: \`"5" == 5\` is \`true\`, but \`"5" === 5\` is \`false\`.`),
    code("javascript", `// ── Variable declarations ─────────────────────────────
const name = "RUNDA TSS";          // string — never changes
let score = 0;                     // number — changes during game
const isActive = true;             // boolean

// ── Type checking ───────────────────────────────────────
console.log(typeof name);          // "string"
console.log(typeof score);         // "number"
console.log(typeof isActive);      // "boolean"
console.log(typeof undefined);     // "undefined"
console.log(typeof null);          // "object" ← JS quirk!

// ── Template literals ──────────────────────────────────
const greeting = \`Hello, \${name}! Your score is \${score}.\`;
console.log(greeting);
// → "Hello, RUNDA TSS! Your score is 0."

// ── Type coercion traps ────────────────────────────────
console.log("5" + 3);              // "53" (string concat)
console.log("5" - 3);              // 2   (numeric)
console.log("5" == 5);             // true  (loose)
console.log("5" === 5);            // false (strict — use this!)

// ── Nullish coalescing ─────────────────────────────────
const username = null ?? "Guest";  // "Guest"
const level    = 0    ?? 1;        // 0 (0 is NOT null/undefined)`, "Variables, types and operators in action"),
    quiz("What does the strict equality operator `===` check?",
      ["Only the value, allowing type coercion", "Only the data type", "Both value AND data type, with no coercion", "Memory address"],
      2, "=== checks both value and type without coercion. '5' === 5 is false because one is a string and the other a number."),
    check(
      "I understand the difference between var, let and const",
      "I can name all 7 JavaScript primitive types",
      "I always use === instead of == for comparisons",
      "I can write a template literal with an embedded expression",
    ),
  ]),

  "seed-node-seed-track-game-development-in-vue-framework-0": lo1("seed-node-seed-track-game-development-in-vue-framework-0", [
    text(`## Vue.js Basics for Game Development

**Vue.js** is a progressive JavaScript framework. You can sprinkle it on a single button or build an entire game — it scales with you.

### 🔧 Core Concepts

| Concept | What it does | Game use |
|---|---|---|
| **Component** | Reusable UI + logic block | Player, Enemy, Scoreboard |
| **Reactive data** (\`ref\`, \`reactive\`) | Automatically updates DOM when data changes | Live score, health bar |
| **Computed** | Derived data, auto-cached | "Game Over" condition |
| **Event handling** (\`@click\`, \`@keydown\`) | Respond to user input | Controls |
| **Directives** (\`v-if\`, \`v-for\`) | Conditional/list rendering | Render enemy list |

### 🧱 Vue Component Structure (Composition API)

\`\`\`
┌─────────────────────────────────────────┐
│  <script setup>                         │
│    // Logic: state, events, lifecycle   │
│  </script>                              │
│                                         │
│  <template>                             │
│    <!-- HTML with Vue directives -->    │
│  </template>                            │
│                                         │
│  <style scoped>                         │
│    /* CSS only for this component */    │
│  </style>                               │
└─────────────────────────────────────────┘
\`\`\`

> 💡 **Scoped styles** mean your component's CSS won't accidentally break other components — essential when building complex game UIs.`),
    code("html", `<!-- GameBoard.vue — a simple Vue game component -->
<script setup>
import { ref, computed } from 'vue'

// Reactive state
const score = ref(0)
const lives = ref(3)
const playerName = ref('Player 1')

// Computed: derived state
const isGameOver = computed(() => lives.value === 0)
const statusMessage = computed(() =>
  isGameOver.value ? '💀 Game Over!' : \`❤️ Lives: \${lives.value}\`
)

// Methods
function addScore(points) {
  score.value += points
}

function loseLife() {
  if (lives.value > 0) lives.value--
}
</script>

<template>
  <div class="game-board">
    <h1>🎮 {{ playerName }}</h1>

    <div class="hud">
      <span class="score">Score: {{ score }}</span>
      <span class="status">{{ statusMessage }}</span>
    </div>

    <!-- Only show buttons if game is active -->
    <div v-if="!isGameOver">
      <button @click="addScore(10)">Hit Enemy (+10)</button>
      <button @click="loseLife()">Take Damage</button>
    </div>

    <div v-else class="game-over">
      <p>Final Score: {{ score }}</p>
      <button @click="lives = 3; score = 0">🔄 Restart</button>
    </div>
  </div>
</template>

<style scoped>
.game-board { text-align: center; padding: 2rem; }
.hud { display: flex; gap: 2rem; justify-content: center; font-size: 1.2rem; }
.score { color: #38bdf8; font-weight: bold; }
.game-over { color: #f87171; }
</style>`, "Vue game component with score, lives and Game Over state"),
    quiz("In Vue 3 Composition API, which function creates a reactive variable?",
      ["reactive()", "ref()", "data()", "useState()"], 1,
      "ref() creates a reactive reference to a primitive value. You access its value with .value in <script> and directly in <template>."),
    check(
      "I can explain what a Vue component is",
      "I understand the three sections of a .vue file",
      "I can create a reactive variable using ref()",
      "I can use v-if and @click in a template",
    ),
  ]),

  "seed-node-seed-track-ux-design-0": lo1("seed-node-seed-track-ux-design-0", [
    text(`## User Research & Personas

UX Design starts with understanding **real people** — not assumptions. Before writing a single line of code or drawing a single wireframe, you research who your users are and what they need.

### 🔬 Why Research First?

| Without Research | With Research |
|---|---|
| You build what YOU think users want | You build what users ACTUALLY need |
| Expensive rework later | Issues caught early, cheaply |
| Low adoption rates | High satisfaction & engagement |
| "This was obvious!" post-launch | "We knew this would work" |

### 🛠️ Research Methods

\`\`\`
QUALITATIVE (Why?)          QUANTITATIVE (How many?)
─────────────────────────   ────────────────────────
• User interviews           • Surveys / questionnaires
• Contextual inquiry        • Analytics (heatmaps)
• Focus groups              • A/B testing
• Usability tests           • Card sorting stats
\`\`\`

### 👤 What is a User Persona?

A **persona** is a semi-fictional character representing a key user segment. It's built from real research data — NOT invented.

\`\`\`
┌─────────────────────────────────────────────┐
│  📸  Amara Uwimana, 22                       │
│  🏫  L4 Software Development student        │
│                                             │
│  Goals:                                     │
│  ✦ Pass exams with practical projects       │
│  ✦ Find internship after graduation         │
│                                             │
│  Frustrations:                              │
│  ✗ Theory-heavy lessons with no practice   │
│  ✗ Resources hard to find offline          │
│                                             │
│  Quote:                                     │
│  "I learn best by building things, not      │
│   reading slides"                           │
└─────────────────────────────────────────────┘
\`\`\`

### Research Process

1. **Plan** → Define research questions ("What problems do students have finding study materials?")
2. **Recruit** → 5–8 users per persona is usually enough for interviews
3. **Conduct** → Interview, observe, record (with consent)
4. **Analyse** → Group findings into themes (affinity mapping)
5. **Synthesise** → Create personas from patterns, not from single users`),
    code("markdown", `# User Interview Template

## Participant: _______________  Date: ___________

## Warm-up (5 min)
1. Tell me about yourself and what you study.
2. How do you usually study for exams?

## Core Questions (20 min)
3. Walk me through the last time you looked for learning resources online.
   → What happened? What did you do first?

4. What's the most frustrating part of studying technical subjects?
   → Can you give me a specific example?

5. If you could change ONE thing about how you access study materials, what would it be?

## Wrap-up (5 min)
6. Is there anything else about studying or finding resources that I haven't asked about?

## Notes:
- Observe: body language, hesitation, enthusiasm
- Probe: "Can you tell me more?" "Why was that frustrating?"
- NEVER ask: "Would you use a feature that does X?" (leading!)`, "User interview guide template"),
    quiz("Which of the following is the BEST way to create an accurate user persona?",
      ["Invent a fictional user based on your own assumptions", "Base it on data collected from real user research", "Copy a persona from a competitor's product", "Ask your manager to describe the ideal user"],
      1, "Personas must be grounded in real research data — observations, interviews, and analytics. Invented personas lead to products that miss real user needs."),
    check(
      "I can explain the difference between qualitative and quantitative research",
      "I can write at least 5 open-ended interview questions for a given product",
      "I can construct a user persona from interview findings",
      "I understand why assumptions without research lead to poor UX",
    ),
  ]),

  "seed-node-seed-track-version-control-0": lo1("seed-node-seed-track-version-control-0", [
    text(`## Git Basics

**Git** is a distributed version control system. Think of it as a time machine for your code — every \`commit\` is a snapshot you can return to.

### 🔄 Why Version Control?

| Problem without Git | Git Solution |
|---|---|
| "final_v2_REAL_final.zip" | Meaningful commits with messages |
| Accidental file deletion | Restore any previous version |
| Team overwrites each other's code | Branching + merging |
| "What changed?" | \`git diff\` and \`git log\` |

### 📍 The Three States of Git

\`\`\`
   Working Directory      Staging Area       Repository
   ─────────────────    ───────────────    ─────────────
   Your files on disk   Files ready to     Committed
   (modified/untracked) be committed       snapshots

         │  git add .  │               │  git commit  │
         └────────────►┘               └─────────────►┘

   git status shows where each file is
\`\`\`

### 🔑 Essential Commands

| Command | What it does |
|---|---|
| \`git init\` | Initialise a new repo |
| \`git status\` | See what's changed |
| \`git add <file>\` | Stage a file |
| \`git add .\` | Stage all changes |
| \`git commit -m "message"\` | Save a snapshot |
| \`git log --oneline\` | View commit history |
| \`git diff\` | See unstaged changes |
| \`git restore <file>\` | Discard working changes |`),
    code("bash", `# ── Starting a new project ────────────────────────────
mkdir my-project && cd my-project
git init
# → Initialized empty Git repository in .git/

# ── Create a file and track it ─────────────────────────
echo "# My Project" > README.md
git status
# → Untracked files: README.md

git add README.md
git status
# → Changes to be committed: new file: README.md

git commit -m "Initial commit: add README"
# → [main (root-commit) a1b2c3d] Initial commit: add README

# ── Make a change ──────────────────────────────────────
echo "Made by RUNDA TSS" >> README.md
git diff               # see exactly what changed
git add .
git commit -m "docs: add author to README"

# ── View history ───────────────────────────────────────
git log --oneline
# → a4f1e2b docs: add author to README
# → a1b2c3d Initial commit: add README

# ── Undo a change before committing ───────────────────
git restore README.md  # discard working directory changes`, "Your first Git workflow"),
    quiz("What does `git add .` do?",
      ["Commits all changes with a message", "Stages all changes in the current directory for the next commit", "Pushes changes to GitHub", "Creates a new branch"],
      1, "git add stages changes — it moves them from the Working Directory to the Staging Area. You still need git commit to save the snapshot."),
    check(
      "I have installed Git and configured my name and email",
      "I can initialise a repo with git init",
      "I understand the difference between git add and git commit",
      "I can check the status of my repo with git status",
      "I can view commit history with git log --oneline",
    ),
  ]),

  "seed-node-seed-track-software-project-requirements-analysis-0": lo1("seed-node-seed-track-software-project-requirements-analysis-0", [
    text(`## Requirements Elicitation

Software fails most often not because of bad code — but because of **wrong requirements**. Requirements elicitation is the process of discovering what stakeholders actually need.

### 🎯 Types of Requirements

\`\`\`
Requirements
├── Functional (WHAT the system does)
│   ├── "User can register with email and password"
│   ├── "Admin can view all submitted assignments"
│   └── "System sends email confirmation on registration"
│
└── Non-Functional (HOW WELL the system works)
    ├── Performance  → "Page loads in < 2 seconds"
    ├── Security     → "Passwords stored as bcrypt hashes"
    ├── Usability    → "First-time user completes registration in < 3 min"
    └── Availability → "System uptime ≥ 99.5%"
\`\`\`

### 🛠️ Elicitation Techniques

| Technique | Best for | Output |
|---|---|---|
| **Interviews** | Deep understanding of user goals | Quotes, pain points |
| **Observation** | Watching how users work today | Workflow diagrams |
| **Workshops** | Aligning multiple stakeholders | Prioritised requirements list |
| **Questionnaires** | Large user groups | Statistical data |
| **Document analysis** | Replacing/improving existing systems | Current process understanding |
| **Prototyping** | Clarifying vague requirements | Visual mockup + feedback |

### 📋 The INVEST Criteria for Good User Stories

A requirement should be:
- **I**ndependent — not tied to another story
- **N**egotiable — open to discussion
- **V**aluable — delivers value to the user
- **E**stimable — team can roughly size it
- **S**mall — completable in one sprint
- **T**estable — clear acceptance criteria`),
    code("markdown", `# Requirements Document Template

## 1. Project Overview
**Project Name:** Student Learning Platform
**Version:** 1.0  **Date:** 2025-01-15
**Stakeholders:** Students, Trainers, Admin

---

## 2. Functional Requirements

### FR-001: User Registration
- **Description:** New users can create an account
- **Actor:** Unauthenticated visitor
- **Priority:** High (Must Have)
- **User Story:**
  As a new student,
  I want to register with my email and password
  So that I can access learning materials

- **Acceptance Criteria:**
  - [ ] Email must be unique in the system
  - [ ] Password must be minimum 8 characters
  - [ ] Confirmation email sent within 60 seconds
  - [ ] User redirected to dashboard after registration

---

## 3. Non-Functional Requirements

| ID | Category | Requirement | Priority |
|----|----------|-------------|----------|
| NFR-01 | Performance | Page load < 2s on 3G | High |
| NFR-02 | Security | HTTPS enforced everywhere | High |
| NFR-03 | Usability | WCAG 2.1 AA compliance | Medium |
| NFR-04 | Scalability | Support 1000 concurrent users | Medium |`, "Requirements document with user story and acceptance criteria"),
    quiz("What is the difference between a functional and non-functional requirement?",
      ["Functional requirements are more important than non-functional", "Functional requirements describe WHAT the system does; non-functional describe HOW WELL it does it", "Non-functional requirements are optional features", "Functional requirements are written by developers; non-functional by managers"],
      1, "Functional = features and behaviours (login, register, search). Non-functional = quality attributes (speed, security, accessibility). Both are equally critical to a successful system."),
    check(
      "I can identify functional vs non-functional requirements from a description",
      "I can write a user story in the format 'As a... I want... So that...'",
      "I can list at least 3 elicitation techniques",
      "I understand what INVEST criteria means for a user story",
    ),
  ]),

  // ══════════════════════════════════════════════════════════════════════════════
  // LEVEL 3 — GENERAL
  // ══════════════════════════════════════════════════════════════════════════════

  "seed-node-seed-track-apply-graphic-design-0": lo1("seed-node-seed-track-apply-graphic-design-0", [
    text(`## Design Principles

Great design is not about making things look pretty — it's about **communicating clearly** and **guiding attention**. These five principles are the foundation of all visual design.

### 🎨 The 5 Core Design Principles

| Principle | Definition | Example |
|---|---|---|
| **Contrast** | Differences that create visual interest and hierarchy | Dark text on light background |
| **Alignment** | Elements lined up to create order | Left-aligned text in a column |
| **Repetition** | Consistent use of colours, fonts, shapes | Same button style throughout |
| **Proximity** | Related items grouped together | Label next to its input field |
| **Balance** | Visual weight distributed harmoniously | Symmetric vs. asymmetric layouts |

### 🌈 Colour Theory Basics

\`\`\`
Colour Wheel Relationships:
───────────────────────────
Complementary    →  Opposite colours (high contrast)
                    Red ←──────────────────→ Green

Analogous        →  Adjacent colours (harmonious)
                    Blue → Blue-Green → Green

Triadic          →  3 equally-spaced colours (vibrant)
                    Red  ●──────●  Blue
                           ●
                          Yellow

Neutral Palette  →  Black + White + Greys + 1 accent
                    Used in most professional UIs
\`\`\`

### ✏️ Typography Hierarchy

\`\`\`
H1 — Page Title               (48–64px, Bold)
  H2 — Section Heading        (32–40px, Semi-Bold)
    H3 — Sub-section          (24–28px, Medium)
      Body Text               (16–18px, Regular)
        Caption / Label       (12–14px, Regular)
\`\`\`

> 💡 **Golden Rule:** Use a maximum of **2 typefaces** in a design. One for headings, one for body text. More than 2 looks chaotic.`),
    code("css", `/* ── Design system variables (CSS custom properties) ─── */
:root {
  /* Colour palette */
  --color-primary:    #6366f1;   /* Indigo — main brand */
  --color-secondary:  #38bdf8;   /* Sky — accent */
  --color-success:    #34d399;   /* Emerald */
  --color-danger:     #f87171;   /* Rose */
  --color-text:       #f1f5f9;   /* Near-white */
  --color-bg:         #0f172a;   /* Dark navy */
  --color-surface:    #1e293b;   /* Card background */

  /* Typography scale */
  --font-heading: 'Inter', sans-serif;
  --font-body:    'Inter', sans-serif;

  --text-xs:   0.75rem;    /* 12px */
  --text-sm:   0.875rem;   /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg:   1.125rem;   /* 18px */
  --text-xl:   1.25rem;    /* 20px */
  --text-2xl:  1.5rem;     /* 24px */
  --text-4xl:  2.25rem;    /* 36px */

  /* Spacing (multiples of 4px) */
  --space-1: 0.25rem;   /* 4px  */
  --space-2: 0.5rem;    /* 8px  */
  --space-4: 1rem;      /* 16px */
  --space-8: 2rem;      /* 32px */

  /* Border radius */
  --radius-sm:  0.375rem;
  --radius-md:  0.75rem;
  --radius-lg:  1rem;
  --radius-full: 9999px;
}`, "Professional design system with CSS custom properties"),
    quiz("Which design principle means that related elements should be placed near each other?",
      ["Contrast", "Alignment", "Proximity", "Balance"], 2,
      "Proximity: items that are related should be grouped close together. This reduces visual clutter and tells the viewer 'these things go together' without using words."),
    check(
      "I can name the 5 core design principles (CARP + Balance)",
      "I understand complementary, analogous and triadic colour relationships",
      "I can create a typographic hierarchy with at least 3 levels",
      "I have designed a simple layout applying all 5 principles",
    ),
  ]),

  "seed-node-seed-track-fundamental-algebra-and-trigonometry-0": lo1("seed-node-seed-track-fundamental-algebra-and-trigonometry-0", [
    text(`## Algebra Fundamentals

Algebra is the language of programming logic. When you write \`if (x > 5)\` or \`total = price * quantity\`, you are doing algebra.

### 📐 Key Algebraic Concepts

| Concept | Definition | Code equivalent |
|---|---|---|
| **Variable** | Symbol representing an unknown | \`let x = 5\` |
| **Expression** | Combination of variables & operators | \`2x + 3\` |
| **Equation** | Two expressions set equal | \`2x + 3 = 11\` |
| **Inequality** | Expression with <, >, ≤, ≥ | \`if (score >= 50)\` |
| **Function** | Maps input to output: f(x) | \`function f(x) { return 2*x + 3; }\` |

### 🔢 Solving Linear Equations — Step by Step

Solve: **3x + 7 = 22**

\`\`\`
Step 1:  Subtract 7 from both sides
         3x + 7 - 7 = 22 - 7
         3x = 15

Step 2:  Divide both sides by 3
         3x ÷ 3 = 15 ÷ 3
         x = 5

Verify:  3(5) + 7 = 15 + 7 = 22 ✓
\`\`\`

### 📊 Linear Functions

A linear function has the form **f(x) = mx + b**

| Variable | Meaning |
|---|---|
| **m** | Slope (rate of change — how steep) |
| **b** | Y-intercept (value when x = 0) |

\`\`\`
Graph of f(x) = 2x + 1:

f(x)
  7 │              ●  (3, 7)
  5 │         ●
  3 │    ●
  1 ●──────────────── x
    0    1    2    3
\`\`\`

> 💡 **Programming connection:** \`f(x) = mx + b\` is exactly the formula used in **linear interpolation** in animations, progress bars, and data normalisation!`),
    code("javascript", `// ── Algebra in JavaScript ─────────────────────────────

// Solve for x: 3x + 7 = 22
function solveLinear(a, b, c) {
  // ax + b = c  →  x = (c - b) / a
  return (c - b) / a;
}
console.log(solveLinear(3, 7, 22));  // → 5

// ── Linear function f(x) = mx + b ─────────────────────
function linearFn(m, b, x) {
  return m * x + b;
}
// Generate values for f(x) = 2x + 1
for (let x = 0; x <= 5; x++) {
  console.log(\`f(\${x}) = \${linearFn(2, 1, x)}\`);
}
// f(0) = 1,  f(1) = 3,  f(2) = 5,  f(3) = 7

// ── Practical: linear interpolation (lerp) ────────────
// Used in animations to smoothly move between two values
function lerp(start, end, t) {
  return start + (end - start) * t;
}
console.log(lerp(0, 100, 0.5));  // → 50  (midpoint)
console.log(lerp(0, 100, 0.25)); // → 25  (quarter)`, "Algebra applied in JavaScript programming"),
    quiz("In the linear function f(x) = 3x + 5, what is the slope?",
      ["5", "3", "x", "8"], 1,
      "The slope is m = 3 (the coefficient of x). It means for every 1 unit increase in x, f(x) increases by 3 units. The y-intercept is b = 5."),
    check(
      "I can solve a linear equation with one unknown",
      "I can identify the slope and y-intercept in f(x) = mx + b",
      "I can translate an algebraic expression into JavaScript code",
      "I have calculated at least 5 values of a linear function and plotted them",
    ),
  ]),

  "seed-node-seed-track-apply-general-physics-0": lo1("seed-node-seed-track-apply-general-physics-0", [
    text(`## Electricity & Circuits

Understanding electricity is essential for ICT — every computer, network switch, and sensor runs on electrical circuits.

### ⚡ Ohm's Law — The Fundamental Relationship

**V = I × R**

| Symbol | Quantity | Unit |
|---|---|---|
| **V** | Voltage (electrical pressure) | Volts (V) |
| **I** | Current (flow of charge) | Amperes (A) |
| **R** | Resistance (opposition to flow) | Ohms (Ω) |

\`\`\`
           Voltage (V)
              ┌───┐
              │ V │
           ───┴───┴───
          │     =     │
      ┌───┴───┐   ┌───┴───┐
      │   I   │   │   R   │
      └───────┘   └───────┘
      Current     Resistance
\`\`\`

### 🔋 Series vs Parallel Circuits

\`\`\`
SERIES Circuit:             PARALLEL Circuit:
──────────────              ─────────────────
+──[R1]──[R2]──-           +──┬──[R1]──┬──-
                                │         │
One path for current        ├──[R2]──┤
                                │         │
R_total = R1 + R2           └──[R3]──┘
If one resistor fails,
ALL fail (old Xmas lights)  1/R_total = 1/R1 + 1/R2 + 1/R3

                            If one fails, others work
                            (household wiring)
\`\`\`

| Property | Series | Parallel |
|---|---|---|
| Current | Same through all | Splits between branches |
| Voltage | Splits between components | Same across all |
| Total Resistance | R1 + R2 + ... | Less than smallest R |
| Failure | One fails = all fail | One fails = others work |`),
    code("javascript", `// ── Ohm's Law Calculator ──────────────────────────────

function ohmsLaw({ voltage, current, resistance }) {
  if (voltage   == null) return { voltage:     current * resistance };
  if (current   == null) return { current:     voltage / resistance };
  if (resistance == null) return { resistance: voltage / current };
  throw new Error('Provide exactly 2 of the 3 values');
}

// Find voltage: I=2A, R=5Ω
console.log(ohmsLaw({ current: 2, resistance: 5 }));
// → { voltage: 10 }

// Find resistance: V=12V, I=0.5A
console.log(ohmsLaw({ voltage: 12, current: 0.5 }));
// → { resistance: 24 }

// ── Power formula: P = V × I ──────────────────────────
function power(voltage, current) {
  return voltage * current;  // Watts
}
console.log(power(5, 0.5));  // → 2.5 Watts (typical USB device)
console.log(power(230, 4));  // → 920 Watts (laptop charger, mains)`, "Ohm's Law implemented as a JavaScript calculator"),
    quiz("A circuit has a voltage of 12V and a resistance of 4Ω. What is the current?",
      ["48A", "3A", "0.33A", "8A"], 1,
      "I = V/R = 12/4 = 3A. Ohm's Law: current equals voltage divided by resistance."),
    check(
      "I can state Ohm's Law and write it as a formula",
      "I can calculate any one of V, I or R when given the other two",
      "I can describe the difference between series and parallel circuits",
      "I understand why household wiring uses parallel circuits",
    ),
  ]),

  // ══════════════════════════════════════════════════════════════════════════════
  // LEVEL 3 — CCM (condensed but real)
  // ══════════════════════════════════════════════════════════════════════════════

  "seed-node-seed-track-entrepreneurship-l3-0": lo1("seed-node-seed-track-entrepreneurship-l3-0", [
    text(`## Business Idea Generation

Every successful business starts with a problem worth solving. Entrepreneurship is the art of finding those problems and creating sustainable solutions.

### 💡 Where Good Ideas Come From

\`\`\`
Sources of Business Ideas:
─────────────────────────
  🔍 Pain Points    →  "This is so frustrating!"
  📈 Market Gaps    →  "Nobody does this here"
  🔄 Improvements   →  "What if this was easier?"
  🌍 Global Trends  →  Apply elsewhere locally
  🎓 Your Skills    →  What can YOU do better?
\`\`\`

### 🧪 Idea Validation Framework (LEAN approach)

| Step | Question | How |
|---|---|---|
| **Problem** | Does the problem really exist? | Interview 10+ potential customers |
| **Solution** | Does YOUR solution solve it? | Build a prototype or MVP |
| **Market** | Are enough people willing to pay? | Survey, pre-orders, landing page |
| **Business Model** | How do you make money? | Revenue model canvas |

### 💎 Business Model Canvas (Simplified)

\`\`\`
┌─────────────┬──────────────┬──────────────┬──────────────┐
│  Key        │  Key         │  Value       │  Customer    │
│  Partners   │  Activities  │  Proposition │  Segments    │
├─────────────┼──────────────┤              ├──────────────┤
│  Key        │  Key         │              │  Customer    │
│  Resources  │  Resources   │              │  Channels    │
├─────────────┴──────────────┴──────────────┴──────────────┤
│  Cost Structure           │  Revenue Streams              │
└──────────────────────────┴───────────────────────────────┘
\`\`\``),
    quiz("What is the MOST important first step before developing a business idea?",
      ["Build the product immediately", "Validate that the problem actually exists for real people", "Register the company name", "Design a logo"],
      1, "Validation first — building before validating is the #1 reason startups fail. Interview potential customers before writing a single line of code."),
    check("I can identify 3 sources of business ideas", "I have interviewed at least 2 people about a problem I want to solve", "I can fill in a basic Business Model Canvas"),
  ]),

  "seed-node-seed-track-ict-l3-0": lo1("seed-node-seed-track-ict-l3-0", [
    text(`## Digital Tools & Productivity

Effective use of digital tools makes you faster, more organised, and more professional.

### 🖥️ Essential ICT Tools for Students

| Category | Tool examples | Used for |
|---|---|---|
| **Word Processing** | Google Docs, MS Word | Reports, assignments |
| **Spreadsheets** | Google Sheets, MS Excel | Data, calculations |
| **Presentations** | Google Slides, PowerPoint | Class presentations |
| **Communication** | Gmail, Slack, WhatsApp | Team collaboration |
| **Cloud Storage** | Google Drive, OneDrive | Backup, sharing |
| **Version Control** | GitHub | Code collaboration |
| **Note-taking** | Notion, Obsidian | Organise knowledge |

### 📧 Professional Email Structure

\`\`\`
Subject:  [Clear, specific]  e.g., "Assignment 3 Submission — Web Dev L3"

Body:
  Greeting:    "Dear Mr. Niyonzima,"
  Opening:     State your purpose in the first sentence
  Details:     Provide necessary context, be concise
  Action:      What do you need? Be specific
  Closing:     "Thank you for your time."
  Sign-off:    "Best regards, [Your Name] — L3 Software Dev"

Attachment:   Named clearly: "Assignment3_WebDev_AmaraUwimana.pdf"
\`\`\``),
    quiz("Which tool is BEST for real-time collaborative document editing with your team?",
      ["USB flash drive", "Google Docs", "Printing and scanning", "Email attachments"], 1,
      "Google Docs enables multiple people to edit simultaneously, see changes in real-time, and maintain version history — essential for team projects."),
    check("I can create, format and share a document using Google Docs or MS Word", "I know how to write a professional email", "I have set up and used Google Drive or similar cloud storage"),
  ]),

  "seed-node-seed-track-citizenship-l3-0": lo1("seed-node-seed-track-citizenship-l3-0", [
    text(`## Civic Rights & Responsibilities

Being a responsible citizen means both knowing your rights and fulfilling your duties to your community and nation.

### 🇷🇼 Rights & Responsibilities in Rwanda

| Rights (What you are entitled to) | Responsibilities (What you owe) |
|---|---|
| Free primary education | Attend and value education |
| Freedom of expression | Use speech responsibly |
| Access to justice | Respect others' rights |
| Right to work | Pay taxes, contribute to society |
| Healthcare access | Healthy lifestyle, help community |

### 🏛️ Three Branches of Government

\`\`\`
  LEGISLATURE (Parliament)
  ─────────────────────
  Makes laws (Parliament of Rwanda)

  EXECUTIVE (President + Cabinet)
  ─────────────────────────────
  Implements laws, runs government

  JUDICIARY (Courts)
  ──────────────────
  Interprets laws, administers justice
\`\`\`

> 💡 **Why does ICT connect to citizenship?** Tech professionals build the digital infrastructure of the country. Ethical coding, digital privacy, and accessible design are all citizenship responsibilities.`),
    quiz("Which branch of government is responsible for making laws?",
      ["Judiciary", "Executive", "Legislature", "Police"], 2,
      "The Legislature (Parliament) makes laws. The Executive implements them and the Judiciary interprets them. This separation of powers prevents abuse."),
    check("I can list 3 fundamental rights of Rwandan citizens", "I can name the 3 branches of government and their roles", "I understand how technology connects to civic responsibility"),
  ]),

  "seed-node-seed-track-english-l3-0": lo1("seed-node-seed-track-english-l3-0", [
    text(`## Reading Comprehension in English

Strong reading comprehension is the foundation of all learning. In tech, you will read documentation, error messages, and textbooks in English every day.

### 📖 Active Reading Strategy (SQ3R)

\`\`\`
S → Survey     Skim headings, images, summary (2 min)
Q → Question   Turn headings into questions: "What is..."
R → Read       Read actively, looking for answers
R → Recite     Close the text, say answers in own words
R → Review     Re-read to check and fill gaps
\`\`\`

### 🔑 Vocabulary in Context

When you encounter an unknown word:
1. **Context clues** — What do surrounding sentences suggest?
2. **Root words** — \`tele-\` (far) + \`-com-\` + \`-munication\` = communication from far
3. **Inference** — Make your best educated guess
4. **Dictionary** — Verify and note the definition

| Prefix/Root | Meaning | Example |
|---|---|---|
| cyber- | computer/digital | cybersecurity |
| -ware | item/product | software, hardware |
| inter- | between | internet, interface |
| proto- | first | protocol, prototype |
| -ology | study of | technology |`),
    quiz("What does the 'Q' step in SQ3R mean?",
      ["Quickly skim the text", "Turn headings into questions before reading", "Quote key sentences", "Quiz yourself after reading"], 1,
      "Q = Question. Before reading, turn each heading into a question (e.g., 'HTML Structure' becomes 'What is HTML structure?'). This gives your brain a purpose while reading."),
    check("I can apply the SQ3R strategy to a technical text", "I can use context clues to understand unfamiliar vocabulary", "I can identify the main idea and supporting details in a paragraph"),
  ]),

  "seed-node-seed-track-fran-ais-l3-0": lo1("seed-node-seed-track-fran-ais-l3-0", [
    text(`## Compréhension écrite en français

La lecture en français vous permet d'accéder à une vaste quantité de ressources professionnelles et académiques.

### 📚 Stratégies de lecture

| Stratégie | Description | Quand l'utiliser |
|---|---|---|
| **Écrémage** (Skimming) | Lire rapidement pour l'idée générale | Avant une lecture détaillée |
| **Repérage** (Scanning) | Chercher une information spécifique | Trouver un fait précis |
| **Lecture intensive** | Lire lentement et attentivement | Textes techniques, contrats |

### 🔤 Vocabulaire technique clé

| Français | English | Contexte |
|---|---|---|
| logiciel | software | "J'installe un logiciel" |
| matériel | hardware | "Le matériel informatique" |
| réseau | network | "Connecté au réseau" |
| développeur | developer | "Je suis développeur" |
| base de données | database | "Gérer une base de données" |`),
    quiz("Quelle stratégie de lecture utilisez-vous pour trouver rapidement une information spécifique?",
      ["L'écrémage", "Le repérage (scanning)", "La lecture intensive", "La prise de notes"], 1,
      "Le repérage (scanning) consiste à parcourir le texte pour trouver une information précise sans tout lire. Par exemple, chercher une date ou un nom."),
    check("Je peux utiliser les 3 stratégies de lecture", "Je connais au moins 10 mots de vocabulaire technique en français", "Je peux comprendre un texte court sur l'informatique en français"),
  ]),

  "seed-node-seed-track-safety-health-and-environment-l3-0": lo1("seed-node-seed-track-safety-health-and-environment-l3-0", [
    text(`## Workplace Safety in ICT

ICT professionals spend hours at computers. Ignoring ergonomics and safety leads to real, long-term injuries.

### 🪑 Ergonomic Workstation Setup

\`\`\`
                        Monitor at eye level
                        ┌─────────────┐
                        │   Screen    │  ← 50–70cm away
                        └─────────────┘
                              │
Eyes level ──────────────────►│ Top of screen
                              │
Wrists straight ─────────────►│▌▌▌ keyboard flat
Back supported ──────────────►│
Feet flat on floor ──────────►│
90° at elbows/hips/knees ────►│
\`\`\`

### ⚠️ Common ICT Workplace Hazards

| Hazard | Risk | Prevention |
|---|---|---|
| Poor posture | Back/neck pain | Ergonomic chair, breaks |
| Repetitive strain | RSI (wrist, fingers) | Wrist rests, keyboard shortcuts |
| Eye strain | Headaches, blurred vision | 20-20-20 rule, monitor settings |
| Cables on floor | Tripping | Cable management, covers |
| Overloaded sockets | Electrical fire | Surge protectors, correct load |
| Bright screen in dark | Eye damage | Match ambient light |

### 👁️ The 20-20-20 Rule
Every **20 minutes**, look at something **20 feet (6m) away** for **20 seconds**.`),
    quiz("What is the correct height for a monitor in an ergonomic workstation?",
      ["Below desk level", "At eye level — top of screen at eye height", "As high as possible", "Does not matter as long as screen is visible"], 1,
      "Eye level means the TOP of the screen aligns with your eyes. This keeps your neck neutral — looking down causes cervical strain over time."),
    check("I can set up an ergonomic workstation", "I understand the 20-20-20 rule and apply it", "I can identify at least 4 ICT workplace hazards and their prevention"),
  ]),

  "seed-node-seed-track-ikinyarwanda-kiboneye-l3-0": lo1("seed-node-seed-track-ikinyarwanda-kiboneye-l3-0", [
    text(`## Umuvugo n'Inyandiko y'Akazi

Ikinyarwanda cy'intyoza kigaragaza ubwenge no kwita ku kazi kawe.

### 📝 Inyandiko Ngezaho

| Ubwoko bw'Inyandiko | Ikoreshwa | Urugero |
|---|---|---|
| **Raporo** | Gutanga amakuru | Raporo y'akazi, raporo y'isuzuma |
| **Ibaruwa** | Gutumanahana mu buryo bw'imikorere | Ibaruwa isaba akazi |
| **Umwanzuro** | Gusozera raporo cyangwa igenamigambi | Umwanzuro w'igenamigambi |

### ✍️ Imiterere y'Ibaruwa

\`\`\`
Aho ibaruwa yandikiwe: Kigali, kuwa 15 Mutarama 2025

Uwo ibaruwa yandikiwe:
  Umuyobozi w'Ishuri RUNDA TSS
  B.P. 1234 Kigali

Inshuti / Bwana:

  Umutwe: [Icyo uandikira]

  Inyandiko y'ibaruwa...

  Murakoze kandi nimutinyuke.

  Nyir'ibaruwa,
  [Amazina yawe]
\`\`\``),
    quiz("Ni ikihe kigize impande y'ibaruwa y'imikorere?",
      ["Amazina gusa", "Aho ibaruwa yandikiwe, uwo yandikiwe, umutwe, inyandiko, no gusozera", "Ifoto n'amazina", "Igihangange n'intego"], 1,
      "Ibaruwa y'imikorere igizwe n'impande eshatu: aho yandikiwe (aderesi n'italiki), inyandiko ubwayo, no gusozera neza."),
    check("Nshoboye kwandika ibaruwa igizwe n'impande zose", "Nzi ubwoko butatu bw'inyandiko zo mu kazi", "Nshoboye gukoresha Ikinyarwanda kiboneye mu nyandiko"),
  ]),

  "seed-node-seed-track-occupation-and-learning-process-l3-0": lo1("seed-node-seed-track-occupation-and-learning-process-l3-0", [
    text(`## Learning Strategies for Technical Subjects

How you learn is as important as what you learn. Research shows that certain strategies lead to much deeper understanding.

### 🧠 Evidence-Based Learning Strategies

| Strategy | How it works | Effectiveness |
|---|---|---|
| **Spaced repetition** | Review material at increasing intervals | ★★★★★ Very high |
| **Active recall** | Test yourself instead of re-reading | ★★★★★ Very high |
| **Interleaving** | Mix different topics/problems | ★★★★ High |
| **Elaborative interrogation** | Ask "why" and "how" constantly | ★★★★ High |
| **Re-reading notes** | Read same material repeatedly | ★★ Low |
| **Highlighting** | Mark text without actively engaging | ★ Very low |

### 📅 Spaced Repetition Schedule

\`\`\`
Day 1:    Learn new topic     ████████████ 100% retention
Day 2:    Review              ████████████
Day 7:    Review              ████████████
Day 21:   Review              ████████████
Day 60:   Review              ████████████
                              Long-term memory formed!
\`\`\`

> 💡 **Most students re-read and highlight**. These feel productive but produce little retention. Use flashcards (Anki), teach someone else, or do practice problems instead.`),
    quiz("According to research, which learning strategy is MOST effective?",
      ["Re-reading your notes", "Highlighting important sentences", "Testing yourself with active recall", "Making detailed summaries"], 2,
      "Active recall (retrieving information from memory) consistently outperforms passive review. When you force your brain to retrieve something, it strengthens the neural pathway."),
    check("I can name 3 high-effectiveness learning strategies", "I have set up a spaced repetition system (e.g., Anki)", "I spend more time on active recall than re-reading"),
  ]),

  "seed-node-seed-track-industrial-attachment-program-l3-0": lo1("seed-node-seed-track-industrial-attachment-program-l3-0", [
    text(`## Workplace Readiness

Industrial attachment (internship) is your bridge from student to professional. First impressions in the workplace are permanent.

### 👔 Professional Conduct Standards

| Aspect | Student Mindset | Professional Mindset |
|---|---|---|
| **Time** | Arrive just in time | Arrive 5–10 min early |
| **Phone** | Freely | Silent, put away in meetings |
| **Dress** | Casual | Follow company dress code |
| **Communication** | Informal | Clear, respectful, formal when needed |
| **Mistakes** | Hide them | Own them, fix them, learn |
| **Questions** | Only when forced | Ask proactively, research first |

### 📋 First Week Checklist

\`\`\`
Before Day 1:
  ☐ Research the company — know their products/services
  ☐ Confirm start time, dress code, who to ask for
  ☐ Prepare notebook and pen
  ☐ Sleep well the night before

Week 1:
  ☐ Learn everyone's names and roles
  ☐ Ask: "How can I be most helpful?"
  ☐ Observe more than you speak
  ☐ Start an attachment journal (daily reflection)
  ☐ Ask for feedback at end of week 1
\`\`\``),
    quiz("What is the BEST approach when you make a mistake during your industrial attachment?",
      ["Hide the mistake and hope nobody notices", "Blame the unclear instructions you received", "Own the mistake, report it honestly, and ask how to fix it", "Immediately resign to save face"], 2,
      "Owning your mistakes demonstrates professional maturity. Every employer knows trainees make mistakes — they're watching HOW you handle them. Hiding mistakes destroys trust permanently."),
    check("I can dress and behave professionally in a workplace", "I know what to prepare before Day 1 of my attachment", "I have started an attachment journal for daily reflection"),
  ]),

  // ══════════════════════════════════════════════════════════════════════════════
  // LEVEL 4 — SPECIFIC
  // ══════════════════════════════════════════════════════════════════════════════

  // swdbd401 already seeded in learnContent.ts, but we update it here too
  "seed-node-seed-track-backend-application-development-0": lo1("seed-node-seed-track-backend-application-development-0", [
    text(`## Node.js Environment Setup

Node.js brings JavaScript to the server. Before building any API, you need a properly configured development environment.

### 🏗️ The Node.js Ecosystem

\`\`\`
Your Machine
└── Node.js Runtime (V8 engine)
    └── NPM (Node Package Manager)
        ├── package.json      ← project manifest
        ├── node_modules/     ← installed dependencies
        └── package-lock.json ← exact versions locked

Your Project
└── server.js               ← entry point
    ├── routes/              ← API endpoints
    ├── controllers/         ← business logic
    ├── models/              ← database models
    └── middleware/          ← auth, logging, etc.
\`\`\`

### 🔧 Core Technologies in SWDBD401

| Tool | Role | Install |
|---|---|---|
| **Node.js** | JavaScript runtime | nodejs.org |
| **NPM** | Package manager | Bundled with Node |
| **Express.js** | Web framework | \`npm install express\` |
| **Nodemon** | Auto-restart server | \`npm install -D nodemon\` |
| **MySQL2** | Database driver | \`npm install mysql2\` |
| **dotenv** | Environment vars | \`npm install dotenv\` |
| **Postman** | API testing | postman.com |

### 📁 Professional Folder Structure

\`\`\`
backend-api/
├── src/
│   ├── routes/          ← route definitions
│   ├── controllers/     ← request handlers
│   ├── models/          ← DB queries
│   └── middleware/      ← auth, validation
├── .env                 ← secrets (never commit!)
├── .gitignore
├── package.json
└── server.js            ← entry point
\`\`\``),
    code("bash", `# ── Complete environment setup ─────────────────────────

# 1. Verify installations
node --version        # Should be v18+ or v20+
npm --version         # Should be 9+

# 2. Create project
mkdir backend-api && cd backend-api
npm init -y           # Creates package.json

# 3. Install core dependencies
npm install express mysql2 dotenv cors

# 4. Install dev dependencies
npm install --save-dev nodemon

# 5. Update package.json scripts
# Add to "scripts" in package.json:
#   "start":  "node src/server.js"
#   "dev":    "nodemon src/server.js"

# 6. Create .gitignore
echo "node_modules
.env
.DS_Store" > .gitignore

# 7. Start dev server
npm run dev`, "Complete Node.js project setup"),
    code("javascript", `// src/server.js — Entry point
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────
app.use(cors());                // Allow cross-origin requests
app.use(express.json());        // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse form data

// ── Routes ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'Backend API is running! 🚀',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ── Error handler (must be last) ──────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ── Start server ───────────────────────────────────────
app.listen(PORT, () => {
  console.log(\`✅ Server running on http://localhost:\${PORT}\`);
});`, "Minimal Express server with middleware"),
    quiz("What is the purpose of the `dotenv` package in a Node.js project?",
      ["It speeds up the server by caching database queries", "It loads environment variables from a .env file into process.env", "It validates API request data", "It provides a GUI for managing packages"],
      1, "dotenv reads key=value pairs from a .env file and makes them available as process.env.KEY. This keeps secrets (passwords, API keys) out of your source code."),
    check(
      "I have installed Node.js v18+ and verified with node --version",
      "I can create a new project with npm init and install dependencies",
      "I have created a basic Express server that responds on port 3000",
      "I understand why node_modules and .env must be in .gitignore",
    ),
  ]),

  "seed-node-seed-track-backend-system-design-0": lo1("seed-node-seed-track-backend-system-design-0", [
    text(`## MVC Architecture

**Model-View-Controller** is the most widely used architectural pattern for web backends. It separates concerns so your code stays maintainable as it grows.

### 🏛️ MVC — Who Does What?

\`\`\`
HTTP Request
    │
    ▼
┌──────────┐
│  ROUTE   │  → Directs traffic:  POST /api/products
└──────────┘
    │
    ▼
┌──────────────┐
│  CONTROLLER  │  → Business logic: validate input,
└──────────────┘    call model, format response
    │
    ▼
┌───────┐
│ MODEL │  → Database layer: SQL queries
└───────┘
    │
    ▼
 Database
\`\`\`

### 📊 Separation of Concerns

| Layer | Responsibility | Never does |
|---|---|---|
| **Route** | URL mapping + HTTP method | Business logic |
| **Controller** | Input validation, orchestration | SQL queries |
| **Model** | Database CRUD operations | HTTP response formatting |

> 💡 If your controller contains SQL, or your model formats HTTP responses — your architecture is broken. Each layer should do ONE thing.

### Benefits of MVC

| Benefit | Why it matters |
|---|---|
| **Testability** | Test each layer independently |
| **Maintainability** | Change DB without touching routes |
| **Readability** | New developers understand structure instantly |
| **Reusability** | Same model used by API, CLI, background jobs |`),
    code("javascript", `// ── routes/products.js ────────────────────────────────
const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/productController');
const auth       = require('../middleware/auth');

// Route layer: URL + method only
router.get   ('/',     controller.getAll);
router.get   ('/:id',  controller.getOne);
router.post  ('/',     auth, controller.create);
router.put   ('/:id',  auth, controller.update);
router.delete('/:id',  auth, controller.remove);

module.exports = router;

// ── controllers/productController.js ──────────────────
const Product = require('../models/Product');

exports.getAll = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const { name, price, quantity } = req.body;
  if (!name || !price) {
    return res.status(400).json({ error: 'name and price required' });
  }
  const product = await Product.create({ name, price, quantity });
  res.status(201).json(product);
};

// ── models/Product.js ──────────────────────────────────
const db = require('../db');

const Product = {
  findAll: () => db.query('SELECT * FROM products'),

  create: ({ name, price, quantity }) =>
    db.query(
      'INSERT INTO products (name, price, quantity) VALUES (?, ?, ?)',
      [name, price, quantity ?? 0]
    ),
};
module.exports = Product;`, "Complete MVC pattern — routes, controller, model"),
    quiz("In MVC architecture, which layer is responsible for executing database queries?",
      ["Route", "Controller", "Model", "Middleware"], 2,
      "The Model layer owns all database interactions. Controllers call the Model's methods but never write SQL directly. This makes swapping databases much easier."),
    check(
      "I can explain what each MVC layer does",
      "I can create separate files for routes, controllers and models",
      "I have built at least one endpoint using the MVC pattern",
      "I understand why mixing SQL in controllers is an anti-pattern",
    ),
  ]),

  "seed-node-seed-track-data-structure-and-algorithm-fundamentals-0": lo1("seed-node-seed-track-data-structure-and-algorithm-fundamentals-0", [
    text(`## Algorithm Complexity — Big-O Notation

Before choosing an algorithm, you must understand how it **scales**. Big-O notation describes how performance changes as input size (n) grows.

### 📈 The Big-O Hierarchy

\`\`\`
Performance (fast → slow as n grows):

O(1)        Constant    ──────────────────────────── ← fastest
O(log n)    Logarithmic ────────────── ↗
O(n)        Linear      ───────────── ↗↗
O(n log n)  Linearithmic ──────────  ↗↗↗
O(n²)       Quadratic    ─────────  ↗↗↗↗
O(2^n)      Exponential  ────────  ↗↗↗↗↗↗ ← slowest

Input size n:  10    100    1,000    1,000,000
─────────────────────────────────────────────
O(1)            1      1        1            1
O(log n)        3      7       10           20
O(n)           10    100    1,000    1,000,000
O(n²)         100  10,000 1,000,000       ∞ 💀
\`\`\`

### 🔍 Identifying Complexity

| Pattern | Complexity | Example |
|---|---|---|
| One operation regardless of input | O(1) | Array index access: \`arr[5]\` |
| Halving input each time | O(log n) | Binary search |
| One loop over all items | O(n) | Find max value in array |
| Loop inside a loop | O(n²) | Bubble sort |
| Recursive with branching | O(2^n) | Naive Fibonacci |

### ✋ Why It Matters in Practice

| n = 1 million | O(n) | O(n²) |
|---|---|---|
| Time at 10⁸ ops/sec | **0.01 sec** | **2.78 hours** 💀 |`),
    code("javascript", `// ── O(1) — Constant time ──────────────────────────────
function getFirst(arr) {
  return arr[0];  // Always 1 operation, regardless of arr.length
}

// ── O(n) — Linear time ─────────────────────────────────
function findMax(arr) {
  let max = arr[0];
  for (const item of arr) {   // n iterations
    if (item > max) max = item;
  }
  return max;
}

// ── O(n²) — Quadratic time ─────────────────────────────
function hasDuplicates(arr) {
  for (let i = 0; i < arr.length; i++) {       // n
    for (let j = i + 1; j < arr.length; j++) { // n
      if (arr[i] === arr[j]) return true;       // n × n = n²
    }
  }
  return false;
}

// ── O(n) alternative using Set ─────────────────────────
function hasDuplicatesFast(arr) {
  const seen = new Set();
  for (const item of arr) {          // n iterations
    if (seen.has(item)) return true; // O(1) lookup
    seen.add(item);
  }
  return false;
}

// Benchmark: 10,000 items
const arr = Array.from({ length: 10000 }, (_, i) => i);
console.time('O(n²)'); hasDuplicates(arr);     console.timeEnd('O(n²)');
console.time('O(n)');  hasDuplicatesFast(arr); console.timeEnd('O(n)');`, "O(1), O(n) and O(n²) side by side"),
    quiz("What is the Big-O complexity of accessing an element by index in an array (e.g., arr[500])?",
      ["O(n)", "O(log n)", "O(1)", "O(n²)"], 2,
      "Array index access is O(1) — constant time. The computer calculates the memory address directly (base + index × size), regardless of array length."),
    check(
      "I can explain O(1), O(n), O(n²) and O(log n) in plain English",
      "I can identify the Big-O complexity of a simple function by reading its code",
      "I understand why O(n²) algorithms are dangerous for large inputs",
      "I have rewritten an O(n²) solution as an O(n) solution",
    ),
  ]),

  "seed-node-seed-track-database-development-0": lo1("seed-node-seed-track-database-development-0", [
    text(`## ERD & Database Requirements Analysis

Before writing a single SQL statement, you must understand your data. Entity-Relationship Diagrams (ERDs) are the blueprint for your database.

### 🏗️ Key ERD Concepts

| Concept | Definition | Example |
|---|---|---|
| **Entity** | Real-world object to store data about | Student, Course, Grade |
| **Attribute** | Property of an entity | name, email, enrollDate |
| **Primary Key (PK)** | Unique identifier for each row | student_id |
| **Foreign Key (FK)** | Links to another table's PK | course_id in Enrollments |
| **Relationship** | How entities connect | Student ENROLLS IN Course |

### 🔗 Relationship Cardinality

\`\`\`
One-to-One (1:1):
  Student ──────── StudentProfile
  (one student has exactly one profile)

One-to-Many (1:N):
  Trainer ──────── Lesson ──── Lesson ──── Lesson
  (one trainer writes many lessons)

Many-to-Many (M:N):
  Student ─── Enrollment ─── Course
  (students enroll in many courses;
   courses have many students)
  → Needs a junction table!
\`\`\`

### 📊 Sample ERD: Learning Platform

\`\`\`
┌─────────────┐        ┌──────────────┐        ┌──────────────┐
│   Student   │        │  Enrollment  │        │    Course    │
├─────────────┤        ├──────────────┤        ├──────────────┤
│ PK id       │──1────N│ FK student_id│N─────1─│ PK id        │
│    name     │        │ FK course_id │        │    title     │
│    email    │        │    grade     │        │    credits   │
│    level    │        │    date      │        │    tier      │
└─────────────┘        └──────────────┘        └──────────────┘
\`\`\``),
    code("sql", `-- ── Step 1: Create the database ──────────────────────
CREATE DATABASE learning_platform;
USE learning_platform;

-- ── Step 2: Create tables with constraints ─────────────
CREATE TABLE students (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(100) UNIQUE NOT NULL,
  level       ENUM('l3', 'l4', 'l5') NOT NULL,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE courses (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  code    VARCHAR(20) UNIQUE NOT NULL,  -- e.g. SWDBD401
  title   VARCHAR(200) NOT NULL,
  credits INT DEFAULT 0,
  tier    ENUM('l3', 'l4', 'l5') NOT NULL
);

-- ── Junction table for M:N relationship ───────────────
CREATE TABLE enrollments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id  INT NOT NULL,
  grade      DECIMAL(5,2),
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id)  REFERENCES courses(id)  ON DELETE CASCADE,
  UNIQUE KEY uq_enrollment (student_id, course_id)  -- no duplicate enrollments
);

-- ── Test data ──────────────────────────────────────────
INSERT INTO students (name, email, level) VALUES
  ('Amara Uwimana', 'amara@runda.edu', 'l4'),
  ('Patrick Nzeyimana', 'patrick@runda.edu', 'l4');

INSERT INTO courses (code, title, credits, tier) VALUES
  ('SWDBD401', 'Backend Application Development', 10, 'l4'),
  ('SWDDD401', 'Database Development', 10, 'l4');`, "Complete database schema with ERD relationships"),
    quiz("What type of table is needed to represent a many-to-many (M:N) relationship in SQL?",
      ["A view", "A junction (bridge) table with two foreign keys", "A second primary key column", "A UNION of two tables"], 1,
      "M:N relationships require a junction table (also called bridge or associative table). It holds foreign keys to both sides of the relationship and can store relationship-specific data like grade or enrollment date."),
    check(
      "I can identify entities, attributes and relationships from a real-world scenario",
      "I can classify a relationship as 1:1, 1:N or M:N",
      "I can draw an ERD for a simple system (3–5 entities)",
      "I can create a junction table in SQL for an M:N relationship",
    ),
  ]),

  "seed-node-seed-track-php-programming-0": lo1("seed-node-seed-track-php-programming-0", [
    text(`## PHP Syntax & Basics

PHP (Hypertext Preprocessor) is a server-side language that has powered over 75% of all websites (including WordPress, Facebook's early version, and Wikipedia).

### 🐘 PHP in the Web Stack

\`\`\`
Browser          Web Server (Apache/Nginx)     Database
───────          ─────────────────────────     ────────
  │    HTTP GET  │                             │
  │─────────────►│  1. Receives request        │
  │              │  2. Runs PHP script         │
  │              │  3. PHP queries DB──────────►│
  │              │  4. DB returns data◄─────────│
  │              │  5. PHP builds HTML         │
  │◄─────────────│  6. Sends HTML to browser   │
  │   HTML page  │                             │
\`\`\`

### 📋 PHP Syntax Essentials

| Concept | PHP syntax | JavaScript equivalent |
|---|---|---|
| Variable | \`$name = "Alice";\` | \`const name = "Alice";\` |
| String concat | \`$a . $b\` | \`a + b\` |
| Array | \`$arr = [1, 2, 3];\` | \`const arr = [1, 2, 3];\` |
| Assoc array | \`["key" => "value"]\` | \`{ key: "value" }\` |
| Print | \`echo "Hello";\` | \`console.log("Hello")\` |
| String in string | \`"Hello $name"\` | \`\\\`Hello \${name}\\\`\` |
| Null check | \`isset($var)\` | \`variable !== undefined\` |`),
    code("php", `<?php
// ── Variables & types ──────────────────────────────────
$name     = "RUNDA TSS";       // string
$students = 45;                // integer
$passMark = 60.5;              // float
$isOpen   = true;              // boolean
$nothing  = null;              // null

// ── String operations ──────────────────────────────────
echo "School: " . $name . "\n";          // concatenation
echo "School: $name\n";                  // variable in string
echo "Students: {$students}\n";          // curly braces
echo strlen($name) . "\n";               // length: 9
echo strtoupper($name) . "\n";           // RUNDA TSS
echo str_replace("TSS", "Tech", $name);  // RUNDA Tech

// ── Arrays ─────────────────────────────────────────────
$levels = ["l3", "l4", "l5"];
echo $levels[0];          // l3
echo count($levels);      // 3

// Associative array (like JS object)
$student = [
  "name"  => "Amara",
  "level" => "l4",
  "score" => 85
];
echo $student["name"];    // Amara

// ── Control flow ───────────────────────────────────────
if ($student["score"] >= $passMark) {
  echo "{$student['name']} passed! ✅";
} else {
  echo "{$student['name']} needs to resit ❌";
}

// ── Loop ───────────────────────────────────────────────
foreach ($levels as $level) {
  echo "Level: $level\n";
}`, "Core PHP syntax — variables, arrays, control flow"),
    quiz("In PHP, how do you start a variable declaration?",
      ["With the `var` keyword", "With the `let` keyword", "With a dollar sign `$`", "With the `const` keyword"], 2,
      "In PHP, ALL variables start with a dollar sign ($name, $age, $isActive). There is no var/let/const — the dollar sign IS the variable declaration."),
    check(
      "I can declare variables in PHP using the $ prefix",
      "I can create an indexed array and an associative array",
      "I can use if/else and foreach in PHP",
      "I understand how PHP differs from JavaScript in syntax",
    ),
  ]),

  "seed-node-seed-track-windows-server-administration-0": lo1("seed-node-seed-track-windows-server-administration-0", [
    text(`## Windows Server Installation & Configuration

Windows Server is the foundation of enterprise ICT infrastructure — Active Directory, file sharing, email, and web hosting all run on it.

### 🖥️ Windows Server Editions

| Edition | Use case | Key features |
|---|---|---|
| **Essentials** | Small business (≤25 users) | Basic AD, file sharing |
| **Standard** | Medium organisations | 2 VMs, full server features |
| **Datacenter** | Large enterprise / cloud | Unlimited VMs, advanced storage |

### 🔧 Installation Process Overview

\`\`\`
Phase 1: Pre-Installation
  ├── Check hardware requirements
  │   ├── CPU: 1.4GHz 64-bit minimum
  │   ├── RAM: 512MB minimum (2GB recommended)
  │   └── Disk: 32GB minimum
  ├── Create bootable USB/DVD
  └── Plan: server name, IP, roles needed

Phase 2: Installation
  ├── Boot from media
  ├── Choose edition and installation type
  │   ├── Core (no GUI — efficient)
  │   └── Desktop Experience (GUI — easier to manage)
  └── Partition disk

Phase 3: Initial Configuration
  ├── Set Administrator password
  ├── Configure static IP address
  ├── Set computer name
  ├── Activate Windows
  └── Install roles (Add Roles and Features Wizard)
\`\`\`

### 🌐 Server Roles Explained

| Role | What it does | Real example |
|---|---|---|
| **AD DS** | Identity management, login control | User can log in from any PC |
| **DNS** | Name resolution | \`runda.local\` → 192.168.1.10 |
| **DHCP** | Auto IP assignment | New PC gets IP automatically |
| **File Services** | Shared folders | \`\\\\server\\students\` |
| **IIS** | Web hosting | Host intranet website |`),
    code("powershell", `# ── Post-installation PowerShell configuration ────────

# 1. Set static IP address
New-NetIPAddress -InterfaceAlias "Ethernet" \`
  -IPAddress "192.168.1.10" \`
  -PrefixLength 24 \`
  -DefaultGateway "192.168.1.1"

# Set DNS server
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" \`
  -ServerAddresses "192.168.1.10","8.8.8.8"

# 2. Rename the computer
Rename-Computer -NewName "RUNDA-DC01" -Restart

# 3. Install Active Directory Domain Services
Install-WindowsFeature -Name AD-Domain-Services \`
  -IncludeManagementTools

# 4. Promote to Domain Controller
Install-ADDSForest \`
  -DomainName "runda.local" \`
  -DomainNetbiosName "RUNDA" \`
  -InstallDns \`
  -Force

# 5. After restart — create a user
New-ADUser -Name "Amara Uwimana" \`
  -SamAccountName "amara.uwimana" \`
  -UserPrincipalName "amara.uwimana@runda.local" \`
  -AccountPassword (ConvertTo-SecureString "Passw0rd!" -AsPlainText -Force) \`
  -Enabled $true`, "PowerShell: configure IP, install AD DS, create user"),
    quiz("What is the purpose of Active Directory Domain Services (AD DS) in Windows Server?",
      ["To host websites on an internal network", "To manage user accounts, authentication and access control across a network", "To assign IP addresses automatically to clients", "To resolve domain names to IP addresses"], 1,
      "AD DS is the central identity store for Windows networks. It controls who can log in, what resources they can access, and applies policies to all computers in the domain."),
    check(
      "I can list the minimum hardware requirements for Windows Server",
      "I understand the difference between Server Core and Desktop Experience",
      "I can name at least 4 Windows Server roles and their purposes",
      "I have installed Windows Server in a VM and completed initial configuration",
    ),
  ]),

  // ══════════════════════════════════════════════════════════════════════════════
  // LEVEL 4 — GENERAL + CCM (condensed but real)
  // ══════════════════════════════════════════════════════════════════════════════

  "seed-node-seed-track-basics-of-networking-0": lo1("seed-node-seed-track-basics-of-networking-0", [
    text(`## OSI & TCP/IP Models

Every time you browse a webpage, your data travels through 7 layers of abstraction. Understanding these models is essential for debugging network problems.

### 🏛️ The OSI Model — 7 Layers

\`\`\`
Layer 7 — APPLICATION   HTTP, HTTPS, FTP, DNS, SMTP
Layer 6 — PRESENTATION  Encryption (TLS), compression, encoding
Layer 5 — SESSION       Manage connections, authentication
Layer 4 — TRANSPORT     TCP (reliable), UDP (fast)  ← Port numbers
Layer 3 — NETWORK       IP addressing, routing      ← IP addresses
Layer 2 — DATA LINK     MAC addresses, switches, frames
Layer 1 — PHYSICAL      Cables, Wi-Fi signals, bits
\`\`\`

> 🎯 **Mnemonic:** "**A**ll **P**eople **S**eem **T**o **N**eed **D**ata **P**rocessing"

### 🔄 TCP/IP Model (practical 4-layer version)

| TCP/IP Layer | Equivalent OSI Layers | Protocols |
|---|---|---|
| Application | 5, 6, 7 | HTTP, DNS, SMTP |
| Transport | 4 | TCP, UDP |
| Internet | 3 | IP, ICMP |
| Network Access | 1, 2 | Ethernet, Wi-Fi |

### ⚖️ TCP vs UDP

| Property | TCP | UDP |
|---|---|---|
| Connection | Connection-oriented (handshake) | Connectionless |
| Reliability | Guaranteed delivery, ordered | No guarantee |
| Speed | Slower (overhead) | Faster |
| Use case | Web, email, file transfer | Video streaming, gaming, DNS |`),
    code("bash", `# ── Network diagnostic commands ─────────────────────────

# Check your IP address
ip addr show                    # Linux
ipconfig                        # Windows

# Test connectivity (Layer 3 — ICMP)
ping google.com
ping 8.8.8.8

# Trace route to destination
traceroute google.com           # Linux
tracert google.com              # Windows

# DNS lookup (Layer 7)
nslookup google.com
dig google.com A                # Linux

# Show open ports (Layer 4)
netstat -tulpn                  # Linux
netstat -an                     # Windows

# Test TCP connection to a port
curl -v telnet://192.168.1.10:80
nc -zv google.com 443           # Check if port 443 is open`, "Essential network diagnostic commands"),
    quiz("Which protocol at the Transport layer guarantees delivery and ordering of packets?",
      ["UDP", "IP", "TCP", "HTTP"], 2,
      "TCP (Transmission Control Protocol) guarantees delivery through acknowledgments (ACK) and retransmission, and ensures packets are reassembled in the correct order. UDP sacrifices these guarantees for speed."),
    check("I can name all 7 OSI layers in order", "I can explain the difference between TCP and UDP with examples", "I can run ping, traceroute and nslookup and interpret the output"),
  ]),

  "seed-node-seed-track-apply-fundamental-mathematics-analysis-0": lo1("seed-node-seed-track-apply-fundamental-mathematics-analysis-0", [
    text(`## Calculus Basics for Software Engineering

Calculus might seem abstract, but it underpins animation curves, machine learning optimisation, physics engines, and performance analysis.

### 📉 What is a Derivative?

A derivative measures **rate of change** — how fast something is changing at a specific point.

\`\`\`
f(x) = x²

f'(x) = 2x   ← the derivative

At x = 3:  f'(3) = 6
  → The function is increasing at a rate of 6 units
    per unit of x at the point x = 3

Graphically:
   f(x) = x²
     │     ╱╲
     │   ╱    ╲
     │ ╱  slope=6 at x=3
     │╱
     └──────────── x
\`\`\`

### 📐 Key Differentiation Rules

| Rule | Formula | Example |
|---|---|---|
| Power Rule | d/dx(xⁿ) = n·xⁿ⁻¹ | d/dx(x³) = 3x² |
| Constant | d/dx(c) = 0 | d/dx(5) = 0 |
| Sum | d/dx(f+g) = f' + g' | d/dx(x² + 3x) = 2x + 3 |
| Product | d/dx(f·g) = f'g + fg' | d/dx(x·sin x) = sin x + x·cos x |

### 💻 Calculus in Code: Gradient Descent

Machine learning uses derivatives to train models. **Gradient descent** moves down the slope of an error function to find the minimum.

\`\`\`
Error
  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓
  │  ▓▓▓▓▓▓▓▓▓▓
  │    ▓▓▓▓▓▓
  │      ▓▓      ← Minimum error (optimal params)
  └─────────────── Parameters
         ↑ Gradient descent moves here step by step
\`\`\``),
    code("javascript", `// ── Numerical derivative (slope at a point) ───────────
function derivative(f, x, h = 0.0001) {
  return (f(x + h) - f(x - h)) / (2 * h);  // Central difference
}

const f = x => x ** 2;           // f(x) = x²
console.log(derivative(f, 3));   // ≈ 6.0  (exact: 2×3 = 6)
console.log(derivative(f, 5));   // ≈ 10.0 (exact: 2×5 = 10)

// ── Gradient Descent ────────────────────────────────────
// Minimize f(x) = (x - 3)² — minimum is at x = 3
function gradientDescent(startX, learningRate = 0.1, steps = 50) {
  let x = startX;
  const history = [{ step: 0, x, error: (x - 3) ** 2 }];

  for (let i = 1; i <= steps; i++) {
    const grad = 2 * (x - 3);  // derivative of (x-3)²
    x = x - learningRate * grad;
    history.push({ step: i, x: +x.toFixed(4), error: +((x-3)**2).toFixed(6) });
  }
  return history;
}

const result = gradientDescent(10);
console.log(result[0]);   // { step: 0,  x: 10, error: 49 }
console.log(result[10]);  // { step: 10, x: 3.4, error: 0.16 }
console.log(result[49]);  // { step: 49, x: ≈3.0, error: ≈0 }`, "Numerical derivative and gradient descent in JavaScript"),
    quiz("What does the derivative of a function represent geometrically?",
      ["The area under the curve", "The slope (rate of change) of the curve at a point", "The maximum value of the function", "The x-axis intercept"], 1,
      "The derivative f'(x) gives the slope of the tangent line to the curve at point x. Positive derivative = function is increasing; negative = decreasing; zero = local min/max."),
    check("I can apply the power rule to differentiate polynomial functions", "I understand what a derivative represents graphically", "I can explain how gradient descent uses derivatives to minimise error"),
  ]),

  "seed-node-seed-track-apply-mechanics-and-properties-of-matter-0": lo1("seed-node-seed-track-apply-mechanics-and-properties-of-matter-0", [
    text(`## Statics & Dynamics for ICT

Understanding forces and motion helps ICT professionals design physical systems, robotics, and understand why computer hardware behaves the way it does.

### ⚖️ Newton's Three Laws

| Law | Statement | ICT application |
|---|---|---|
| **1st — Inertia** | Objects remain at rest or in uniform motion unless acted on by a force | Hard drive platters keep spinning (inertia) until braked |
| **2nd — F = ma** | Force = mass × acceleration | Calculate motor force for a robotic arm |
| **3rd — Action/Reaction** | Every action has an equal and opposite reaction | Cooling fan pushes air, air pushes fan backwards |

### 🔧 Stress & Strain (Properties of Matter)

\`\`\`
Force applied to material:
         F (force)
         ↓
    ┌────┴────┐
    │ material│  ← stress = F / Area (Pa)
    └─────────┘
         ↕ deformation
    strain = change in length / original length

Elastic region  → material returns to original shape
Plastic region  → permanent deformation
Fracture point  → material breaks
\`\`\`

### 💡 Thermal Properties in ICT

| Material | Thermal conductivity | Use in ICT |
|---|---|---|
| Copper | Very high | CPU heatsinks, PCB traces |
| Aluminium | High | Laptop chassis, heatsinks |
| Silicon | Moderate | Semiconductors, CPUs |
| Plastic | Low | Insulation, cable sheathing |
| Thermal paste | Very high | Between CPU and heatsink |`),
    quiz("A CPU generates 95W of heat. What must the cooling system do to maintain stable operation?",
      ["Remove exactly 95W of heat per second", "Remove 50W and absorb 45W", "Add 95W of energy to balance", "Nothing — heat dissipates naturally"], 0,
      "To maintain a stable temperature, the cooling system must remove heat at exactly the rate it's generated (95W). If removal < generation, temperature rises until the CPU throttles or fails."),
    check("I can state Newton's three laws and give an ICT example for each", "I understand the difference between stress and strain", "I can explain why thermal paste is essential between a CPU and heatsink"),
  ]),

  // CCM L4 — condensed
  "seed-node-seed-track-entrepreneurship-l4-0": lo1("seed-node-seed-track-entrepreneurship-l4-0", [
    text(`## Business Planning for ICT Entrepreneurs

Level 4 entrepreneurship moves from ideas to execution. You'll build a real business plan for an ICT product or service.

### 📊 Business Model Canvas — 9 Building Blocks

\`\`\`
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│  Key     │  Key     │  Value   │ Customer │ Customer │
│ Partners │Activities│Proposition│Relations│ Segments │
├──────────┼──────────┤          ├──────────┤          │
│  Key     │          │          │ Channels │          │
│Resources │          │          │          │          │
├──────────┴──────────┴──────────┴──────────┴──────────┤
│    Cost Structure         │    Revenue Streams        │
└───────────────────────────┴───────────────────────────┘
\`\`\`

### 💰 Revenue Models for ICT Products

| Model | Description | Example |
|---|---|---|
| **SaaS subscription** | Monthly/annual fee | Microsoft 365, Notion |
| **Freemium** | Free + paid upgrade | Spotify, Canva |
| **Marketplace commission** | % of transactions | Airbnb, Uber |
| **One-time license** | Pay once | Adobe (old model) |
| **Usage-based** | Pay per use | AWS, Twilio |`),
    quiz("A SaaS (Software as a Service) business model generates revenue through:",
      ["Selling physical products", "One-time software licence payments", "Recurring subscription fees (monthly/annual)", "Government grants"],
      2, "SaaS generates predictable recurring revenue — Monthly Recurring Revenue (MRR). This is why investors love SaaS: the revenue compounds over time as you add customers."),
    check("I can fill in all 9 blocks of a Business Model Canvas", "I can compare at least 3 revenue models for an ICT product", "I have identified a target customer segment with real needs"),
  ]),

  "seed-node-seed-track-ict-l4-0": lo1("seed-node-seed-track-ict-l4-0", [
    text(`## Productivity Software & Cloud Collaboration

At Level 4, ICT tools are not just for personal productivity — they're for **team collaboration** on technical projects.

### ☁️ Cloud Collaboration Stack

| Layer | Tool | Use |
|---|---|---|
| Communication | Slack, Teams | Chat, meetings |
| Documentation | Notion, Confluence | Knowledge base |
| Code | GitHub | Source control |
| Project management | Jira, Trello | Task tracking |
| Design | Figma | UI/UX prototypes |
| Cloud | Google Drive, OneDrive | File storage & sharing |

### 🔄 Git + GitHub for Team Work

\`\`\`
Team Collaboration Workflow:
─────────────────────────────
  Main branch (production-ready)
    │
    ├── feature/user-auth    ← Person A works here
    ├── feature/product-api  ← Person B works here
    └── bugfix/login-issue   ← Person C works here

  Pull Request → Code Review → Merge → Main
\`\`\``),
    quiz("What is the purpose of a Pull Request (PR) in GitHub team workflows?",
      ["To download code from the repository", "To propose changes for review before merging into the main branch", "To delete a branch after it's done", "To push directly to the main branch"], 1,
      "A Pull Request is a request to merge your changes into the main branch. It triggers code review — teammates can comment, suggest changes, and approve before the code enters production."),
    check("I use cloud storage for all my project files", "I have created and merged a Pull Request on GitHub", "I track my tasks using a project management tool"),
  ]),

  "seed-node-seed-track-english-l4-0": lo1("seed-node-seed-track-english-l4-0", [
    text(`## Technical Writing in English

Technical writers earn some of the highest salaries in the ICT industry. Clear documentation IS the product — without it, even brilliant code is useless.

### 📋 Types of Technical Documentation

| Type | Purpose | Audience |
|---|---|---|
| **README** | Project overview and setup | Developers |
| **API Docs** | How to use the API | Developers |
| **User Manual** | How to use the software | End users |
| **Architecture Doc** | System design decisions | Engineering team |
| **Runbook** | Operational procedures | Ops team |

### ✍️ Principles of Clear Technical Writing

\`\`\`
✅ GOOD Technical Writing:
  • Active voice: "Click the Save button"  (not "The Save button should be clicked")
  • Specific: "The process takes 2–3 minutes" (not "may take a while")
  • Numbered steps for sequential processes
  • Code examples for every technical claim
  • Short sentences (aim for < 25 words)

❌ BAD Technical Writing:
  • "It is generally possible that users might..."
  • Passive voice everywhere
  • Screenshots only, no alt text
  • Assumptions about reader knowledge
\`\`\``),
    quiz("Which principle is MOST important when writing a user-facing error message?",
      ["Use technical jargon to sound authoritative", "Be specific about what went wrong AND what the user should do next", "Keep it very brief with no details", "Blame the user's input"], 1,
      "Good error messages = what happened + why + how to fix it. 'Invalid input' is useless. 'Email already registered — try logging in or reset your password' is helpful."),
    check("I can write a README with installation instructions, usage and examples", "I use active voice in my technical documentation", "I include working code examples in all API documentation"),
  ]),

  "seed-node-seed-track-fran-ais-l4-0": lo1("seed-node-seed-track-fran-ais-l4-0", [
    text(`## Communication professionnelle en français

À ce niveau, vous communiquez en français dans des contextes professionnels complexes : réunions, rapports techniques, et correspondance formelle.

### 💼 La Réunion Professionnelle

\`\`\`
Structure d'une réunion efficace:
─────────────────────────────────
1. Ordre du jour (agenda) envoyé avant
2. Ouverture et tour de table
3. Discussion de chaque point
4. Décisions et actions à prendre
5. Clôture et prochaine réunion

Expressions utiles:
  "Je voudrais aborder le point suivant..."
  "En ce qui concerne les délais..."
  "Je suis d'accord avec cette proposition."
  "Pourriez-vous préciser votre idée ?"
  "Pour résumer, nous avons décidé de..."
\`\`\`

| Expression | Utilisation |
|---|---|
| "à cet égard" | Concerning this matter |
| "par conséquent" | Therefore |
| "en revanche" | On the other hand |
| "il convient de" | It is appropriate to |`),
    quiz("Quelle expression utiliseriez-vous pour introduire une décision dans un compte-rendu de réunion?",
      ["\"Je pense peut-être que...\"", "\"Il a été décidé que...\" (passif formel)", "\"On va faire...\"", "\"Bon, donc...\""], 1,
      "\"Il a été décidé que...\" est la formulation passive formelle standard dans les comptes-rendus professionnels. Le passif donne un caractère officiel et impersonnel à la décision."),
    check("Je peux conduire une réunion simple en français", "Je maîtrise les expressions de liaison formelles", "Je peux rédiger un compte-rendu de réunion en français"),
  ]),

  "seed-node-seed-track-industrial-attachment-program-l4-0": lo1("seed-node-seed-track-industrial-attachment-program-l4-0", [
    text(`## Industry Placement: Level 4

At Level 4, your industrial attachment is more technical. You are expected to contribute to real software projects, not just observe.

### 🎯 Expected Contributions at L4

| Week | Expected Output |
|---|---|
| 1 | Understand codebase, set up dev environment |
| 2–3 | Fix small bugs, write unit tests |
| 4–6 | Implement a feature end-to-end |
| Final | Present project contribution, submit report |

### 📊 Professional Git Workflow in Industry

\`\`\`
1. Pick up ticket from Jira/Trello
2. git checkout -b feature/TICKET-123-user-auth
3. Code the feature
4. git commit -m "feat: add JWT authentication TICKET-123"
5. Push branch
6. Open Pull Request with description
7. Address code review comments
8. Merge after approval
\`\`\`

### 📝 Commit Message Convention (Conventional Commits)

| Prefix | When to use |
|---|---|
| feat: | New feature |
| fix: | Bug fix |
| docs: | Documentation only |
| test: | Adding tests |
| refactor: | Code restructure, no feature change |
| chore: | Maintenance tasks |`),
    quiz("You discover a critical bug in production at 4pm on Friday. What is the professional action?",
      ["Leave it for Monday — it's Friday", "Fix it immediately without telling anyone to avoid embarrassment", "Report it to your supervisor immediately, then work on a fix", "Delete the logs so nobody sees it"], 2,
      "Always report critical issues immediately — hiding them makes you complicit and removes the opportunity for senior engineers to help. 'I found a bug and I'm investigating' is professional. Silence is not."),
    check("I have contributed code to a real project during attachment", "I use conventional commit messages", "I have written a weekly progress report throughout my attachment"),
  ]),

  "seed-node-seed-track-ikinyarwanda-l4-0": lo1("seed-node-seed-track-ikinyarwanda-l4-0", [
    text(`## Inyandiko z'akazi mu Kinyarwanda

Ikinyarwanda cy'intyoza mu kazi ni kimwe mu bintu bikomeye mu bikorwa by'Abanyarwanda. Inyandiko nziza igaragara neza, ifite imiterere igaragara, kandi iganisha mu gisudi.

### 📋 Ubwoko bw'Inyandiko

| Ubwoko | Agaciro | Urugero |
|---|---|---|
| Raporo | Gutanga amakuru | Raporo y'igenamigambi |
| Ibaruwa | Gutumanahana | Ibaruwa isaba |
| Igenamigambi | Gushushanya ibirori | Igenamigambi ry'ibikorwa |

### ✍️ Imiterere y'Inyandiko Nziza

\`\`\`
Inyandiko nziza ifite:
  ✓ Umutwe (usobanura icyo wandikirwa)
  ✓ Interuro nziza (paragraph imwe = igitekerezo kimwe)
  ✓ Amagambo asobanutse (ntugike ku bigoye)
  ✓ Impanuro zisobanutse
  ✓ Isoza ryeruye
\`\`\``),
    quiz("Ni ikihe kigo cy'inyandiko gikenewe mu raporo y'akazi ku rwego rw'ubufatanyacyubahiro?",
      ["Gukoresha amagambo menshi", "Umutwe, intangiriro, inyandiko, n'isoza", "Gusa inyandiko nta mutwe", "Amashusho gusa"], 1,
      "Raporo nziza igizwe n'impande enye: umutwe, intangiriro isobanura intego, inyandiko y'ibikubiyemo, n'isoza rifite impanuro. Ibi bigaragaza ubwenge no gukoranya neza."),
    check("Nshoboye kwandika raporo ifite impande enye", "Nkoresha Ikinyarwanda cy'intyoza mu nyandiko zose z'akazi", "Nshoboye gukora ibaruwa isaba akazi mu Kinyarwanda"),
  ]),

  "seed-node-seed-track-citizenship-l4-0": lo1("seed-node-seed-track-citizenship-l4-0", [
    text(`## Democracy & Governance in Rwanda

Rwanda's governance model combines democratic principles with performance-focused public administration — and ICT professionals play a growing role in it.

### 🗳️ Rwanda's Electoral System

| Level | Body | How elected |
|---|---|---|
| National | President | Direct election, all citizens |
| National | Parliament (Chamber of Deputies) | Direct election + reserved seats |
| National | Senate | Indirect + appointed |
| Local | Mayor / Executive Secretary | Elected at district level |

### 🌐 E-Governance in Rwanda

Rwanda is a continental leader in digital government:

\`\`\`
irembo.gov.rw    ← Single portal for all gov services
  ├── Birth certificates
  ├── Business registration
  ├── Tax payments
  ├── Land titles
  └── Police clearance

As an ICT graduate, you will BUILD the next generation
of these services.
\`\`\`

> 💡 **Your role as an ICT professional:** Every system you build affects citizens' access to government services. Secure, accessible, and reliable code IS civic responsibility.`),
    quiz("What is the primary purpose of Rwanda's irembo.gov.rw platform?",
      ["Social media for government officials", "A single portal for citizens to access government services online", "Internal government communication system", "A news website for government announcements"], 1,
      "Irembo is Rwanda's e-governance platform — a single-window service where citizens can access hundreds of government services online without visiting offices. It's a model for digital transformation in Africa."),
    check("I can describe Rwanda's three branches of government and their roles", "I have used irembo.gov.rw or similar e-governance platform", "I understand how my ICT skills contribute to public service improvement"),
  ]),

  // ══════════════════════════════════════════════════════════════════════════════
  // LEVEL 5 — SPECIFIC
  // ══════════════════════════════════════════════════════════════════════════════

  "seed-node-seed-track-blockchain-fundamentals-0": lo1("seed-node-seed-track-blockchain-fundamentals-0", [
    text(`## Blockchain Architecture

Blockchain is a distributed ledger — a database that is shared and synchronised across many computers, with no central authority.

### ⛓️ How a Block is Built

\`\`\`
┌──────────────────────────────────────┐
│  Block #1042                          │
├──────────────────────────────────────┤
│  Previous Hash: 0000a4f2b8c1...       │ ← Links to Block #1041
│  Timestamp:     2025-01-15 14:23:07   │
│  Nonce:         284731                │ ← Proof of work value
│  Merkle Root:   7f3a9b2c...           │ ← Hash of all transactions
├──────────────────────────────────────┤
│  Transactions:                        │
│  • Alice → Bob: 0.5 BTC               │
│  • Carol → Dave: 1.2 BTC              │
│  • Eve → Frank: 0.1 BTC               │
├──────────────────────────────────────┤
│  Block Hash: 0000c8d3f1b2...          │ ← This block's fingerprint
└──────────────────────────────────────┘
\`\`\`

### 🔐 Why Tamper-Proof?

If you change any transaction in Block #1042:
1. The Merkle Root changes
2. The Block Hash changes
3. Block #1043's "Previous Hash" no longer matches
4. **The entire chain after #1042 is invalidated**
5. You'd need to re-mine EVERY subsequent block faster than the entire network → practically impossible

### 📊 Consensus Mechanisms

| Mechanism | How it works | Energy | Used by |
|---|---|---|---|
| **Proof of Work** | Solve hard math puzzle | Very high 🔥 | Bitcoin |
| **Proof of Stake** | Lock up ("stake") tokens | Low ✅ | Ethereum 2.0 |
| **Delegated PoS** | Vote for validators | Very low ✅ | EOS, TRON |`),
    code("javascript", `// ── Simple blockchain implementation ─────────────────
const crypto = require('crypto');

class Block {
  constructor(index, data, previousHash = '0') {
    this.index        = index;
    this.timestamp    = new Date().toISOString();
    this.data         = data;
    this.previousHash = previousHash;
    this.nonce        = 0;
    this.hash         = this.calculateHash();
  }

  calculateHash() {
    const content = this.index + this.timestamp +
                    JSON.stringify(this.data) +
                    this.previousHash + this.nonce;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  // Proof of Work: find a hash starting with 'difficulty' zeros
  mine(difficulty) {
    const target = '0'.repeat(difficulty);
    while (!this.hash.startsWith(target)) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log(\`Block mined! Nonce: \${this.nonce}, Hash: \${this.hash}\`);
  }
}

// Create a mini-blockchain
const genesis = new Block(0, { message: 'Genesis Block' }, '0');
genesis.mine(3);

const block1 = new Block(1, { tx: 'Alice→Bob: 5 RWF' }, genesis.hash);
block1.mine(3);

console.log('Chain valid?', block1.previousHash === genesis.hash);`, "Minimal blockchain implementation with Proof of Work"),
    quiz("Why is it computationally impractical to tamper with a block in the middle of a blockchain?",
      ["Blockchain uses a password that nobody knows", "Changing one block invalidates every subsequent block's hash, requiring re-mining the entire chain faster than the network — practically impossible", "Blockchain data is encrypted and unreadable", "Banks would detect the fraud immediately"], 1,
      "Each block's hash depends on the previous block's hash. Changing one block cascades — you'd need to re-mine all subsequent blocks AND outpace the entire honest network simultaneously."),
    check("I can explain what a block contains (hash, previous hash, data, nonce)", "I understand why blockchains are tamper-resistant", "I can compare Proof of Work vs Proof of Stake", "I have run the blockchain implementation and mined a block"),
  ]),

  "seed-node-seed-track-front-end-app-development-with-react-js-0": lo1("seed-node-seed-track-front-end-app-development-with-react-js-0", [
    text(`## React Fundamentals

React is the most popular JavaScript library for building user interfaces. It was created by Facebook in 2013 and powers billions of users daily.

### ⚛️ What Makes React Special?

\`\`\`
Traditional HTML/JS:          React:
──────────────────            ─────────────────────────
1. Render full page    →      1. Render components (mini-UIs)
2. Manual DOM updates →       2. Automatic DOM diffing (Virtual DOM)
3. Spaghetti state    →       3. Predictable state management
4. No reusability     →       4. Reusable component library
\`\`\`

### 🧱 Component = UI + Logic

\`\`\`
React App
└── <App>
    ├── <NavBar>
    │   ├── <Logo>
    │   └── <NavLinks>
    ├── <MainContent>
    │   ├── <CourseCard>
    │   ├── <CourseCard>
    │   └── <CourseCard>
    └── <Footer>

Each box is an independent, reusable component.
\`\`\`

### 🔄 The React Data Flow

\`\`\`
Props flow DOWN ↓        State changes trigger re-render ↻

Parent Component
  │  passes props
  ▼
Child Component
  • Reads props (read-only)
  • Has its own state (local)
  • Emits events UP via callback props
  │  calls onUpdate(data)
  ▲
Parent Component (updates state → re-renders)
\`\`\``),
    code("jsx", `// ── React fundamentals ─────────────────────────────────
import { useState, useEffect } from 'react'

// ── 1. Simple functional component ────────────────────
function Greeting({ name, role }) {
  return (
    <div className="greeting">
      <h1>Welcome, {name}!</h1>
      <span className={\`badge badge-\${role}\`}>{role.toUpperCase()}</span>
    </div>
  )
}

// ── 2. State with useState ─────────────────────────────
function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  )
}

// ── 3. Effect with useEffect ───────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date().toLocaleTimeString())

  useEffect(() => {
    const timer = setInterval(
      () => setTime(new Date().toLocaleTimeString()),
      1000
    )
    return () => clearInterval(timer) // cleanup on unmount
  }, [])  // [] = run once on mount

  return <p>🕐 {time}</p>
}

// ── 4. List rendering ──────────────────────────────────
const modules = [
  { id: 1, code: 'SWDFA501', title: 'React Development' },
  { id: 2, code: 'SWDOT501', title: 'DevOps Application' },
]

function ModuleList() {
  return (
    <ul>
      {modules.map(mod => (
        <li key={mod.id}>
          <strong>{mod.code}</strong>: {mod.title}
        </li>
      ))}
    </ul>
  )
}`, "React hooks, state, effects and list rendering"),
    quiz("In React, what is the purpose of the `key` prop when rendering lists?",
      ["It encrypts the list item data", "It helps React identify which items changed, were added, or removed for efficient re-rendering", "It makes list items keyboard-accessible", "It is required for styling list items"], 1,
      "The key prop gives React a stable identity for each list item. Without keys, React can't efficiently diff the list — it would re-render everything. Keys must be unique among siblings and stable (not array indexes in dynamic lists)."),
    check(
      "I can create a functional React component that accepts props",
      "I can manage local state with useState",
      "I can fetch data from an API with useEffect and render the results",
      "I understand why keys are required when rendering lists",
    ),
  ]),

  "seed-node-seed-track-integrate-the-workplace-0": lo1("seed-node-seed-track-integrate-the-workplace-0", [
    text(`## Workplace Communication for Software Developers

Technical brilliance without communication skills leads to stalled projects, conflicts, and missed promotions.

### 💬 Communication Frameworks

| Situation | Framework | Example |
|---|---|---|
| Giving feedback | SBI (Situation-Behaviour-Impact) | "In yesterday's standup (S), you interrupted the team (B), which caused two people to not share their blockers (I)" |
| Requesting help | Context-Problem-Ask | "I'm building auth for TICKET-45. I'm stuck on refresh token expiry. Could you review my approach?" |
| Status update | STAR (if narrative) or RAG | 🟢 On track / 🟡 At risk / 🔴 Blocked |

### 🔄 Agile Stand-up Format

\`\`\`
Daily Stand-up (max 15 minutes):

Each person answers 3 questions:
  1. What did I complete YESTERDAY?
  2. What will I complete TODAY?
  3. What is BLOCKING me?

Anti-patterns to avoid:
  ✗ Status report to the manager (talk to the team)
  ✗ Problem-solving in the stand-up (take it offline)
  ✗ No blockers every single day (are you really unblocked?)
\`\`\``),
    quiz("In an Agile daily stand-up, what is the PRIMARY audience for your update?",
      ["The project manager", "Your team members — to coordinate work and surface blockers", "External stakeholders", "Your personal journal"], 1,
      "The stand-up is for the TEAM, not the manager. You're synchronising with colleagues: 'I'm working on X, who else is affected? Anyone blocking me or being blocked by me?'"),
    check("I can give a complete daily stand-up in under 60 seconds", "I use the SBI framework when giving feedback", "I write clear Slack/Teams messages with context and a specific ask"),
  ]),

  "seed-node-seed-track-mobile-app-development-0": lo1("seed-node-seed-track-mobile-app-development-0", [
    text(`## Mobile Development Environment Setup

Setting up your mobile dev environment correctly saves hours of debugging later. React Native (JavaScript) lets you build for both iOS and Android from one codebase.

### 📱 React Native vs Native Development

| | React Native | Native (Swift/Kotlin) |
|---|---|---|
| Language | JavaScript / TypeScript | Swift (iOS), Kotlin (Android) |
| Codebase | Single shared | Two separate codebases |
| Performance | Near-native | Full native |
| Learning curve | Lower (JS devs) | Steeper |
| Use case | Most apps | Games, AR, performance-critical |

### 🔧 Setup Overview

\`\`\`
Prerequisites:
  1. Node.js v18+
  2. Java JDK 17 (for Android)
  3. Android Studio + SDK
  4. Xcode (iOS — macOS only)
  5. React Native CLI or Expo CLI

Development options:
  📱 Physical device (best — test real hardware)
  💻 Android Emulator (Android Studio AVD)
  📱 iOS Simulator (macOS + Xcode only)
  🌐 Expo Go (easiest start — no native config)
\`\`\`

### 🗂️ React Native Project Structure

\`\`\`
MyApp/
├── android/           ← Native Android project
├── ios/               ← Native iOS project
├── src/
│   ├── screens/       ← Full-page components
│   ├── components/    ← Reusable UI parts
│   ├── navigation/    ← Screen navigation
│   └── services/      ← API calls, storage
├── App.tsx            ← Entry point
└── package.json
\`\`\``),
    code("bash", `# ── React Native environment setup (Android) ─────────

# 1. Install Expo CLI (easiest way to start)
npm install -g expo-cli

# 2. Create a new project
npx create-expo-app MyFirstApp
cd MyFirstApp

# 3. Start development server
npx expo start

# 4. Test options (choose one):
#    a) Scan QR code with Expo Go app on your phone
#    b) Press 'a' for Android emulator
#    c) Press 'w' for web preview

# ── OR: React Native CLI (for production apps) ────────

# Install dependencies
npm install -g react-native-cli

# Create project (TypeScript recommended)
npx react-native init MyProductionApp --template react-native-template-typescript
cd MyProductionApp

# Run on Android
npx react-native run-android

# Run on iOS (macOS only)
npx react-native run-ios`, "Setting up React Native with Expo or CLI"),
    quiz("What is the main advantage of using React Native over building separate iOS and Android apps?",
      ["React Native apps perform better than native apps", "One JavaScript/TypeScript codebase runs on both iOS and Android, reducing development time", "React Native only requires HTML and CSS knowledge", "React Native apps are automatically published to app stores"], 1,
      "Code sharing is the key benefit — you write business logic once in JavaScript and it compiles to both platforms. This typically reduces mobile development effort by 40–60%."),
    check("I have installed Expo CLI and created my first React Native app", "I can run the app on a physical device or emulator", "I understand the folder structure of a React Native project"),
  ]),

  "seed-node-seed-track-machine-learning-application-0": lo1("seed-node-seed-track-machine-learning-application-0", [
    text(`## Data Preprocessing — The Foundation of Machine Learning

In ML, **garbage in = garbage out**. 80% of a data scientist's work is cleaning and preparing data before any model is trained.

### 🔄 The ML Pipeline

\`\`\`
Raw Data → Preprocessing → Feature Engineering → Model → Evaluation → Deployment
              │                    │
              ▼                    ▼
         Clean, complete       Scaled, encoded,
         consistent data       selected features
\`\`\`

### 🧹 Common Data Quality Issues

| Problem | Example | Fix |
|---|---|---|
| **Missing values** | age: null | Impute (mean/median) or drop |
| **Outliers** | salary: 9,999,999 | IQR filtering, winsorizing |
| **Duplicates** | Same row twice | df.drop_duplicates() |
| **Wrong types** | age: "twenty" | Convert or remove |
| **Inconsistent** | "Male" vs "M" vs "male" | Standardise |
| **Imbalanced** | 95% class A, 5% class B | Oversample, undersample, SMOTE |

### 📊 Feature Scaling — Why It Matters

\`\`\`
Without scaling:
  age:    [22, 45, 31]        (range: 0–100)
  salary: [30000, 80000, 45000] (range: 0–200,000)

  → Salary dominates distance calculations
  → Model ignores age completely

With StandardScaler:
  age:    [-1.1,  1.2,  0.0]
  salary: [-0.8,  1.3, -0.1]

  → Both features contribute equally
\`\`\``),
    code("python", `# ── Data preprocessing pipeline ──────────────────────
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split

# ── 1. Load and inspect data ──────────────────────────
df = pd.read_csv('students.csv')
print(df.head())
print(df.info())          # types and null counts
print(df.describe())      # statistics
print(df.isnull().sum())  # missing values per column

# ── 2. Handle missing values ──────────────────────────
df['age'].fillna(df['age'].median(), inplace=True)   # median imputation
df['score'].fillna(df['score'].mean(), inplace=True) # mean imputation
df.dropna(subset=['target'], inplace=True)            # drop if target missing

# ── 3. Remove duplicates ──────────────────────────────
df.drop_duplicates(inplace=True)
print(f"Shape after dedup: {df.shape}")

# ── 4. Encode categorical features ────────────────────
le = LabelEncoder()
df['level_encoded'] = le.fit_transform(df['level'])  # l3→0, l4→1, l5→2

# One-hot encoding for non-ordinal categories
df = pd.get_dummies(df, columns=['subject'], prefix='subj')

# ── 5. Remove outliers using IQR ──────────────────────
Q1 = df['score'].quantile(0.25)
Q3 = df['score'].quantile(0.75)
IQR = Q3 - Q1
df = df[(df['score'] >= Q1 - 1.5*IQR) & (df['score'] <= Q3 + 1.5*IQR)]

# ── 6. Feature scaling ────────────────────────────────
scaler = StandardScaler()
numeric_cols = ['age', 'score', 'attendance']
df[numeric_cols] = scaler.fit_transform(df[numeric_cols])

# ── 7. Train/test split ───────────────────────────────
X = df.drop('passed', axis=1)
y = df['passed']
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"Train: {X_train.shape}, Test: {X_test.shape}")`, "Complete data preprocessing pipeline"),
    quiz("Why is feature scaling (e.g., StandardScaler) essential before training most ML models?",
      ["It makes the data look better in visualisations", "Features with larger ranges dominate distance-based algorithms, drowning out smaller-range features", "It speeds up data loading from CSV files", "It automatically removes outliers from the dataset"], 1,
      "Distance-based algorithms (KNN, SVM, neural networks) are sensitive to feature magnitude. A feature ranging 0–100,000 will dominate one ranging 0–1. Scaling puts all features on equal footing."),
    check(
      "I can identify missing values, outliers and duplicates in a dataset",
      "I can apply mean/median imputation for missing values",
      "I can apply StandardScaler and explain why scaling matters",
      "I can split data into training and test sets with stratification",
    ),
  ]),

  "seed-node-seed-track-nosql-database-development-0": lo1("seed-node-seed-track-nosql-database-development-0", [
    text(`## NoSQL Concepts — When Not to Use SQL

NoSQL databases were created to solve problems that relational databases struggle with: massive scale, flexible schema, and high velocity data.

### 📊 SQL vs NoSQL — When to Use Each

| Factor | SQL (Relational) | NoSQL |
|---|---|---|
| **Schema** | Fixed, defined upfront | Flexible, schema-less |
| **Relationships** | Complex JOINs | Denormalised, embedded |
| **Scaling** | Vertical (bigger server) | Horizontal (more servers) |
| **Consistency** | ACID (strong) | BASE (eventual) |
| **Best for** | Financial, ERP, complex queries | Real-time, big data, catalogs |

### 🗄️ 4 Types of NoSQL Databases

\`\`\`
Document Store    →  MongoDB, CouchDB
  { _id: "001", name: "Alice", courses: ["SWDBD401"] }
  Best for: Content, user profiles, catalogs

Key-Value Store   →  Redis, DynamoDB
  "user:001" → { name: "Alice" }
  Best for: Sessions, caching, leaderboards

Column Family     →  Cassandra, HBase
  Optimised for: Time-series, IoT, analytics at scale

Graph Database    →  Neo4j, ArangoDB
  Nodes and edges: People → FOLLOWS → People
  Best for: Social networks, recommendations, fraud detection
\`\`\`

### 📄 MongoDB Document Structure

\`\`\`json
{
  "_id": "ObjectId('63a7f2b4...')",
  "name": "Amara Uwimana",
  "level": "l4",
  "courses": [
    { "code": "SWDBD401", "grade": 85, "completed": true },
    { "code": "SWDDD401", "grade": 78, "completed": false }
  ],
  "profile": {
    "bio": "Aspiring backend developer",
    "github": "github.com/amara"
  }
}
\`\`\``),
    code("javascript", `// ── MongoDB with Mongoose in Node.js ─────────────────
const mongoose = require('mongoose');

// Connect
await mongoose.connect(process.env.MONGO_URI);

// Define schema
const studentSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  email:   { type: String, unique: true, required: true },
  level:   { type: String, enum: ['l3', 'l4', 'l5'] },
  courses: [{ code: String, grade: Number, completed: Boolean }],
  createdAt: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);

// ── CRUD Operations ────────────────────────────────────

// Create
const student = await Student.create({
  name: 'Amara Uwimana',
  email: 'amara@runda.edu',
  level: 'l4',
  courses: [{ code: 'SWDBD401', grade: 85, completed: true }]
});

// Read all L4 students
const l4Students = await Student.find({ level: 'l4' })
  .select('name email courses')
  .sort({ name: 1 });

// Update — add a new course
await Student.findByIdAndUpdate(student._id, {
  $push: { courses: { code: 'SWDDD401', grade: null, completed: false } }
});

// Delete
await Student.findByIdAndDelete(student._id);

// Aggregation — average grade by level
const avgByLevel = await Student.aggregate([
  { $unwind: '$courses' },
  { $group: { _id: '$level', avgGrade: { $avg: '$courses.grade' } } }
]);`, "MongoDB CRUD with Mongoose"),
    quiz("When is MongoDB a BETTER choice than a relational database?",
      ["When you need complex multi-table JOINs", "When your data is highly structured with strict referential integrity", "When you have flexible, evolving schemas and need to embed related data", "When ACID transactions are required for every operation"], 2,
      "MongoDB excels at flexible schemas — if your data structure changes frequently, or you naturally have embedded documents (a student with an array of courses), MongoDB's document model is more natural than many JOIN tables."),
    check(
      "I can explain the 4 types of NoSQL databases and their use cases",
      "I can compare when to use SQL vs NoSQL for a given scenario",
      "I can perform CRUD operations on MongoDB using Mongoose",
      "I understand what embedding vs referencing means in document databases",
    ),
  ]),

  "seed-node-seed-track-devops-application-0": lo1("seed-node-seed-track-devops-application-0", [
    text(`## Linux & Shell Scripting for DevOps

DevOps engineers live in the terminal. Linux is the operating system that runs 96% of the world's servers — mastering it is non-negotiable.

### 🐧 Why Linux for Servers?

| Aspect | Linux | Windows Server |
|---|---|---|
| **Cost** | Free and open source | Paid licences |
| **Performance** | Lightweight, no GUI overhead | Heavier |
| **Stability** | Years of uptime common | Requires more reboots |
| **Automation** | Bash/Python — everything scriptable | PowerShell (improving) |
| **Containers** | Native Docker support | Docker supported |

### 📂 Linux File System

\`\`\`
/                ← Root (everything starts here)
├── /home/       ← User home directories
├── /var/log/    ← Application logs
├── /etc/        ← Configuration files
├── /usr/bin/    ← User programs
├── /tmp/        ← Temporary files (cleared on reboot)
├── /opt/        ← Third-party software
└── /proc/       ← Virtual filesystem — kernel/process info

File permissions:
  drwxr-xr-x
  │├─┤├─┤├─┤
  │owner group others
  d = directory, r = read, w = write, x = execute
\`\`\`

### ⚡ Bash Scripting Essentials

\`\`\`
#!/bin/bash             ← shebang: use bash interpreter

Variables:     NAME="World"
Echo:          echo "Hello, $NAME!"
Conditions:    if [ -f "file.txt" ]; then ... fi
Loops:         for i in {1..5}; do echo $i; done
Functions:     my_func() { echo "Running function"; }
Exit codes:    0 = success, non-zero = failure
\`\`\``),
    code("bash", `#!/bin/bash
# ── Automated deployment script ──────────────────────
set -e  # Exit immediately if any command fails

APP_NAME="backend-api"
APP_DIR="/var/www/$APP_NAME"
LOG_FILE="/var/log/$APP_NAME/deploy.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

log() {
  echo "[$TIMESTAMP] $1" | tee -a "$LOG_FILE"
}

# ── 1. Pull latest code ───────────────────────────────
log "Starting deployment of $APP_NAME..."
cd "$APP_DIR"
git pull origin main
log "Code updated from Git."

# ── 2. Install/update dependencies ───────────────────
npm ci --production
log "Dependencies installed."

# ── 3. Run database migrations ────────────────────────
npm run migrate 2>&1 | tee -a "$LOG_FILE"
log "Migrations completed."

# ── 4. Restart application (PM2) ─────────────────────
pm2 reload "$APP_NAME" --update-env
log "Application restarted with PM2."

# ── 5. Health check ───────────────────────────────────
sleep 3
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)

if [ "$HTTP_STATUS" = "200" ]; then
  log "✅ Deployment successful! Health check: $HTTP_STATUS"
else
  log "❌ Health check failed: $HTTP_STATUS — rolling back!"
  pm2 reload "$APP_NAME" --previous
  exit 1
fi`, "Production deployment script with health check"),
    quiz("In Linux file permissions `rwxr-xr--`, what can the GROUP do?",
      ["Read, write and execute", "Read and execute only", "Read only", "Write and execute only"], 1,
      "The permission string breaks into three groups: owner (rwx), group (r-x), others (r--). Group has r-x = read and execute, but NOT write. They can run the file but not modify it."),
    check(
      "I can navigate the Linux filesystem and use ls, cd, cat, grep, find",
      "I understand Linux file permissions and can use chmod",
      "I can write a bash script with variables, loops and functions",
      "I have automated at least one deployment or maintenance task with a script",
    ),
  ]),

  // ══════════════════════════════════════════════════════════════════════════════
  // LEVEL 5 — GENERAL
  // ══════════════════════════════════════════════════════════════════════════════

  "seed-node-seed-track-mathematical-analysis-statistics-and-probability-0": lo1("seed-node-seed-track-mathematical-analysis-statistics-and-probability-0", [
    text(`## Statistical Analysis for Software Engineers

Data drives every modern software decision — A/B testing, performance monitoring, user analytics. Statistics is the language of data.

### 📊 Descriptive Statistics at a Glance

| Measure | What it tells you | Formula |
|---|---|---|
| **Mean (μ)** | Average value | Σx / n |
| **Median** | Middle value (robust to outliers) | Middle of sorted data |
| **Mode** | Most frequent value | Most common item |
| **Variance (σ²)** | Spread of data | Σ(x - μ)² / n |
| **Std Dev (σ)** | Average distance from mean | √variance |
| **Range** | Min to max | max - min |

### 📈 Normal Distribution (Bell Curve)

\`\`\`
                    ╭────╮
                ╭───╯    ╰───╮
            ╭───╯            ╰───╮
        ╭───╯                    ╰───╮
    ────╯                            ╰────
    -3σ  -2σ   -1σ    μ    +1σ   +2σ   +3σ

68% of data falls within ±1σ
95% of data falls within ±2σ
99.7% of data falls within ±3σ

Example: Page load times with μ=1.2s, σ=0.3s
  95% of pages load between 0.6s and 1.8s
  If yours loads in 3.0s → you're 6σ away — something is broken!
\`\`\``),
    code("python", `import numpy as np
import statistics as stats

scores = [72, 85, 91, 68, 79, 83, 95, 71, 88, 76]

print(f"Mean:     {np.mean(scores):.2f}")       # 80.80
print(f"Median:   {np.median(scores):.2f}")     # 81.00
print(f"Mode:     {stats.mode(scores)}")        # 72 (first)
print(f"Std Dev:  {np.std(scores):.2f}")        # 8.60
print(f"Variance: {np.var(scores):.2f}")        # 73.96
print(f"Range:    {np.ptp(scores)}")             # 27 (95-68)

# Z-score: how many standard deviations from the mean?
def z_score(x, mean, std): return (x - mean) / std
mean, std = np.mean(scores), np.std(scores)
print(f"Z-score of 95: {z_score(95, mean, std):.2f}")  # +1.65`, "Descriptive statistics in Python"),
    quiz("A dataset has mean=50 and std dev=10. A value of 80 has a Z-score of:",
      ["0.3", "3.0", "8.0", "0.8"], 1,
      "Z = (x - μ) / σ = (80 - 50) / 10 = 30/10 = 3.0. This value is 3 standard deviations above the mean — statistically very unusual (only 0.15% of data in a normal distribution is above +3σ)."),
    check("I can calculate mean, median, mode and standard deviation", "I understand what a normal distribution means for my data", "I can calculate a Z-score and interpret its meaning"),
  ]),

  "seed-node-seed-track-apply-dynamics-and-waves-0": lo1("seed-node-seed-track-apply-dynamics-and-waves-0", [
    text(`## Newton's Laws & Dynamics in ICT

Dynamics — the study of motion and forces — is directly applicable to robotics, IoT sensors, computer graphics, and gaming physics engines.

### ⚡ Newton's Three Laws — ICT Applications

| Law | Statement | ICT Application |
|---|---|---|
| **1st** | Object at rest stays at rest (inertia) | Flywheel energy storage, HDD platters |
| **2nd** | F = ma (force = mass × acceleration) | Robotic arm motor calculation |
| **3rd** | Action = Reaction | Jet propulsion, fan systems |

### 🌊 Wave Properties for Wireless Communication

\`\`\`
Wave Equation:   v = f × λ

v = wave speed (m/s)      — 3×10⁸ m/s for electromagnetic
f = frequency (Hz)         — 2.4GHz, 5GHz for WiFi
λ = wavelength (m)         — shorter wavelength = more data

Electromagnetic Spectrum (relevant to ICT):
──────────────────────────────────────────────────
Radio   Microwave  Infrared  Visible  UV   X-ray
(WiFi,  (5G, radar)(TV remote)(Fiber   ←── ←───
 LTE)             )          optics)

WiFi 2.4GHz → λ = 3×10⁸ / 2.4×10⁹ = 0.125m = 12.5cm
WiFi 5GHz   → λ = 3×10⁸ / 5×10⁹  = 0.06m  = 6cm
  → Shorter wavelength = less wall penetration but more bandwidth
\`\`\``),
    quiz("A WiFi router broadcasts at 5GHz. Using v = fλ where v = 3×10⁸ m/s, what is the wavelength?",
      ["15m", "0.6m", "0.06m", "6cm both c and d are correct"], 2,
      "λ = v/f = (3×10⁸) / (5×10⁹) = 0.06m = 6cm. 5GHz has a shorter wavelength than 2.4GHz (12.5cm), which means better data rates but less ability to penetrate walls."),
    check("I can apply all three of Newton's laws with ICT examples", "I can calculate wavelength from frequency using v = fλ", "I understand why 5GHz WiFi has shorter range than 2.4GHz"),
  ]),

  "seed-node-seed-track-python-programming-0": lo1("seed-node-seed-track-python-programming-0", [
    text(`## Python Environment Setup

Python is the most popular language for data science, AI, automation, and backend development. Getting the environment right is the foundation of everything.

### 🐍 Python Ecosystem

\`\`\`
Python Runtime
└── pip (package manager)
    └── Virtual Environment (venv/conda)
        ├── Isolates project dependencies
        ├── Different versions per project
        └── No conflicts between projects

Essential tools:
  python3       ← interpreter
  pip           ← package manager
  venv          ← virtual environment
  IDE           ← VS Code with Python extension
  Jupyter       ← interactive notebooks (data science)
\`\`\`

### 🔧 Verification Checklist

| Command | Expected Output |
|---|---|
| \`python3 --version\` | Python 3.11+ |
| \`pip --version\` | pip 23+ |
| \`python3 -c "import sys; print(sys.executable)"\` | Your Python path |
| \`python3 -c "2+2"\` | (no error = working) |

### 🌐 Virtual Environments — Why They Matter

\`\`\`
Project A (Django 4.2, numpy 1.24)
  └── venv_a/  ← isolated environment

Project B (Django 3.2, numpy 1.23)
  └── venv_b/  ← separate environment

Without venv: Installing numpy 1.24 for A breaks B!
With venv:    Each project has its OWN numpy version.
\`\`\``),
    code("bash", `# ── Python environment setup (Ubuntu/WSL) ─────────────

# 1. Install Python 3
sudo apt update && sudo apt install python3 python3-pip python3-venv

# 2. Verify installation
python3 --version         # Python 3.11.x
pip3 --version            # pip 23.x

# 3. Create a project with virtual environment
mkdir my-python-project && cd my-python-project
python3 -m venv venv      # create virtual env in ./venv/
source venv/bin/activate  # activate (Linux/Mac)
# .\venv\Scripts\activate  ← Windows

# 4. Your terminal prompt changes:
# (venv) user@machine:~/my-python-project$

# 5. Install packages inside the venv
pip install requests pandas numpy

# 6. Save dependencies
pip freeze > requirements.txt

# 7. To reproduce on another machine:
# pip install -r requirements.txt

# 8. Test the installation
python3 -c "import pandas as pd; print(pd.__version__)"

# 9. Deactivate when done
deactivate`, "Python environment setup and virtual environment workflow"),
    quiz("What is the purpose of a Python virtual environment?",
      ["It makes Python code run faster", "It creates an isolated environment with its own packages to avoid conflicts between projects", "It uploads your code to the cloud automatically", "It checks your code for syntax errors"], 1,
      "Virtual environments isolate dependencies — Project A can use Django 4.2 while Project B uses Django 3.2 on the same machine, without conflicts. Always create a venv before installing packages for a project."),
    check(
      "I have installed Python 3.11+ and verified with python3 --version",
      "I can create and activate a virtual environment",
      "I can install packages with pip and save them to requirements.txt",
      "I have run my first Python script successfully",
    ),
  ]),

  "seed-node-seed-track-quality-assurance-0": lo1("seed-node-seed-track-quality-assurance-0", [
    text(`## QA Fundamentals — Quality is Not an Afterthought

Quality Assurance is the systematic process of ensuring software meets requirements before it reaches users.

### 🔍 QA vs Testing vs QC

\`\`\`
QA (Quality Assurance):
  Process-focused: "Are we building it the right way?"
  Prevention-oriented
  Applies to the WHOLE development lifecycle

Testing:
  Product-focused: "Does the product work correctly?"
  Detection-oriented
  Applied to the BUILT product

QC (Quality Control):
  Inspection-focused: "Does this specific version meet standards?"
  Often manual review, release gates
\`\`\`

### 🧪 Testing Pyramid

\`\`\`
            ╱───────╲
           ╱  E2E    ╲   ← Slow, expensive, few
          ╱  (10%)    ╲
         ╱─────────────╲
        ╱  Integration  ╲  ← Medium speed & cost
       ╱    (30%)        ╲
      ╱───────────────────╲
     ╱      Unit Tests     ╲  ← Fast, cheap, many
    ╱        (60%)          ╲
   ╱───────────────────────────╲

Unit tests:        Test individual functions in isolation
Integration tests: Test that components work together
E2E tests:         Test complete user journeys through the UI
\`\`\`

### 📋 QA Process in Agile

| Phase | QA Activity |
|---|---|
| Requirements | Review user stories for testability |
| Design | Identify test scenarios |
| Development | Write tests alongside code (TDD) |
| Testing | Execute tests, log bugs |
| Release | Regression testing, sign-off |`),
    code("javascript", `// ── Unit testing with Jest ──────────────────────────────
// Function to test
function calculateGrade(score) {
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

// Test file: calculateGrade.test.js
describe('calculateGrade', () => {
  // Happy path
  test('returns A for score >= 80', () => {
    expect(calculateGrade(80)).toBe('A');
    expect(calculateGrade(95)).toBe('A');
    expect(calculateGrade(100)).toBe('A');
  });

  test('returns F for score < 50', () => {
    expect(calculateGrade(49)).toBe('F');
    expect(calculateGrade(0)).toBe('F');
  });

  // Edge cases (boundaries are where bugs hide!)
  test('handles boundary values correctly', () => {
    expect(calculateGrade(79)).toBe('B');  // just below A
    expect(calculateGrade(80)).toBe('A');  // exactly A
    expect(calculateGrade(50)).toBe('D');  // exactly D
    expect(calculateGrade(49)).toBe('F');  // just below D
  });
});

// Run: npx jest calculateGrade.test.js`, "Unit tests with Jest — including boundary value testing"),
    quiz("In the Testing Pyramid, why should Unit Tests make up the LARGEST proportion (60%+)?",
      ["They are the most impressive to show clients", "They are fast, cheap to write/run, and catch issues closest to the code where they're cheapest to fix", "They test the full user journey", "They require the least technical knowledge to write"], 1,
      "Unit tests run in milliseconds and test individual functions in isolation. They catch bugs at the lowest level where they're cheapest to fix. E2E tests are 100-1000x slower and more brittle — use them sparingly."),
    check(
      "I can explain the difference between QA, Testing and QC",
      "I can draw and explain the Testing Pyramid",
      "I have written unit tests using Jest covering happy paths and edge cases",
      "I understand Test-Driven Development (TDD) — write test first, then code",
    ),
  ]),

  // ══════════════════════════════════════════════════════════════════════════════
  // LEVEL 5 — CCM (condensed but substantive)
  // ══════════════════════════════════════════════════════════════════════════════

  "seed-node-seed-track-organise-a-business-l5-0": lo1("seed-node-seed-track-organise-a-business-l5-0", [
    text(`## Business Organisation for Tech Leaders

At Level 5, you may find yourself leading a startup or a team. Understanding how organisations work makes you a better technical leader.

### 🏢 Organisational Structures

| Structure | Shape | Best for |
|---|---|---|
| **Flat** | Few layers, wide spans | Startups, creative teams |
| **Hierarchical** | Many layers, narrow spans | Large enterprises, government |
| **Matrix** | Dual reporting lines | Projects + functions simultaneously |
| **Agile/Squad** | Cross-functional pods | Tech companies (Spotify model) |

### 📊 The Spotify Engineering Model

\`\`\`
SQUAD (8 people)          ← Autonomous team, one product area
  ├── TRIBE (100 people)  ← Group of related squads
  │   └── CHAPTER         ← Same role across squads (engineers)
  └── GUILD               ← Community of practice (JS devs company-wide)

Benefits:
  • Fast decisions (each squad owns their product)
  • Knowledge sharing (guilds)
  • Accountability (tribes)
\`\`\``),
    quiz("What is the main advantage of a flat organisational structure?",
      ["It provides more management positions for career growth", "Faster decision-making and better communication with fewer layers", "It works best for companies with thousands of employees", "It provides clearer lines of authority"], 1,
      "Flat structures have fewer layers between leadership and execution. Decisions get made faster, communication is clearer, and employees feel more empowered — key advantages for fast-moving tech companies."),
    check("I can draw and compare 3 organisational structures", "I understand the Spotify squad model", "I can identify which structure suits a given organisation type"),
  ]),

  "seed-node-seed-track-civic-attitudes-harmony-l5-0": lo1("seed-node-seed-track-civic-attitudes-harmony-l5-0", [
    text(`## Civic Harmony & ICT Ethics

As a Level 5 ICT professional, your technology decisions affect real people. Civic harmony begins with responsible digital citizenship.

### 🤝 Ubuntu Philosophy in Tech

\`\`\`
"I am because we are" (Ubuntu)

Applied to technology:
  • Build for everyone, not just tech-savvy users
  • Design accessible interfaces (WCAG compliance)
  • Consider digital inclusion (low bandwidth, older devices)
  • Data privacy = respect for human dignity
  • Algorithmic fairness = equal treatment in code
\`\`\`

### ⚖️ Rwanda's Digital Ethics Framework

| Principle | Technical Implication |
|---|---|
| Privacy | GDPR-compliant data handling |
| Transparency | Open algorithms, explainable AI |
| Security | Protect citizen data from breaches |
| Inclusion | Apps work on low-end Android |
| Non-discrimination | No bias in ML training data |

> 💡 The code you write IS policy. A loan algorithm that discriminates by neighbourhood is as unjust as a law that does the same.`),
    quiz("Which of the following BEST demonstrates digital civic responsibility?",
      ["Building the fastest app regardless of data privacy", "Collecting maximum user data for better personalisation", "Designing accessible, privacy-respecting software that works on low-end devices", "Keeping algorithms proprietary to protect your competitive advantage"], 2,
      "Civic responsibility in technology means designing for ALL citizens — including those with disabilities, older devices, or slow internet. Privacy-respecting and accessible design is not just ethical, it's increasingly a legal requirement."),
    check("I can explain Ubuntu philosophy and its application to technology", "I understand Rwanda's digital ethics framework", "I design apps with accessibility and inclusion in mind"),
  ]),

  "seed-node-seed-track-english-at-workplace-l5-0": lo1("seed-node-seed-track-english-at-workplace-l5-0", [
    text(`## Upper-Intermediate English for Tech Professionals

At Level 5, you communicate with international teams, clients, and open-source communities — all in English.

### 🌍 Technical Communication Contexts

| Context | Register | Key skills |
|---|---|---|
| GitHub PR description | Semi-formal, precise | Clarity, technical accuracy |
| Client email | Formal, diplomatic | Tone, brevity, action-orientation |
| Slack/Teams | Informal, async | Clarity without face-to-face cues |
| Technical presentation | Formal, confident | Structure, visual aids, Q&A |
| Job interview | Professional | STAR method, vocabulary |

### 💬 Hedging Language in Technical Discussions

\`\`\`
Too certain (risky):   "This will solve the problem."
Too uncertain (weak):  "I don't know if maybe this could..."
Calibrated hedging:    "Based on my analysis, this approach
                        should resolve the issue in most cases."

Hedging phrases:
  "The data suggests..."         "In most scenarios..."
  "One possible approach is..."  "This is likely to..."
  "From a performance standpoint..." "This may be related to..."
\`\`\``),
    quiz("In professional technical English, 'hedging' language is used to:",
      ["Avoid taking any position on technical matters", "Express appropriate uncertainty and avoid overcommitting to claims you can't fully prove", "Make your writing sound more informal", "Impress clients with complex vocabulary"], 1,
      "Hedging is calibrated confidence — neither overconfident ('will fix everything') nor evasive ('maybe perhaps'). 'The logs suggest a memory leak in the auth service' is precise and professionally hedged."),
    check("I can write a professional PR description in English", "I use hedging language appropriately in technical discussions", "I can give a 5-minute technical presentation in English with Q&A"),
  ]),

  "seed-node-seed-track-fran-ais-l5-0": lo1("seed-node-seed-track-fran-ais-l5-0", [
    text(`## Échange d'idées en français élémentaire au travail

À ce niveau, vous participez à des discussions professionnelles en français : réunions techniques, présentations, et négociations simples.

### 💼 Vocabulaire des réunions techniques

| Français | English | Contexte |
|---|---|---|
| "Je propose que..." | "I suggest that..." | Making proposals |
| "Il faut tenir compte de..." | "We must take into account..." | Raising concerns |
| "En ce qui concerne..." | "Regarding..." | Introducing a topic |
| "Pour conclure..." | "In conclusion..." | Ending discussion |
| "Pouvez-vous développer?" | "Can you elaborate?" | Asking for more info |

### 📋 Structure d'une présentation technique

\`\`\`
1. Introduction    (10%):  Contexte et objectif
2. Problème        (20%):  Ce que nous résolvons
3. Solution        (40%):  Notre approche technique
4. Résultats       (20%):  Données et démonstration
5. Conclusion      (10%):  Prochaines étapes et questions
\`\`\``),
    quiz("Quelle phrase utiliseriez-vous pour introduire une objection lors d'une réunion technique en français?",
      ["\"C'est nul\"", "\"Cependant, il convient de noter que cette approche présente un risque de...\"", "\"Je ne suis pas d'accord du tout\"", "\"On s'en fiche\""], 1,
      "L'expression \"Il convient de noter que...\" est professionnelle et diplomatique — elle introduit une objection ou une réserve sans attaquer la proposition. C'est le registre attendu en milieu professionnel."),
    check("Je peux présenter un projet technique en français de façon structurée", "Je maîtrise le vocabulaire des réunions techniques en français", "Je peux exprimer un désaccord de façon diplomatique en français"),
  ]),

  "seed-node-seed-track-ict-at-workplace-l5-0": lo1("seed-node-seed-track-ict-at-workplace-l5-0", [
    text(`## Advanced ICT Tools at the Workplace

Level 5 ICT professionals don't just use tools — they choose, configure and optimise them for their teams.

### 🛠️ DevOps Tool Ecosystem

\`\`\`
Source Control:      GitHub / GitLab / Bitbucket
CI/CD Pipelines:     GitHub Actions / Jenkins / CircleCI
Containerisation:    Docker + Kubernetes
Cloud Providers:     AWS / Google Cloud / Azure
Monitoring:          Grafana + Prometheus / Datadog
Communication:       Slack + Jira + Confluence
Security Scanning:   Snyk / SonarQube / OWASP ZAP
\`\`\`

### 📊 Selecting Tools — Decision Framework

| Criterion | Questions to ask |
|---|---|
| **Fit** | Does it solve our specific problem? |
| **Integration** | Does it work with our existing stack? |
| **Cost** | Free tier? Per-user pricing? Enterprise? |
| **Learning curve** | Can the team learn it quickly? |
| **Vendor lock-in** | Can we switch later if needed? |
| **Community** | Good documentation and support? |`),
    quiz("What is the PRIMARY risk of vendor lock-in when selecting cloud services?",
      ["The vendor will raise prices and you'll have limited ability to switch", "Your code will stop working immediately", "You must rewrite everything in a different language", "The vendor will steal your source code"], 0,
      "Vendor lock-in means dependency on a single provider's proprietary APIs and services. When they raise prices or discontinue a service, migrating is expensive and risky. Use portable, open standards where possible."),
    check("I can evaluate a new tool using the decision framework", "I understand the risk of vendor lock-in and design for portability", "I have set up at least one CI/CD pipeline for automated testing"),
  ]),

  "seed-node-seed-track-kiswahili-l5-0": lo1("seed-node-seed-track-kiswahili-l5-0", [
    text(`## Kiswahili cha Kazini — Mawasiliano ya Kitaaluma

Kiswahili ni lugha inayoendelea kukua Afrika Mashariki kama lugha ya biashara na teknolojia.

### 📚 Msamiati wa Teknolojia kwa Kiswahili

| Kiswahili | English | Mfano wa sentensi |
|---|---|---|
| programu | software | "Programu hii ni bora sana" |
| maunzi | hardware | "Maunzi ya kompyuta yamevunjika" |
| mtandao | network/internet | "Mtandao hauna kasi" |
| data / takwimu | data | "Takwimu zinaonyesha..." |
| hifadhi | database/storage | "Hifadhi imejaa" |
| msimbo | code | "Msimbo una hitilafu" |
| msanidi | developer | "Mimi ni msanidi programu" |

### 💬 Mazungumzo ya Kikao cha Kikosi

\`\`\`
Mwanzo:    "Habari za asubuhi. Leo tutazungumza kuhusu..."
Mwili:     "Nilifanya kazi kwenye... leo nitafanya..."
Tatizo:    "Nina kizuizi: ..." / "Nahitaji msaada wa..."
Mwisho:    "Asante kwa muda wenu. Kikao kimekwisha."
\`\`\``),
    quiz("Neno \"msimbo\" kwa Kiswahili linamaanisha nini katika teknolojia?",
      ["Hardware", "Internet", "Code (msimbo wa programu)", "Mtandao"], 2,
      "\"Msimbo\" ni neno la Kiswahili kwa 'code' katika programu. Kutumia maneno ya Kiswahili katika mazungumzo ya teknolojia kunasaidia kuendeleza lugha yetu katika sekta ya kidijitali."),
    check("Ninajua msamiati wa msingi wa teknolojia kwa Kiswahili", "Ninaweza kufanya mazungumzo ya kikao kwa Kiswahili", "Ninaweza kuandika barua pepe ya kitaaluma kwa Kiswahili"),
  ]),

  "seed-node-seed-track-ikinyarwanda-k-intyoza-l5-0": lo1("seed-node-seed-track-ikinyarwanda-k-intyoza-l5-0", [
    text(`## Ikinyarwanda k'Intyoza mu Bucuruzi bw'Ikoranabuhanga

Nk'inzobere mu ikoranabuhanga, ufite inshingano yo gutumanahana neza mu Kinyarwanda cy'intyoza — harimo mu bikorwa bya leta, imirimo, no guhagararira ikigo.

### 📝 Imiterere y'Inyandiko Zifite Agaciro

\`\`\`
Raporo y'Imikoreshereze ya Sisitemu

1. Incamake (Executive Summary)
   → Isobanura intego n'amakuru y'ingenzi

2. Inzira yakoreshejwe (Methodology)
   → Uburyo bwakoreshejwe mu gukusanya amakuru

3. Ibisozo (Findings)
   → Ibigeragezo n'ibikurikira

4. Impanuro (Recommendations)
   → Ibikenewe guhinduka

5. Isoza (Conclusion)
   → Incamake y'incamake

Inyandiko nziza: Isobanutse, ifite ibisubizo, kandi irerekana ubumenyi bwawe.
\`\`\``),
    quiz("Mu raporo y'akazi, ni ikihe gikorwa cy'incamake (executive summary) kigira?",
      ["Gusobanura imikoreshereze yose buri move buri move", "Gutanga incamake ngufi y'intego, ibibazo, n'impanuro z'ingenzi", "Gukora raporo ndende kurushaho", "Gushyiraho amazina y'abashinzwe raporo"], 1,
      "Incamake ngufi (executive summary) igomba kuba ngufi kandi igaragarize umusomyi intego, ibibazo by'ingenzi, n'impanuro mu magambo make. Ni yo isomwa mbere — kandi kenshi ni yo isomwa gusa."),
    check("Nshoboye kwandika raporo y'inzobere mu Kinyarwanda cy'intyoza", "Nkoresha imiterere y'incamake ngufi neza", "Nshoboye guhagararira ikigo cyanjye mu magambo y'Ikinyarwanda cy'intyoza"),
  ]),

  "seed-node-seed-track-professional-multicultural-ethics-l5-0": lo1("seed-node-seed-track-professional-multicultural-ethics-l5-0", [
    text(`## Professional Ethics for Software Engineers

Every technical decision carries ethical weight. From algorithm design to data handling, engineers shape society.

### ⚖️ Core Engineering Ethics Principles

| Principle | In practice |
|---|---|
| **Public interest first** | Build secure, accessible systems |
| **Competence** | Only claim expertise you have; keep learning |
| **Honesty** | Accurate estimates, honest about limitations |
| **Fairness** | No discrimination in algorithms or hiring |
| **Professional integrity** | Refuse unethical requests |
| **Confidentiality** | Protect client and user data |

### 🌍 Multicultural Competence in Tech Teams

\`\`\`
Dimensions of Cultural Difference (Hofstede):
─────────────────────────────────────────────
Power Distance:      How much inequality is accepted?
Individualism:       Team vs. individual goals?
Uncertainty Avoidance: Comfort with ambiguity?
Long-term Orientation: Short-term results vs. long vision?

In distributed tech teams:
  • High power distance → explicit hierarchy; title matters
  • Low power distance  → flat teams; anyone challenges anyone
  • High uncertainty avoidance → want detailed specs upfront
  • Low uncertainty avoidance  → comfortable with agile ambiguity
\`\`\`

### 🚨 When to Refuse a Technical Request

Refuse when asked to:
- Build surveillance tools for monitoring citizens without consent
- Create algorithms that discriminate by race, gender, disability
- Store passwords in plain text
- Access data without proper authorisation
- Deploy deliberately insecure systems`),
    quiz("A client asks you to build a system that secretly monitors employees' personal emails. What is the ethical response?",
      ["Build it because the client pays your salary", "Build it but add a disclaimer in the code", "Refuse clearly and explain the legal and ethical violations", "Build a prototype and let the client decide"], 2,
      "Professional engineers refuse requests that violate privacy law, professional ethics codes, and human rights. 'The client pays me' is never justification for building tools that harm people. Your professional reputation and legal liability are real."),
    check(
      "I can name the 6 core engineering ethics principles",
      "I understand Hofstede's cultural dimensions and their impact on teams",
      "I can identify and articulate at least 3 scenarios where I must refuse a technical request",
    ),
  ]),

}; // end CONTENT map

// ─── Seed runner ──────────────────────────────────────────────────────────────

async function main() {
  const nodeIds = Object.keys(CONTENT);
  console.log(`\nSeeding content for ${nodeIds.length} nodes (LO1)…\n`);

  // Batch update — collect all promises
  const updates = nodeIds.map(nodeId => {
    const blocks = CONTENT[nodeId];
    return prisma.skillNode.updateMany({
      where: { id: nodeId },
      data: { blocks: blocks as object },
    });
  });

  const results = await Promise.all(updates);
  const updated = results.reduce((sum, r) => sum + r.count, 0);

  console.log(`✓ Updated ${updated} nodes with LO1 content.\n`);
  console.log('Summary:');
  for (const id of nodeIds) {
    const blockCount = Object.values(CONTENT[id]).flat().length;
    console.log(`  ${id.replace('seed-node-seed-track-', '')} → ${blockCount} blocks`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
