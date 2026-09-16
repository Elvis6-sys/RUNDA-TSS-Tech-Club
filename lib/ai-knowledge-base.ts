/**
 * AI Knowledge Base System for RUNDA TSS Tech Club
 * 
 * This system provides comprehensive project knowledge to the AI assistant.
 * 
 * CRITICAL: Module-specific knowledge now comes from REAL parsed curriculum data
 * in lib/curriculum-data/ - NOT from this file!
 */

import { LearnModule } from './learnContent';
import {
  getAllModuleCodes,
  getModuleByCode,
  formatModuleForAI,
  getCurriculumStats,
} from './curriculum-loader';

// ═══════════════════════════════════════════════════════════════════════════════
// PLATFORM ARCHITECTURE & FEATURES
// ═══════════════════════════════════════════════════════════════════════════════

export const PLATFORM_KNOWLEDGE = {
  projectName: "RUNDA TSS Tech Club Learning Platform",
  institution: "RUNDA Technical Secondary School",
  location: "Rwanda",
  educationalSystem: "TVET (Technical and Vocational Education and Training) aligned with RTB (Rwanda TVET Board) standards",

  coreFeatures: {
    learningSystem: {
      name: "Interactive Module Learning",
      description: "Structured learning paths with outcomes, indicative contents, topics, and blocks",
      features: [
        "Sequential learning with progress tracking",
        "Interactive quizzes (MCQ, True/False, Fill-in-blank, Essay, Coding)",
        "Code examples with syntax highlighting",
        "Video tutorials and document attachments",
        "Real-time progress saving",
        "XP (Experience Points) reward system",
        "Celebration animations on completion"
      ]
    },

    passport: {
      name: "Learning Passport",
      description: "Visual map of entire learning journey showing all skill tracks and modules",
      features: [
        "Track-based curriculum navigation",
        "Module completion status indicators",
        "Progress percentages per module",
        "XP earned tracking",
        "Module dependencies and prerequisites",
        "Level-based curriculum (L3, L4, L5)"
      ]
    },

    challenges: {
      name: "Real-World Challenges",
      description: "Weekly practical challenges where students apply learned skills",
      features: [
        "Open challenges (accepting submissions)",
        "Closed challenges (view scores only)",
        "Peer and trainer scoring system",
        "1-5 star rating scale",
        "URL submission with optional notes",
        "Challenge description with requirements",
        "Feedback from evaluators"
      ]
    },

    resources: {
      name: "Resource Library",
      description: "Downloadable study materials uploaded by trainers",
      features: [
        "PDF, DOCX, and other document formats",
        "Subject-based categorization",
        "Tag-based filtering",
        "Search functionality",
        "Track-specific visibility (L3, L4, L5, or all)",
        "Trainer-uploaded content"
      ]
    },

    lessons: {
      name: "Lessons Library",
      description: "Searchable collection of lesson materials across subjects",
      features: [
        "Full-text lesson content",
        "Subject filtering",
        "Learning outcomes listed",
        "Reading progress tracking",
        "Lesson previews"
      ]
    },

    progress: {
      name: "Progress Tracking",
      description: "Comprehensive view of student learning outcomes and achievements",
      features: [
        "All completed outcomes listed",
        "Verification status",
        "Time spent learning",
        "Module completion history",
        "Progress percentages"
      ]
    },

    aiAssistant: {
      name: "AI Study Assistant",
      description: "Context-aware AI tutor that helps with learning",
      features: [
        "Module-aware: knows what student is currently reading",
        "Can summarize learning outcomes and topics",
        "Generates practice questions on demand",
        "Explains concepts with Rwandan/African context",
        "Answers general knowledge questions",
        "Provides study tips and motivation",
        "Professional, encouraging teaching style"
      ]
    },

    dashboard: {
      name: "Student Dashboard",
      description: "Central hub showing overview of learning activity",
      features: [
        "Current XP display",
        "Active skills visualization",
        "Recent lessons",
        "Upcoming quizzes",
        "Learning streak tracker",
        "Quick access to all platform sections"
      ]
    },

    antiCheat: {
      name: "Academic Integrity System",
      description: "Detects and prevents cheating during assessments",
      features: [
        "Tab switch detection",
        "Copy-paste monitoring",
        "Window focus tracking",
        "Screenshot detection",
        "Trainer notifications on suspicious behavior"
      ]
    },

    offlineMode: {
      name: "Offline Exam System",
      description: "Tauri desktop app for secure offline exams",
      features: [
        "Content bundling for offline access",
        "Sync engine for data synchronization",
        "Lockdown mode during exams",
        "Auto-sync when connection restored"
      ]
    }
  },

  userRoles: {
    student: {
      description: "Learners enrolled in TVET programs",
      capabilities: [
        "Access modules and lessons",
        "Submit challenge solutions",
        "Take quizzes and assessments",
        "Track progress and XP",
        "Use AI assistant",
        "Download resources",
        "View events and announcements"
      ]
    },

    trainer: {
      description: "Teachers and instructors",
      capabilities: [
        "All student capabilities",
        "Upload resources",
        "Create and manage challenges",
        "Grade subjective quizzes",
        "View student progress",
        "Receive cheat notifications",
        "Manage assigned modules"
      ]
    },

    admin: {
      description: "Platform administrators",
      capabilities: [
        "All trainer capabilities",
        "Manage user accounts",
        "Approve applications",
        "View platform analytics",
        "Configure system settings",
        "Access admin dashboard",
        "Sync offline content bundles"
      ]
    }
  },

  navigation: {
    mainSections: [
      { path: "/dashboard", name: "Dashboard", icon: "Home", access: "all" },
      { path: "/passport", name: "Passport", icon: "Map", access: "all" },
      { path: "/lessons", name: "Lessons", icon: "BookOpen", access: "all" },
      { path: "/resources", name: "Resources", icon: "FileText", access: "all" },
      { path: "/challenges", name: "Challenges", icon: "Trophy", access: "all" },
      { path: "/progress", name: "My Progress", icon: "BarChart", access: "students" },
      { path: "/events", name: "Events", icon: "Calendar", access: "all" },
      { path: "/chat", name: "Chat", icon: "MessageSquare", access: "all" },
      { path: "/projects", name: "Projects", icon: "Folder", access: "all" }
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CURRICULUM STRUCTURE
// ═══════════════════════════════════════════════════════════════════════════════

export const CURRICULUM_STRUCTURE = {
  framework: "Rwanda TVET Board (RTB) Competency-Based Education and Training (CBET)",
  qualificationLevels: [
    {
      level: "L3",
      name: "TVET Certificate III in Software Development",
      duration: "1 year",
      description: "Foundation level covering basic programming, web development, and IT fundamentals"
    },
    {
      level: "L4",
      name: "TVET Certificate IV in Software Development",
      duration: "1 year",
      description: "Intermediate level covering backend development, databases, algorithms, and server administration"
    },
    {
      level: "L5",
      name: "TVET Certificate V in Software Development",
      duration: "1 year",
      description: "Advanced level covering frontend frameworks, mobile development, DevOps, and emerging technologies"
    }
  ],

  moduleStructure: {
    description: "Each module follows a 4-level hierarchy",
    levels: [
      {
        level: 1,
        name: "Learning Outcomes (LO)",
        description: "High-level competencies students will achieve",
        example: "LO 1: Develop RESTful APIs with Node.js"
      },
      {
        level: 2,
        name: "Indicative Contents (IC)",
        description: "Main content areas within each outcome",
        example: "IC 1: Setup Node.js Environment"
      },
      {
        level: 3,
        name: "Topics",
        description: "Specific lessons within each content area",
        example: "Topic 1: Description of Node.js Key Concepts"
      },
      {
        level: 4,
        name: "Items (optional)",
        description: "Detailed sub-topics within a topic",
        example: "Item 1: What is Node.js?"
      }
    ]
  },

  commonCoreModules: {
    description: "Modules required across all tracks",
    modules: [
      { code: "CCMBP402", title: "Entrepreneurship" },
      { code: "CCMCS402", title: "Information and Communication Technology (ICT)" },
      { code: "CCMEN402", title: "English" },
      { code: "CCMFT402", title: "Français" },
      { code: "CCMIA402", title: "Industrial Attachment Program (IAP)" },
      { code: "CCMKN402", title: "Ikinyarwanda" },
      { code: "CMCZ401", title: "Citizenship" }
    ]
  },

  generalModules: {
    description: "Technical foundation modules",
    modules: [
      { code: "GENBN401", title: "Basics of Networking" },
      { code: "GENFA402", title: "Apply Fundamental Mathematics Analysis" },
      { code: "GENMP402", title: "Apply Mechanics and Properties of Matter" }
    ]
  },

  assessmentTypes: [
    {
      type: "Formative",
      description: "Continuous assessment through quizzes, exercises, and progress tracking",
      tools: ["Interactive quizzes", "Code challenges", "Checklists", "Practice questions"]
    },
    {
      type: "Summative",
      description: "End-of-module assessments and final projects",
      tools: ["Module completion tests", "Challenge submissions", "Project deliverables"]
    },
    {
      type: "Practical",
      description: "Hands-on demonstrations of skills",
      tools: ["Code submissions", "Live demonstrations", "Portfolio projects"]
    }
  ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// TRACKS REGISTRY (Extensible for Future Tracks)
// ═══════════════════════════════════════════════════════════════════════════════

export interface TrackInfo {
  id: string;
  name: string;
  description: string;
  levels: string[];
  totalModules: number;
  careerPaths: string[];
  status: 'active' | 'coming_soon';
}

export const TRACKS_REGISTRY: Record<string, TrackInfo> = {
  'software-development': {
    id: 'software-development',
    name: 'Software Development',
    description: 'Full-stack web and application development, covering frontend, backend, databases, and DevOps',
    levels: ['L3', 'L4', 'L5'],
    totalModules: 18, // Approximate
    careerPaths: [
      'Full-Stack Developer',
      'Frontend Developer',
      'Backend Developer',
      'Mobile App Developer',
      'DevOps Engineer',
      'Software Engineer'
    ],
    status: 'active'
  },

  'computer-systems-architecture': {
    id: 'computer-systems-architecture',
    name: 'Computer Systems & Architecture',
    description: 'Hardware, networking, system administration, and computer architecture',
    levels: ['L3', 'L4', 'L5'],
    totalModules: 0, // To be added
    careerPaths: [
      'Systems Administrator',
      'Network Engineer',
      'IT Support Specialist',
      'Hardware Technician',
      'Cloud Infrastructure Engineer'
    ],
    status: 'coming_soon'
  },

  'land-surveying': {
    id: 'land-surveying',
    name: 'Land Surveying',
    description: 'Geodesy, land measurement, mapping, and geospatial technologies',
    levels: ['L3', 'L4', 'L5'],
    totalModules: 0, // To be added
    careerPaths: [
      'Land Surveyor',
      'GIS Specialist',
      'Geospatial Analyst',
      'Cartographer',
      'Geodetic Surveyor'
    ],
    status: 'coming_soon'
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SOFTWARE DEVELOPMENT MODULES (L4 & L5)
// ═══════════════════════════════════════════════════════════════════════════════

export const SOFTWARE_DEVELOPMENT_MODULES = {
  L4_SPECIFIC: [
    {
      code: "SWDBD401",
      title: "Backend Application Development",
      description: "Node.js, Express.js, RESTful APIs, authentication, security, testing",
      learningHours: 150,
      outcomes: [
        "Develop RESTful APIs with Node.js",
        "Implement authentication and authorization",
        "Test and debug backend applications",
        "Deploy backend applications to production"
      ]
    },
    {
      code: "SWDBS401",
      title: "Backend System Design",
      description: "System architecture, design patterns, scalability, microservices",
      learningHours: 120,
      outcomes: [
        "Design scalable backend systems",
        "Apply design patterns",
        "Implement microservices architecture"
      ]
    },
    {
      code: "SWDDA401",
      title: "Data Structure and Algorithm Fundamentals",
      description: "Arrays, linked lists, trees, graphs, sorting, searching, complexity analysis",
      learningHours: 140,
      outcomes: [
        "Implement common data structures",
        "Apply algorithms to solve problems",
        "Analyze time and space complexity"
      ]
    },
    {
      code: "SWDDD401",
      title: "Database Development",
      description: "SQL, database design, normalization, queries, transactions, indexing",
      learningHours: 130,
      outcomes: [
        "Design relational databases",
        "Write complex SQL queries",
        "Optimize database performance"
      ]
    },
    {
      code: "SWDPP401",
      title: "PHP Programming",
      description: "PHP basics, OOP, frameworks (Laravel), database integration, security",
      learningHours: 125,
      outcomes: [
        "Develop PHP applications",
        "Use PHP frameworks",
        "Integrate with databases securely"
      ]
    },
    {
      code: "SWDWS401",
      title: "Windows Server Administration",
      description: "Server installation, configuration, Active Directory, security, networking",
      learningHours: 110,
      outcomes: [
        "Install and configure Windows Server",
        "Manage Active Directory",
        "Implement server security"
      ]
    }
  ],

  L5_SPECIFIC: [
    {
      code: "SWDBF501",
      title: "Blockchains Fundamentals",
      description: "Blockchain technology, cryptocurrencies, smart contracts, DApps, Web3. This module covers blockchain architecture, cryptocurrency systems, smart contract development, DApp creation, and blockchain security implementation across 6 comprehensive learning outcomes.",
      learningHours: 140,
      outcomes: [
        "Understand blockchain architecture",
        "Develop smart contracts",
        "Build decentralized applications (DApps)",
        "Implement blockchain security"
      ],
      detailedOutcomes: [
        {
          number: 1,
          title: "Understand blockchain architecture",
          topics: [
            "Introduction to blockchain technology and distributed ledgers",
            "Blockchain structure: blocks, chains, and nodes",
            "Consensus mechanisms: Proof of Work (PoW), Proof of Stake (PoS), PBFT",
            "Public vs Private vs Consortium blockchains",
            "Peer-to-peer network architecture",
            "Hash functions and cryptographic foundations",
            "Merkle trees and transaction verification"
          ]
        },
        {
          number: 2,
          title: "Implement cryptocurrency systems",
          topics: [
            "Bitcoin fundamentals and architecture",
            "Ethereum ecosystem and Ethereum Virtual Machine (EVM)",
            "Cryptocurrency wallets: hot wallets vs cold wallets",
            "Public and private keys management",
            "Transaction structure and UTXO model",
            "Mining process and block validation",
            "Cryptocurrency economics and tokenomics"
          ]
        },
        {
          number: 3,
          title: "Develop smart contracts",
          topics: [
            "Smart contract fundamentals and use cases",
            "Solidity programming language syntax",
            "Contract development lifecycle",
            "Gas fees and optimization techniques",
            "Events, modifiers, and function visibility",
            "Contract interactions and libraries",
            "Testing smart contracts with Truffle/Hardhat",
            "Deploying contracts to testnets (Rinkeby, Goerli) and mainnet"
          ]
        },
        {
          number: 4,
          title: "Implement blockchain security",
          topics: [
            "Cryptographic security principles in blockchain",
            "Public key cryptography and digital signatures (ECDSA)",
            "Common smart contract vulnerabilities: reentrancy attacks, integer overflow/underflow",
            "Security vulnerabilities: front-running, timestamp dependence, tx.origin issues",
            "Secure coding practices for smart contracts",
            "Secure key management and wallet security",
            "Network attack vectors: 51% attack, Sybil attack, Eclipse attack",
            "Security auditing tools and methodologies (MythX, Slither)",
            "Secure transaction handling and validation",
            "Privacy-enhancing techniques: zero-knowledge proofs, ring signatures, stealth addresses"
          ]
        },
        {
          number: 5,
          title: "Build decentralized applications (DApps)",
          topics: [
            "DApp architecture: frontend, backend, blockchain layer",
            "Web3.js library for blockchain interaction",
            "Ethers.js for Ethereum development",
            "Frontend frameworks integration (React, Vue with Web3)",
            "MetaMask wallet connection and transaction signing",
            "IPFS for decentralized file storage",
            "DApp deployment strategies",
            "User experience best practices in DApps"
          ]
        },
        {
          number: 6,
          title: "Explore advanced blockchain concepts",
          topics: [
            "Layer 2 scaling solutions: Lightning Network, Plasma, Optimistic Rollups",
            "Cross-chain bridges and interoperability",
            "NFTs (Non-Fungible Tokens) and ERC-721/ERC-1155 standards",
            "DeFi protocols: AMMs, lending platforms, yield farming",
            "DAOs (Decentralized Autonomous Organizations)",
            "Enterprise blockchain: Hyperledger Fabric, R3 Corda",
            "Blockchain in supply chain and healthcare"
          ]
        }
      ]
    },
    {
      code: "SWDCI501",
      title: "Continuous Integration/Continuous Deployment",
      description: "CI/CD pipelines, Git workflows, automated testing, deployment strategies, Docker",
      learningHours: 120,
      outcomes: [
        "Set up CI/CD pipelines",
        "Automate testing and deployment",
        "Use containerization (Docker)"
      ]
    },
    {
      code: "SWDFD501",
      title: "Frontend Development",
      description: "React, Vue, Angular, state management, responsive design, performance optimization",
      learningHours: 160,
      outcomes: [
        "Build modern frontend applications",
        "Implement state management",
        "Optimize frontend performance"
      ]
    },
    {
      code: "SWDMW501",
      title: "Mobile and Web Applications",
      description: "React Native, Flutter, progressive web apps (PWAs), mobile UI/UX",
      learningHours: 150,
      outcomes: [
        "Develop cross-platform mobile apps",
        "Build progressive web apps",
        "Design mobile-first interfaces"
      ]
    }
  ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// LEARNING WORKFLOWS & COMMON STUDENT QUESTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const COMMON_WORKFLOWS = {
  startingLearning: {
    title: "How to Start Learning on RUNDA TSS",
    steps: [
      "1. Log in to your account on the Dashboard",
      "2. Check your XP and current skills on Dashboard",
      "3. Go to Passport to see your learning map",
      "4. Click on a track to expand and see available modules",
      "5. Select a module to start learning",
      "6. Work through Learning Outcomes → Indicative Contents → Topics",
      "7. Complete quizzes and exercises to earn XP",
      "8. Track progress in the sidebar as you go",
      "9. Use AI Assistant for help anytime (bottom-right corner)",
      "10. Return to Passport to unlock next modules"
    ]
  },

  submittingChallenge: {
    title: "How to Submit a Challenge",
    steps: [
      "1. Go to Challenges page",
      "2. Find an 'Open' challenge (green status)",
      "3. Read the challenge requirements carefully",
      "4. Complete the challenge work (code, project, etc.)",
      "5. Upload/host your solution online (GitHub, live URL, etc.)",
      "6. Click 'Submit Solution' on the challenge",
      "7. Enter your URL and add optional notes",
      "8. Submit and wait for scoring from trainers/peers",
      "9. Check back later to see your star rating (1-5)",
      "10. Read feedback to improve for next challenges"
    ]
  },

  usingAIAssistant: {
    title: "How to Use the AI Study Assistant",
    features: [
      "AI knows what module you're reading: Ask 'Summarize this topic'",
      "Generate practice questions: 'Give me 10 questions on learning outcome 2'",
      "Explain concepts: 'Explain RESTful APIs simply'",
      "Ask about platform: 'How do I submit a challenge?'",
      "Get study tips: 'How should I study for the database module?'",
      "Request examples: 'Give me a code example for Node.js routing'",
      "Cultural context: AI uses Rwandan examples when relevant",
      "General questions: Ask about any topic, not just current module"
    ],
    tips: [
      "AI widget is always at bottom-right corner (blue/green icon)",
      "Click to open, ask questions, get instant answers",
      "Close anytime if it covers content you're reading",
      "AI is context-aware: it knows your current page and module",
      "Works on all pages: Dashboard, Lessons, Passport, Challenges, etc."
    ]
  },

  trackingProgress: {
    title: "How to Track Your Learning Progress",
    features: [
      "Dashboard: Quick overview of XP, active skills, recent activity",
      "Passport: Visual map showing completion % of each module",
      "Progress Page: Detailed list of all completed outcomes",
      "Module Reader: Real-time progress bar at top showing % complete",
      "Sidebar in modules: Check marks on completed blocks",
      "XP System: Earn XP for completing modules and activities",
      "Learning Streak: Track consecutive days of learning"
    ]
  },

  findingResources: {
    title: "How to Find Study Resources",
    steps: [
      "1. Go to Resources page",
      "2. Use search bar to find specific topics",
      "3. Filter by subject or track (L3, L4, L5)",
      "4. Click on a resource to view details",
      "5. Download PDFs, documents, or view links",
      "6. Resources are uploaded by your trainers",
      "7. Check back regularly for new materials"
    ]
  }
};

export const COMMON_STUDENT_QUESTIONS = [
  {
    question: "How do I earn XP?",
    answer: "Complete modules, finish quizzes, submit challenges, and engage with platform activities. Each module awards XP upon completion."
  },
  {
    question: "What's the difference between Lessons and Modules?",
    answer: "Lessons (in Lessons Library) are readable study materials. Modules (accessed via Passport) are interactive learning experiences with videos, quizzes, and progress tracking."
  },
  {
    question: "Can I go back and review completed modules?",
    answer: "Yes! Go to Passport, click any module (even completed ones), and review content anytime."
  },
  {
    question: "How are challenges graded?",
    answer: "Challenges are scored by trainers or advanced students on a 1-5 star scale based on quality, completeness, and requirements met."
  },
  {
    question: "What happens if I switch tabs during a quiz?",
    answer: "The anti-cheat system detects tab switches and other suspicious behavior. Your trainer receives a notification. Avoid switching tabs during assessments."
  },
  {
    question: "How do I unlock advanced modules?",
    answer: "Complete prerequisite modules first. The Passport shows which modules are locked and what you need to complete to unlock them."
  },
  {
    question: "Can the AI help me cheat on quizzes?",
    answer: "No. The AI is designed to help you LEARN, not cheat. It won't answer quiz questions directly during assessments. Use it for studying and understanding concepts."
  },
  {
    question: "What's Industrial Attachment Program (IAP)?",
    answer: "IAP is a required module where students gain real-world work experience through internships at companies or organizations."
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// TECHNICAL ARCHITECTURE (For Advanced Queries)
// ═══════════════════════════════════════════════════════════════════════════════

export const TECHNICAL_ARCHITECTURE = {
  stack: {
    frontend: "Next.js 14 (React 18, TypeScript, Tailwind CSS)",
    backend: "Next.js API Routes (Serverless)",
    database: "PostgreSQL (via Supabase)",
    orm: "Prisma",
    auth: "Supabase Auth",
    storage: "Supabase Storage",
    ai: "Groq API (openai/gpt-oss-120b model)",
    deployment: "Vercel",
    offlineApp: "Tauri (Rust + TypeScript)"
  },

  keyTechnologies: [
    "React Server Components",
    "Real-time Supabase subscriptions",
    "Markdown rendering for lesson content",
    "Syntax highlighting (Code blocks)",
    "Anti-cheat monitoring",
    "XP and gamification system",
    "Context-aware AI assistant",
    "Offline-first architecture (Tauri app)"
  ],

  databaseModels: [
    "UserProfile", "Application", "Project", "ProjectMember", "ProjectSubmission",
    "Resource", "Event", "EventComment", "Lesson", "LessonProgress",
    "Challenge", "ChallengeSubmission", "SkillTrack", "SkillNode", "SkillProgress",
    "QuizBlockSubmission", "QuizResponse", "BlockProgress", "XpEvent",
    "StudentStreak", "CheatNotification", "Message", "AudioSession"
  ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// KNOWLEDGE RETRIEVAL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get comprehensive system prompt with all project knowledge
 */
export function getComprehensiveKnowledgeBase(): string {
  // Get real curriculum stats
  const { getCurriculumStats } = require('./curriculum-loader');
  const stats = getCurriculumStats();

  return `
# 🎓 RUNDA TSS TECH CLUB PLATFORM - COMPLETE KNOWLEDGE BASE

You are an AI assistant deeply integrated into the RUNDA TSS Tech Club Learning Platform.
You have COMPREHENSIVE knowledge of this platform as if you were trained on it.

⚠️ **CRITICAL: CURRICULUM DATA SOURCE**
ALL module content, learning outcomes, and topics come from REAL parsed TVET Rwanda curriculum PDFs.
The curriculum data is stored in lib/curriculum-data/ and includes:
- **${stats.totalModules} modules** across ${stats.levels.join(', ')}
- **Level 3**: ${stats.byLevel.L3} modules
- **Level 4**: ${stats.byLevel.L4} modules  
- **Level 5**: ${stats.byLevel.L5} modules
- **Module Types**: ${stats.byType.Specific} Specific, ${stats.byType.General} General, ${stats.byType.CCM} CCM

**YOU MUST ALWAYS:**
✅ Use EXACT titles and topics from the curriculum data provided in your context
✅ Reference real learning outcomes, not made-up ones
✅ Only mention topics that actually exist in the curriculum
✅ When given module context, treat it as the ONLY source of truth
❌ NEVER make up module content, learning outcome titles, or topics
❌ NEVER reference old/outdated information if curriculum data is provided

${getProjectOverview()}

${getCurriculumKnowledge()}

${getPlatformFeaturesKnowledge()}

${getWorkflowsKnowledge()}

${getTechnicalKnowledge()}

## 🎯 YOUR ROLE AS AI ASSISTANT

You are NOT just a generic AI - you are THE RUNDA TSS AI ASSISTANT who:
- Knows every module, every feature, every workflow
- Can guide students through the platform like an expert
- Answers questions about curriculum with precision using REAL curriculum data
- Generates relevant practice questions based on ACTUAL module topics from PDFs
- Provides context using Rwanda/African examples
- Acts as a personal tutor who truly understands this platform
- **ALWAYS uses exact curriculum data when provided in context**

When students ask about "this module", "this platform", or "how to do X", you respond with 
SPECIFIC knowledge from this knowledge base AND from the real curriculum data in your context.
`;
}

function getProjectOverview(): string {
  return `
## 📚 PROJECT OVERVIEW

**Name**: ${PLATFORM_KNOWLEDGE.projectName}
**Institution**: ${PLATFORM_KNOWLEDGE.institution}
**Location**: ${PLATFORM_KNOWLEDGE.location}
**Educational Framework**: ${PLATFORM_KNOWLEDGE.educationalSystem}

**Mission**: Provide world-class TVET education through an innovative, AI-powered learning platform
that makes technical education accessible, engaging, and effective for Rwandan students.

**Active Tracks**:
${Object.values(TRACKS_REGISTRY)
      .filter(t => t.status === 'active')
      .map(t => `- ${t.name}: ${t.description}`)
      .join('\n')}

**Coming Soon**:
${Object.values(TRACKS_REGISTRY)
      .filter(t => t.status === 'coming_soon')
      .map(t => `- ${t.name}: ${t.description}`)
      .join('\n')}
`;
}

function getCurriculumKnowledge(): string {
  const levels = CURRICULUM_STRUCTURE.qualificationLevels.map(l =>
    `### ${l.level}: ${l.name}\n- Duration: ${l.duration}\n- ${l.description}`
  ).join('\n\n');

  const l4Modules = SOFTWARE_DEVELOPMENT_MODULES.L4_SPECIFIC.map(m =>
    `- **${m.code}**: ${m.title} (${m.learningHours}h)`
  ).join('\n');

  const l5Modules = SOFTWARE_DEVELOPMENT_MODULES.L5_SPECIFIC.map(m =>
    `- **${m.code}**: ${m.title} (${m.learningHours}h)`
  ).join('\n');

  return `
## 🎓 CURRICULUM STRUCTURE

**Framework**: ${CURRICULUM_STRUCTURE.framework}

### Qualification Levels
${levels}

### Module Hierarchy (4 Levels)
${CURRICULUM_STRUCTURE.moduleStructure.levels.map(l =>
    `**Level ${l.level} - ${l.name}**: ${l.description}\nExample: "${l.example}"`
  ).join('\n\n')}

### Software Development L4 Modules
${l4Modules}

### Software Development L5 Modules
${l5Modules}

### Common Core Modules (All Tracks)
${CURRICULUM_STRUCTURE.commonCoreModules.modules.map(m => `- ${m.code}: ${m.title}`).join('\n')}
`;
}

function getPlatformFeaturesKnowledge(): string {
  return `
## 🚀 PLATFORM FEATURES (Your Deep Knowledge)

${Object.entries(PLATFORM_KNOWLEDGE.coreFeatures).map(([key, feature]) => `
### ${feature.name}
${feature.description}

**Features**:
${feature.features.map(f => `- ${f}`).join('\n')}
`).join('\n')}

## 👥 USER ROLES & CAPABILITIES

${Object.entries(PLATFORM_KNOWLEDGE.userRoles).map(([role, info]) => `
### ${role.charAt(0).toUpperCase() + role.slice(1)}
${info.description}

**Can**:
${info.capabilities.map(c => `- ${c}`).join('\n')}
`).join('\n')}
`;
}

function getWorkflowsKnowledge(): string {
  return `
## 📋 COMMON WORKFLOWS & STUDENT QUESTIONS

${Object.entries(COMMON_WORKFLOWS).map(([key, workflow]) => `
### ${workflow.title}
${'steps' in workflow
      ? workflow.steps.join('\n')
      : 'features' in workflow
        ? '**Features**:\n' + workflow.features.join('\n') +
        ((workflow as any).tips ? '\n\n**Tips**:\n' + (workflow as any).tips.join('\n') : '')
        : ''
    }
`).join('\n')}

### Frequently Asked Questions
${COMMON_STUDENT_QUESTIONS.map(q => `
**Q**: ${q.question}
**A**: ${q.answer}
`).join('\n')}
`;
}

function getTechnicalKnowledge(): string {
  return `
## 🔧 TECHNICAL ARCHITECTURE (For Advanced Queries)

**Tech Stack**:
${Object.entries(TECHNICAL_ARCHITECTURE.stack).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

**Key Technologies**:
${TECHNICAL_ARCHITECTURE.keyTechnologies.map(t => `- ${t}`).join('\n')}

**Database Models** (${TECHNICAL_ARCHITECTURE.databaseModels.length} models):
${TECHNICAL_ARCHITECTURE.databaseModels.join(', ')}
`;
}

/**
 * Get track-specific knowledge
 */
export function getTrackKnowledge(trackId: string): string | null {
  const track = TRACKS_REGISTRY[trackId];
  if (!track) return null;

  return `
### ${track.name} Track

**Status**: ${track.status === 'active' ? '✅ Active' : '🔜 Coming Soon'}
**Description**: ${track.description}
**Levels**: ${track.levels.join(', ')}
**Total Modules**: ${track.totalModules}

**Career Paths**:
${track.careerPaths.map(cp => `- ${cp}`).join('\n')}
`;
}

/**
 * Get module-specific knowledge from REAL parsed curriculum
 * This function now ONLY uses real curriculum data from lib/curriculum-data/
 */
export function getModuleKnowledge(moduleCode: string): string | null {
  // Import curriculum loader functions
  const { getModuleByCode, formatModuleForAI } = require('./curriculum-loader');

  // Get real module from parsed curriculum
  const realModule = getModuleByCode(moduleCode);

  if (!realModule) {
    console.warn(`⚠️ Module ${moduleCode} not found in real curriculum data`);
    return null;
  }

  // Format the real curriculum data for AI
  return formatModuleForAI(realModule);
}

