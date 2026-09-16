/**
 * Seed the Competency Passport SkillTrack + SkillNode rows.
 *
 * Structure mirrors the official RUNDA TSS curriculum folder:
 *   Level 3 → Specific | General | CCM
 *   Level 4 → Specific | General | CCM
 *   Level 5 → Specific | General | CCM
 *
 * Run:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-passport.ts
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ─── Track definitions ────────────────────────────────────────────────────────
// Each track maps to one SkillTrack row. The `nodes` array creates SkillNode
// rows (learning checkpoints the student marks as done / verified).

type NodeDef = { title: string; description: string; xpReward: number; order: number };
type TrackDef = {
  name: string; description: string; tier: string;
  icon: string; order: number; moduleCode: string;
  moduleType: "specific" | "general" | "ccm";
  nodes: NodeDef[];
};

// ─── LEVEL 3 — Specific ──────────────────────────────────────────────────────
const L3_SPECIFIC: TrackDef[] = [
  {
    name: "Web Development", moduleCode: "L3-WEB", tier: "l3", icon: "🌐", order: 0, moduleType: "specific",
    description: "Build real websites using HTML, CSS and JavaScript.",
    nodes: [
      { title: "HTML Structure & Semantics", description: "Write valid HTML5 with semantic tags.", xpReward: 10, order: 0 },
      { title: "CSS Layouts & Responsive Design", description: "Flexbox, Grid, media queries.", xpReward: 10, order: 1 },
      { title: "JavaScript Fundamentals", description: "Variables, functions, DOM manipulation.", xpReward: 15, order: 2 },
      { title: "Build a Portfolio Website", description: "Deploy a static portfolio to GitHub Pages.", xpReward: 25, order: 3 },
    ],
  },
  {
    name: "JavaScript Fundamentals", moduleCode: "L3-JS", tier: "l3", icon: "🟨", order: 1, moduleType: "specific",
    description: "Master JavaScript: syntax, ES6+, async, and browser APIs.",
    nodes: [
      { title: "Variables, Types & Operators", description: "var/let/const, type coercion, operators.", xpReward: 10, order: 0 },
      { title: "Functions & Scope", description: "Arrow functions, closures, hoisting.", xpReward: 10, order: 1 },
      { title: "DOM & Events", description: "querySelector, addEventListener, delegation.", xpReward: 15, order: 2 },
      { title: "Async JavaScript", description: "Promises, async/await, fetch.", xpReward: 15, order: 3 },
      { title: "Build a JS Web App", description: "Complete interactive web application.", xpReward: 25, order: 4 },
    ],
  },
  {
    name: "Game Development in Vue Framework", moduleCode: "L3-GAME", tier: "l3", icon: "🎮", order: 2, moduleType: "specific",
    description: "Build browser games using Vue.js framework.",
    nodes: [
      { title: "Vue.js Basics", description: "Components, props, reactive data.", xpReward: 10, order: 0 },
      { title: "Game Loop & Rendering", description: "Canvas, requestAnimationFrame, game loop.", xpReward: 15, order: 1 },
      { title: "Player & Physics", description: "Keyboard input, collision detection.", xpReward: 15, order: 2 },
      { title: "Complete Game Project", description: "Ship a playable game with score and levels.", xpReward: 30, order: 3 },
    ],
  },
  {
    name: "UX Design", moduleCode: "L3-UX", tier: "l3", icon: "🎨", order: 3, moduleType: "specific",
    description: "Apply user-centred design: research, wireframes, prototyping and usability.",
    nodes: [
      { title: "User Research & Personas", description: "Interviews, surveys, user personas.", xpReward: 10, order: 0 },
      { title: "Information Architecture", description: "Sitemaps, user flows, card sorting.", xpReward: 10, order: 1 },
      { title: "Wireframing & Prototyping", description: "Lo-fi to hi-fi wireframes in Figma.", xpReward: 15, order: 2 },
      { title: "Usability Testing", description: "Run tests and iterate on feedback.", xpReward: 15, order: 3 },
      { title: "UX Case Study", description: "Document a full UX design project.", xpReward: 25, order: 4 },
    ],
  },
  {
    name: "Version Control", moduleCode: "L3-VCS", tier: "l3", icon: "🌿", order: 4, moduleType: "specific",
    description: "Master Git for source-code management and team collaboration.",
    nodes: [
      { title: "Git Basics", description: "init, add, commit, status, log.", xpReward: 10, order: 0 },
      { title: "Branches & Merging", description: "Branch, merge, rebase, resolve conflicts.", xpReward: 15, order: 1 },
      { title: "GitHub & Remote", description: "Push, pull, fork, pull requests.", xpReward: 15, order: 2 },
      { title: "Team Workflow", description: "Git Flow, CI basics, code reviews.", xpReward: 20, order: 3 },
    ],
  },
  {
    name: "Software Project Requirements Analysis", moduleCode: "L3-REQS", tier: "l3", icon: "📋", order: 5, moduleType: "specific",
    description: "Elicit, analyse and document software requirements.",
    nodes: [
      { title: "Requirements Elicitation", description: "Interviews, observation, use cases.", xpReward: 10, order: 0 },
      { title: "Functional & Non-Functional", description: "Classify and prioritise requirements.", xpReward: 10, order: 1 },
      { title: "Use Cases & User Stories", description: "Write user stories and acceptance criteria.", xpReward: 15, order: 2 },
      { title: "Requirements Document", description: "Produce a complete SRS document.", xpReward: 20, order: 3 },
    ],
  },
];

// ─── LEVEL 3 — General ───────────────────────────────────────────────────────
const L3_GENERAL: TrackDef[] = [
  {
    name: "Apply Graphic Design", moduleCode: "L3-GD", tier: "l3", icon: "🖼️", order: 6, moduleType: "general",
    description: "Apply graphic design principles to create visual media.",
    nodes: [
      { title: "Design Principles", description: "Balance, contrast, hierarchy, colour.", xpReward: 10, order: 0 },
      { title: "Typography", description: "Typefaces, hierarchy, pairing.", xpReward: 10, order: 1 },
      { title: "Digital Tools", description: "Photoshop/GIMP, Illustrator/Inkscape.", xpReward: 15, order: 2 },
      { title: "Design Project", description: "Produce a complete visual design brief.", xpReward: 20, order: 3 },
    ],
  },
  {
    name: "Fundamental Algebra and Trigonometry", moduleCode: "GENFT302", tier: "l3", icon: "📐", order: 7, moduleType: "general",
    description: "Apply algebraic and trigonometric principles for ICT problem-solving.",
    nodes: [
      { title: "Algebra Fundamentals", description: "Equations, inequalities, factorisation.", xpReward: 10, order: 0 },
      { title: "Functions & Graphs", description: "Linear, quadratic, exponential functions.", xpReward: 10, order: 1 },
      { title: "Trigonometry Basics", description: "Sine, cosine, tangent, unit circle.", xpReward: 10, order: 2 },
      { title: "Applied Problems", description: "Solve ICT-relevant mathematical problems.", xpReward: 15, order: 3 },
    ],
  },
  {
    name: "Apply General Physics", moduleCode: "GENGP302", tier: "l3", icon: "⚛️", order: 8, moduleType: "general",
    description: "Apply fundamental physics concepts relevant to ICT and electronics.",
    nodes: [
      { title: "Electricity & Circuits", description: "Ohm's law, series/parallel circuits.", xpReward: 10, order: 0 },
      { title: "Waves & Signals", description: "Frequency, wavelength, electromagnetic.", xpReward: 10, order: 1 },
      { title: "Energy & Power", description: "Work, power, energy conversion.", xpReward: 10, order: 2 },
    ],
  },
];

// ─── LEVEL 3 — CCM ───────────────────────────────────────────────────────────
const L3_CCM: TrackDef[] = [
  {
    name: "Entrepreneurship (L3)", moduleCode: "CCMBC302", tier: "l3", icon: "💡", order: 9, moduleType: "ccm",
    description: "Develop entrepreneurial mindset and basic business skills.",
    nodes: [
      { title: "Business Idea Generation", description: "Brainstorm and validate a business idea.", xpReward: 10, order: 0 },
      { title: "Basic Business Plan", description: "Structure a simple business plan.", xpReward: 10, order: 1 },
      { title: "Financial Literacy", description: "Income, expenses, profit and loss basics.", xpReward: 10, order: 2 },
    ],
  },
  {
    name: "ICT (L3)", moduleCode: "CCMCL302", tier: "l3", icon: "💻", order: 10, moduleType: "ccm",
    description: "Apply ICT tools and digital literacy in a professional context.",
    nodes: [
      { title: "Digital Tools & Productivity", description: "Office suite, cloud storage, email.", xpReward: 10, order: 0 },
      { title: "Internet & Online Safety", description: "Search, cybersecurity, digital ethics.", xpReward: 10, order: 1 },
    ],
  },
  {
    name: "Citizenship (L3)", moduleCode: "CCMCZ301", tier: "l3", icon: "🇷🇼", order: 11, moduleType: "ccm",
    description: "Understand civic responsibilities, governance and community engagement.",
    nodes: [
      { title: "Civic Rights & Responsibilities", description: "Rights, duties and community roles.", xpReward: 10, order: 0 },
      { title: "Governance & Institutions", description: "Government structure, rule of law.", xpReward: 10, order: 1 },
    ],
  },
  {
    name: "English (L3)", moduleCode: "CCMEN302", tier: "l3", icon: "🇬🇧", order: 12, moduleType: "ccm",
    description: "Communicate effectively in English for the workplace.",
    nodes: [
      { title: "Reading Comprehension", description: "Extract meaning from professional texts.", xpReward: 10, order: 0 },
      { title: "Writing Skills", description: "Emails, reports, documentation.", xpReward: 10, order: 1 },
      { title: "Speaking & Listening", description: "Presentations, workplace conversations.", xpReward: 10, order: 2 },
    ],
  },
  {
    name: "Français (L3)", moduleCode: "CCMFT302", tier: "l3", icon: "🇫🇷", order: 13, moduleType: "ccm",
    description: "Communiquer en français dans un contexte professionnel.",
    nodes: [
      { title: "Compréhension écrite", description: "Lire et comprendre des textes professionnels.", xpReward: 10, order: 0 },
      { title: "Expression écrite", description: "Rédiger emails et rapports en français.", xpReward: 10, order: 1 },
    ],
  },
  {
    name: "Safety, Health and Environment (L3)", moduleCode: "CCMHE303", tier: "l3", icon: "🦺", order: 14, moduleType: "ccm",
    description: "Apply safety, health and environmental practices at the workplace.",
    nodes: [
      { title: "Workplace Safety", description: "Hazard identification and risk assessment.", xpReward: 10, order: 0 },
      { title: "Health & Ergonomics", description: "Ergonomic practices, first aid basics.", xpReward: 10, order: 1 },
      { title: "Environmental Practices", description: "Waste management, sustainability.", xpReward: 10, order: 2 },
    ],
  },
  {
    name: "Ikinyarwanda Kiboneye (L3)", moduleCode: "CCMKN302", tier: "l3", icon: "🗣️", order: 15, moduleType: "ccm",
    description: "Gukoresha Ikinyarwanda neza mu kazi.",
    nodes: [
      { title: "Umuvugo n'Inyandiko", description: "Soma no kwerekana inyandiko z'akazi.", xpReward: 10, order: 0 },
      { title: "Ibibazo by'akazi", description: "Ibibazo no gutumanahana mu kazi.", xpReward: 10, order: 1 },
    ],
  },
  {
    name: "Occupation and Learning Process (L3)", moduleCode: "CCMOL302", tier: "l3", icon: "📚", order: 16, moduleType: "ccm",
    description: "Understand the learning process and professional development.",
    nodes: [
      { title: "Learning Strategies", description: "Study methods, self-assessment.", xpReward: 10, order: 0 },
      { title: "Professional Development", description: "Career planning, continuous learning.", xpReward: 10, order: 1 },
    ],
  },
  {
    name: "Industrial Attachment Program (L3)", moduleCode: "ICTIA302", tier: "l3", icon: "🏭", order: 17, moduleType: "ccm",
    description: "Apply skills in a real industry environment during attachment.",
    nodes: [
      { title: "Workplace Readiness", description: "Professional conduct and expectations.", xpReward: 15, order: 0 },
      { title: "Attachment Report", description: "Document your industrial experience.", xpReward: 20, order: 1 },
    ],
  },
];

// ─── LEVEL 4 — Specific ──────────────────────────────────────────────────────
const L4_SPECIFIC: TrackDef[] = [
  {
    name: "Backend Application Development", moduleCode: "SWDBD401", tier: "l4", icon: "⚙️", order: 0, moduleType: "specific",
    description: "Develop a backend application using Node.js — RESTful APIs, security, testing and deployment.",
    nodes: [
      { title: "Node.js Environment Setup", description: "Install Node.js, NPM, Express, Postman.", xpReward: 10, order: 0 },
      { title: "Building RESTful APIs", description: "HTTP methods, routes, CRUD with MySQL.", xpReward: 20, order: 1 },
      { title: "Middleware & Validation", description: "Body parser, CORS, error handlers, Joi.", xpReward: 15, order: 2 },
      { title: "Authentication & JWT", description: "bcrypt, JWT sign/verify, role-based access.", xpReward: 20, order: 3 },
      { title: "Testing Backend", description: "Mocha/Chai, Supertest, npm audit.", xpReward: 15, order: 4 },
      { title: "Deploy & Document API", description: "PM2, Railway/Render, Swagger docs.", xpReward: 20, order: 5 },
    ],
  },
  {
    name: "Backend System Design", moduleCode: "SWDBS401", tier: "l4", icon: "🏗️", order: 1, moduleType: "specific",
    description: "Design scalable backend architectures: MVC, APIs, caching and microservices basics.",
    nodes: [
      { title: "MVC Architecture", description: "Model-View-Controller pattern with Express.", xpReward: 15, order: 0 },
      { title: "API Design Principles", description: "REST, versioning, status codes, documentation.", xpReward: 15, order: 1 },
      { title: "Database Design", description: "Schema, normalisation, ER diagrams.", xpReward: 15, order: 2 },
      { title: "Caching & Performance", description: "Redis basics, query optimisation.", xpReward: 15, order: 3 },
      { title: "System Design Project", description: "Design a complete backend system.", xpReward: 30, order: 4 },
    ],
  },
  {
    name: "Data Structure and Algorithm Fundamentals", moduleCode: "SWDDA401", tier: "l4", icon: "🔢", order: 2, moduleType: "specific",
    description: "Implement and analyse data structures and algorithms using JavaScript.",
    nodes: [
      { title: "Algorithm Complexity", description: "Big-O notation, time & space complexity.", xpReward: 15, order: 0 },
      { title: "Arrays, Linked Lists, Stacks", description: "Implement and use linear data structures.", xpReward: 15, order: 1 },
      { title: "Trees & Graphs", description: "BST, BFS, DFS, tree traversal.", xpReward: 15, order: 2 },
      { title: "Sorting & Searching", description: "Merge sort, quick sort, binary search.", xpReward: 15, order: 3 },
      { title: "Algorithm Design Patterns", description: "Dynamic programming, greedy, recursion.", xpReward: 20, order: 4 },
    ],
  },
  {
    name: "Database Development", moduleCode: "SWDDD401", tier: "l4", icon: "🗄️", order: 3, moduleType: "specific",
    description: "Design, implement and secure relational databases using MySQL.",
    nodes: [
      { title: "ERD & Requirements Analysis", description: "Entities, relationships, data dictionary.", xpReward: 10, order: 0 },
      { title: "Schema Design & Normalisation", description: "1NF, 2NF, 3NF, BCNF.", xpReward: 15, order: 1 },
      { title: "SQL Queries & Joins", description: "SELECT, INSERT, UPDATE, DELETE, JOINs.", xpReward: 15, order: 2 },
      { title: "Stored Procedures & Triggers", description: "CREATE PROCEDURE, triggers, views.", xpReward: 15, order: 3 },
      { title: "Database Security & Backup", description: "User roles, GRANT/REVOKE, mysqldump.", xpReward: 15, order: 4 },
    ],
  },
  {
    name: "PHP Programming", moduleCode: "SWDPP401", tier: "l4", icon: "🐘", order: 4, moduleType: "specific",
    description: "Develop dynamic web applications using PHP and MySQL.",
    nodes: [
      { title: "PHP Syntax & Basics", description: "Variables, arrays, functions, forms.", xpReward: 10, order: 0 },
      { title: "PHP & MySQL CRUD", description: "PDO, prepared statements, CRUD operations.", xpReward: 15, order: 1 },
      { title: "Sessions & Authentication", description: "Login system with sessions and cookies.", xpReward: 15, order: 2 },
      { title: "OOP in PHP", description: "Classes, inheritance, interfaces.", xpReward: 15, order: 3 },
      { title: "PHP Web Application", description: "Complete CRUD web app with PHP & MySQL.", xpReward: 25, order: 4 },
    ],
  },
  {
    name: "Windows Server Administration", moduleCode: "SWDWS401", tier: "l4", icon: "🖥️", order: 5, moduleType: "specific",
    description: "Install, configure and manage Windows Server environments.",
    nodes: [
      { title: "Windows Server Installation", description: "Install and configure Windows Server.", xpReward: 10, order: 0 },
      { title: "Active Directory & DNS", description: "Domain controller, users, groups.", xpReward: 15, order: 1 },
      { title: "File & Print Services", description: "Shares, permissions, printer management.", xpReward: 15, order: 2 },
      { title: "Security & Group Policy", description: "GPO, firewall, user access control.", xpReward: 15, order: 3 },
      { title: "Server Monitoring & Backup", description: "Event viewer, backups, performance.", xpReward: 15, order: 4 },
    ],
  },
];

// ─── LEVEL 4 — General ───────────────────────────────────────────────────────
const L4_GENERAL: TrackDef[] = [
  {
    name: "Basics of Networking", moduleCode: "GENBN401", tier: "l4", icon: "🌐", order: 6, moduleType: "general",
    description: "Apply fundamental networking principles for ICT infrastructure.",
    nodes: [
      { title: "OSI & TCP/IP Models", description: "Network layers, protocols, encapsulation.", xpReward: 10, order: 0 },
      { title: "IP Addressing & Subnetting", description: "IPv4, CIDR, subnet masks, VLSM.", xpReward: 15, order: 1 },
      { title: "Network Devices", description: "Switches, routers, hubs, firewalls.", xpReward: 10, order: 2 },
      { title: "Network Security Basics", description: "Firewalls, VPN, WPA2, threat overview.", xpReward: 15, order: 3 },
    ],
  },
  {
    name: "Apply Fundamental Mathematics Analysis", moduleCode: "GENFA402", tier: "l4", icon: "📊", order: 7, moduleType: "general",
    description: "Apply advanced mathematical analysis for software development.",
    nodes: [
      { title: "Calculus Basics", description: "Limits, derivatives, integration.", xpReward: 10, order: 0 },
      { title: "Linear Algebra", description: "Matrices, vectors, linear transformations.", xpReward: 10, order: 1 },
      { title: "Discrete Mathematics", description: "Logic, sets, combinatorics, graphs.", xpReward: 10, order: 2 },
    ],
  },
  {
    name: "Apply Mechanics and Properties of Matter", moduleCode: "GENMP402", tier: "l4", icon: "⚙️", order: 8, moduleType: "general",
    description: "Apply mechanical and material science principles to ICT hardware.",
    nodes: [
      { title: "Statics & Dynamics", description: "Forces, motion, equilibrium.", xpReward: 10, order: 0 },
      { title: "Properties of Materials", description: "Conductors, insulators, semiconductors.", xpReward: 10, order: 1 },
    ],
  },
];

// ─── LEVEL 4 — CCM ───────────────────────────────────────────────────────────
const L4_CCM: TrackDef[] = [
  {
    name: "Entrepreneurship (L4)", moduleCode: "CCMBP402", tier: "l4", icon: "💡", order: 9, moduleType: "ccm", description: "Develop entrepreneurial skills for ICT business creation.",
    nodes: [{ title: "Business Planning", description: "Business model canvas, feasibility study.", xpReward: 15, order: 0 },
    { title: "Marketing & Finance", description: "Pricing, promotion, cash flow basics.", xpReward: 15, order: 1 }]
  },
  {
    name: "ICT (L4)", moduleCode: "CCMCS402", tier: "l4", icon: "💻", order: 10, moduleType: "ccm", description: "Apply ICT tools in professional environments.",
    nodes: [{ title: "Productivity Software", description: "Advanced Office, collaboration tools.", xpReward: 10, order: 0 },
    { title: "Cloud & Collaboration", description: "Cloud services, project management tools.", xpReward: 10, order: 1 }]
  },
  {
    name: "English (L4)", moduleCode: "CCMEN402", tier: "l4", icon: "🇬🇧", order: 11, moduleType: "ccm", description: "Use intermediate English effectively at the workplace.",
    nodes: [{ title: "Technical Writing", description: "Reports, emails, documentation.", xpReward: 10, order: 0 },
    { title: "Professional Speaking", description: "Presentations, meetings, interviews.", xpReward: 10, order: 1 }]
  },
  {
    name: "Français (L4)", moduleCode: "CCMFT402", tier: "l4", icon: "🇫🇷", order: 12, moduleType: "ccm", description: "Communiquer en français dans le milieu professionnel.",
    nodes: [{ title: "Communication professionnelle", description: "Expression orale et écrite.", xpReward: 10, order: 0 }]
  },
  {
    name: "Industrial Attachment Program (L4)", moduleCode: "CCMIA402", tier: "l4", icon: "🏭", order: 13, moduleType: "ccm", description: "Apply skills in an industry placement environment.",
    nodes: [{ title: "Industry Placement", description: "Practical work experience in ICT.", xpReward: 20, order: 0 },
    { title: "Attachment Report", description: "Reflect and document the experience.", xpReward: 20, order: 1 }]
  },
  {
    name: "Ikinyarwanda (L4)", moduleCode: "CCMKN402", tier: "l4", icon: "🗣️", order: 14, moduleType: "ccm", description: "Gukoresha Ikinyarwanda mu kazi.",
    nodes: [{ title: "Inyandiko z'akazi", description: "Andika raporo no tumanahana mu kazi.", xpReward: 10, order: 0 }]
  },
  {
    name: "Citizenship (L4)", moduleCode: "CMCZ401", tier: "l4", icon: "🇷🇼", order: 15, moduleType: "ccm", description: "Apply civic values and democratic participation.",
    nodes: [{ title: "Democracy & Governance", description: "Civil participation, elections, rights.", xpReward: 10, order: 0 }]
  },
];

// ─── LEVEL 5 — Specific ──────────────────────────────────────────────────────
const L5_SPECIFIC: TrackDef[] = [
  {
    name: "Blockchain Fundamentals", moduleCode: "SWDBF501", tier: "l5", icon: "⛓️", order: 0, moduleType: "specific",
    description: "Understand and apply blockchain technology for decentralised applications.",
    nodes: [
      { title: "Blockchain Architecture", description: "Blocks, hashing, consensus mechanisms.", xpReward: 15, order: 0 },
      { title: "Smart Contracts", description: "Solidity basics, deploy on Ethereum.", xpReward: 20, order: 1 },
      { title: "DApps & Web3", description: "Connect frontend to smart contracts.", xpReward: 20, order: 2 },
      { title: "Blockchain Project", description: "Deploy a complete decentralised app.", xpReward: 30, order: 3 },
    ],
  },
  {
    name: "Front-End App Development with React.JS", moduleCode: "SWDFA501", tier: "l5", icon: "⚛️", order: 1, moduleType: "specific",
    description: "Develop modern React.js apps with Next.js, Tailwind CSS and PWA capabilities.",
    nodes: [
      { title: "React Fundamentals", description: "Components, props, state, hooks.", xpReward: 15, order: 0 },
      { title: "Advanced React Patterns", description: "Context, custom hooks, React Router v6.", xpReward: 15, order: 1 },
      { title: "Tailwind CSS", description: "Utility-first styling, responsive design.", xpReward: 10, order: 2 },
      { title: "Next.js App Router", description: "SSR, SSG, API routes, App Router.", xpReward: 20, order: 3 },
      { title: "PWA & Deployment", description: "Service workers, Vercel deployment.", xpReward: 20, order: 4 },
    ],
  },
  {
    name: "Integrate the Workplace", moduleCode: "SWDIA502", tier: "l5", icon: "🤝", order: 2, moduleType: "specific",
    description: "Integrate technical and professional skills in a real workplace context.",
    nodes: [
      { title: "Workplace Communication", description: "Professional communication and reporting.", xpReward: 10, order: 0 },
      { title: "Team & Project Management", description: "Agile, Scrum, task management tools.", xpReward: 15, order: 1 },
      { title: "Workplace Integration Project", description: "Deliver a team software project.", xpReward: 30, order: 2 },
    ],
  },
  {
    name: "Mobile App Development", moduleCode: "SWDMA501", tier: "l5", icon: "📱", order: 3, moduleType: "specific",
    description: "Build cross-platform mobile apps using React Native or Flutter.",
    nodes: [
      { title: "Mobile Dev Environment", description: "Setup React Native / Flutter, emulators.", xpReward: 10, order: 0 },
      { title: "UI Components & Navigation", description: "Screens, navigation, state management.", xpReward: 15, order: 1 },
      { title: "API Integration & Storage", description: "REST calls, AsyncStorage, SQLite.", xpReward: 15, order: 2 },
      { title: "Publish Mobile App", description: "Build APK/IPA and publish to store.", xpReward: 25, order: 3 },
    ],
  },
  {
    name: "Machine Learning Application", moduleCode: "SWDML501", tier: "l5", icon: "🤖", order: 4, moduleType: "specific",
    description: "Apply machine learning algorithms to real-world datasets using Python.",
    nodes: [
      { title: "Data Preprocessing", description: "Cleaning, feature engineering, scaling.", xpReward: 15, order: 0 },
      { title: "Supervised Learning", description: "Regression, classification, scikit-learn.", xpReward: 20, order: 1 },
      { title: "Unsupervised Learning", description: "K-Means, PCA, clustering.", xpReward: 15, order: 2 },
      { title: "Model Evaluation", description: "Accuracy, F1 score, cross-validation.", xpReward: 15, order: 3 },
      { title: "ML Project", description: "End-to-end ML pipeline on real data.", xpReward: 30, order: 4 },
    ],
  },
  {
    name: "NoSQL Database Development", moduleCode: "SWDND501", tier: "l5", icon: "🍃", order: 5, moduleType: "specific",
    description: "Design and implement NoSQL databases using MongoDB and other systems.",
    nodes: [
      { title: "NoSQL Concepts", description: "Document, key-value, graph databases.", xpReward: 10, order: 0 },
      { title: "MongoDB CRUD", description: "Collections, documents, aggregation.", xpReward: 15, order: 1 },
      { title: "Schema Design", description: "Embedding vs referencing, indexing.", xpReward: 15, order: 2 },
      { title: "MongoDB + Node.js", description: "Mongoose, REST API with MongoDB.", xpReward: 20, order: 3 },
    ],
  },
  {
    name: "DevOps Application", moduleCode: "SWDOT501", tier: "l5", icon: "🚀", order: 6, moduleType: "specific",
    description: "Apply DevOps practices: CI/CD, Docker, cloud deployment and monitoring.",
    nodes: [
      { title: "Linux & Shell Scripting", description: "Bash scripting, cron jobs, file management.", xpReward: 10, order: 0 },
      { title: "Docker & Containers", description: "Dockerfile, images, docker-compose.", xpReward: 20, order: 1 },
      { title: "CI/CD Pipelines", description: "GitHub Actions, automated testing/deploy.", xpReward: 20, order: 2 },
      { title: "Cloud Deployment", description: "AWS/GCP basics, serverless, monitoring.", xpReward: 25, order: 3 },
    ],
  },
];

// ─── LEVEL 5 — General ───────────────────────────────────────────────────────
const L5_GENERAL: TrackDef[] = [
  {
    name: "Mathematical Analysis, Statistics and Probability", moduleCode: "GENAP502", tier: "l5", icon: "📈", order: 7, moduleType: "general",
    description: "Apply advanced mathematical and statistical analysis for software engineering.",
    nodes: [
      { title: "Statistical Analysis", description: "Descriptive stats, distributions, sampling.", xpReward: 15, order: 0 },
      { title: "Probability Theory", description: "Events, Bayes theorem, random variables.", xpReward: 15, order: 1 },
      { title: "Applied Mathematics", description: "Numerical methods, optimisation.", xpReward: 15, order: 2 },
    ],
  },
  {
    name: "Apply Dynamics and Waves", moduleCode: "GENDW502", tier: "l5", icon: "🌊", order: 8, moduleType: "general",
    description: "Apply dynamics and wave principles relevant to ICT systems.",
    nodes: [
      { title: "Newton's Laws & Dynamics", description: "Forces, momentum, rotation.", xpReward: 10, order: 0 },
      { title: "Wave Properties", description: "Frequency, wavelength, signal propagation.", xpReward: 10, order: 1 },
    ],
  },
  {
    name: "Python Programming", moduleCode: "GENPP501", tier: "l5", icon: "🐍", order: 9, moduleType: "general",
    description: "Apply Python programming fundamentals: environment, basic programs and OOP.",
    nodes: [
      { title: "Python Environment Setup", description: "Install Python, IDE, virtual environment.", xpReward: 10, order: 0 },
      { title: "Python Basics", description: "Data types, control flow, functions, collections.", xpReward: 15, order: 1 },
      { title: "File Handling", description: "Read/write files, os, pathlib, pandas.", xpReward: 10, order: 2 },
      { title: "OOP in Python", description: "Classes, inheritance, polymorphism.", xpReward: 15, order: 3 },
      { title: "Python Libraries", description: "NumPy, Pandas, Matplotlib, automation.", xpReward: 15, order: 4 },
    ],
  },
  {
    name: "Quality Assurance", moduleCode: "GENQA501", tier: "l5", icon: "✅", order: 10, moduleType: "general",
    description: "Apply software quality assurance principles, testing and process improvement.",
    nodes: [
      { title: "QA Fundamentals", description: "Quality concepts, testing types, standards.", xpReward: 10, order: 0 },
      { title: "Test Planning & Cases", description: "Write test plans, test cases, checklists.", xpReward: 15, order: 1 },
      { title: "Automated Testing", description: "Jest, Cypress, CI integration.", xpReward: 20, order: 2 },
      { title: "QA Report", description: "Document test results and improvements.", xpReward: 15, order: 3 },
    ],
  },
];

// ─── LEVEL 5 — CCM ───────────────────────────────────────────────────────────
const L5_CCM: TrackDef[] = [
  {
    name: "Organise a Business (L5)", moduleCode: "CCMBO502", tier: "l5", icon: "🏢", order: 11, moduleType: "ccm", description: "Organise and manage a business unit effectively.",
    nodes: [{ title: "Business Organisation", description: "Structure, planning, resource management.", xpReward: 15, order: 0 }]
  },
  {
    name: "Civic Attitudes & Harmony (L5)", moduleCode: "CCMCZ501", tier: "l5", icon: "🇷🇼", order: 12, moduleType: "ccm", description: "Develop attitudes of living together in harmony.",
    nodes: [{ title: "Civic Harmony", description: "Unity, reconciliation, community values.", xpReward: 10, order: 0 }]
  },
  {
    name: "English at Workplace (L5)", moduleCode: "CCMEN502", tier: "l5", icon: "🇬🇧", order: 13, moduleType: "ccm", description: "Use upper-intermediate English at the workplace.",
    nodes: [{ title: "Upper-Intermediate English", description: "Technical English for professionals.", xpReward: 15, order: 0 },
    { title: "Professional Communication", description: "Meetings, negotiations, presentations.", xpReward: 15, order: 1 }]
  },
  {
    name: "Français (L5)", moduleCode: "CCMFT502", tier: "l5", icon: "🇫🇷", order: 14, moduleType: "ccm", description: "Échanger des idées en français élémentaire.",
    nodes: [{ title: "Échange d'idées", description: "Conversations professionnelles en français.", xpReward: 10, order: 0 }]
  },
  {
    name: "ICT at Workplace (L5)", moduleCode: "CCMIW502", tier: "l5", icon: "💻", order: 15, moduleType: "ccm", description: "Apply ICT tools and systems in the workplace.",
    nodes: [{ title: "Advanced ICT Tools", description: "Collaboration, automation, productivity.", xpReward: 10, order: 0 }]
  },
  {
    name: "Kiswahili (L5)", moduleCode: "CCMKK502", tier: "l5", icon: "🗣️", order: 16, moduleType: "ccm", description: "Kutumia Kiswahili katika mawasiliano ya kazini.",
    nodes: [{ title: "Kiswahili cha Kazini", description: "Mawasiliano ya kitaaluma kwa Kiswahili.", xpReward: 10, order: 0 }]
  },
  {
    name: "Ikinyarwanda k'intyoza (L5)", moduleCode: "CCMKN502", tier: "l5", icon: "🗣️", order: 17, moduleType: "ccm", description: "Gukoresha Ikinyarwanda k'intyoza mu kazi.",
    nodes: [{ title: "Ikinyarwanda cy'intyoza", description: "Inyandiko no gutumanahana by'intyoza.", xpReward: 10, order: 0 }]
  },
  {
    name: "Professional & Multicultural Ethics (L5)", moduleCode: "CCMPE502", tier: "l5", icon: "⚖️", order: 18, moduleType: "ccm", description: "Apply professional and multi-cultural ethics at workplace.",
    nodes: [{ title: "Professional Ethics", description: "Code of conduct, ethics, diversity.", xpReward: 15, order: 0 }]
  },
];

// ─── Seed runner ──────────────────────────────────────────────────────────────

const ALL_TRACKS: TrackDef[] = [
  ...L3_SPECIFIC, ...L3_GENERAL, ...L3_CCM,
  ...L4_SPECIFIC, ...L4_GENERAL, ...L4_CCM,
  ...L5_SPECIFIC, ...L5_GENERAL, ...L5_CCM,
];

async function main() {
  console.log(`\nSeeding ${ALL_TRACKS.length} skill tracks (batch mode)…\n`);

  // Delete in correct order (nodes first, then tracks)
  await prisma.skillNode.deleteMany({ where: { id: { startsWith: "seed-node-" } } });
  await prisma.skillTrack.deleteMany({ where: { id: { startsWith: "seed-track-" } } });

  function trackId(name: string) {
    return `seed-track-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
  }

  // Batch-insert all tracks in one query
  await prisma.skillTrack.createMany({
    data: ALL_TRACKS.map(t => ({
      id: trackId(t.name),
      name: t.name,
      description: t.description,
      tier: t.tier,
      icon: t.icon,
      order: t.order,
    })),
    skipDuplicates: true,
  });

  // Batch-insert all nodes in one query
  await prisma.skillNode.createMany({
    data: ALL_TRACKS.flatMap(t =>
      t.nodes.map(n => ({
        id: `seed-node-${trackId(t.name)}-${n.order}`,
        trackId: trackId(t.name),
        title: n.title,
        description: n.description,
        xpReward: n.xpReward,
        estimatedMinutes: 30,
        order: n.order,
        blocks: {},
      }))
    ),
    skipDuplicates: true,
  });

  for (const track of ALL_TRACKS) {
    const tier = track.tier.toUpperCase();
    const type = track.moduleType.toUpperCase().padEnd(8);
    console.log(`  [${tier}] [${type}] ${track.icon} ${track.name} (${track.nodes.length} nodes)`);
  }

  const trackCount = await prisma.skillTrack.count();
  const nodeCount = await prisma.skillNode.count();
  console.log(`\n✓ Done — ${trackCount} tracks, ${nodeCount} nodes in DB.\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
