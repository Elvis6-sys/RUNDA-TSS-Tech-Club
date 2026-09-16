#!/usr/bin/env ts-node

/**
 * Simple Content Seeder - Teacher-Friendly CLI Tool
 * 
 * Usage:
 *   npm run seed-content -- --module SWDBF501 --outcome 1
 *   npm run seed-content -- --module SWDBF501 --all
 *   npm run seed-content -- --interactive
 */

import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

// Available modules (add more as needed)
const MODULES = {
  'SWDBF501': {
    name: 'Blockchain Fundamentals',
    trackId: 'seed-track-blockchain-fundamentals',
    outcomes: 4
  },
  'SWDML501': {
    name: 'Machine Learning',
    trackId: 'seed-track-machine-learning',
    outcomes: 3
  },
  'SWDVC501': {
    name: 'Version Control',
    trackId: 'seed-track-version-control',
    outcomes: 4
  }
};

// Interactive prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function interactiveMode() {
  console.log('\n🎨 Welcome to Simple Content Seeder!\n');
  
  // Step 1: Choose module
  console.log('📚 Available Modules:');
  Object.entries(MODULES).forEach(([code, info]) => {
    console.log(`  ${code}: ${info.name}`);
  });
  
  const moduleCode = (await ask('\nEnter module code (e.g., SWDBF501): ')).toUpperCase();
  
  if (!MODULES[moduleCode as keyof typeof MODULES]) {
    console.error('❌ Invalid module code');
    process.exit(1);
  }
  
  const module = MODULES[moduleCode as keyof typeof MODULES];
  
  // Step 2: Choose outcome or all
  console.log(`\n📖 ${module.name} has ${module.outcomes} learning outcomes`);
  const choice = await ask('\nGenerate:\n  1. Single outcome\n  2. All outcomes\nChoice (1/2): ');
  
  if (choice === '1') {
    const outcome = await ask(`Enter outcome number (1-${module.outcomes}): `);
    await generateOutcome(module.trackId, parseInt(outcome));
  } else {
    await generateAllOutcomes(module.trackId, module.outcomes);
  }
  
  rl.close();
}

async function generateOutcome(trackId: string, outcomeNumber: number) {
  console.log(`\n🚀 Generating content for Learning Outcome ${outcomeNumber}...\n`);
  
  // Find all nodes for this outcome
  const nodes = await prisma.skillNode.findMany({
    where: {
      trackId,
      level: 1, // Learning outcomes are level 1
    },
    include: {
      children: {
        include: {
          children: {
            include: {
              children: true // Items (level 4)
            }
          }
        }
      }
    }
  });
  
  if (nodes.length === 0) {
    console.log('❌ No nodes found. Make sure module is imported first.');
    return;
  }
  
  const outcome = nodes[outcomeNumber - 1];
  if (!outcome) {
    console.log(`❌ Learning Outcome ${outcomeNumber} not found`);
    return;
  }
  
  console.log(`📝 ${outcome.title}`);
  console.log(`   Topics: ${outcome.children?.length || 0}`);
  
  // Generate sample content structure
  const contentBlocks = generateSampleBlocks(outcome.title);
  
  // Save to database
  await prisma.skillNode.update({
    where: { id: outcome.id },
    data: {
      blocks: contentBlocks
    }
  });
  
  console.log(`\n✅ Content generated successfully!`);
  console.log(`\n👉 View at: http://localhost:3001/learn/${trackId}`);
}

async function generateAllOutcomes(trackId: string, totalOutcomes: number) {
  console.log(`\n🚀 Generating content for ALL ${totalOutcomes} learning outcomes...\n`);
  
  for (let i = 1; i <= totalOutcomes; i++) {
    console.log(`\n📖 Processing Learning Outcome ${i}/${totalOutcomes}...`);
    await generateOutcome(trackId, i);
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\n✅ All outcomes generated!`);
}

function generateSampleBlocks(title: string) {
  return {
    "intro": [
      {
        "id": "intro-text",
        "type": "text",
        "content": `# ${title}\n\n## 🎯 Why This Matters\n\nThis learning outcome is crucial for your career in software development. Understanding ${title.toLowerCase()} will help you build better applications and solve real-world problems.\n\n### Learning Objectives\n\nBy the end of this section, you will be able to:\n- Understand the core concepts\n- Apply knowledge to practical scenarios\n- Build real projects using these skills`
      },
      {
        "id": "intro-video",
        "type": "video",
        "url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
        "title": `Introduction to ${title}`,
        "duration": "10:00"
      },
      {
        "id": "intro-quiz",
        "type": "quiz",
        "questions": [
          {
            "id": "q1",
            "questionType": "mcq",
            "question": `What is the main purpose of ${title}?`,
            "options": [
              "To learn programming",
              "To build better applications",
              "To understand computer science",
              "All of the above"
            ],
            "correct": 3,
            "explanation": "Understanding this concept helps in multiple areas of software development."
          },
          {
            "id": "q2",
            "questionType": "truefalse",
            "question": "This topic is relevant to real-world software development.",
            "correct": 0,
            "explanation": "Yes! This is widely used in industry."
          }
        ]
      },
      {
        "id": "intro-checklist",
        "type": "checklist",
        "items": [
          "Watched introduction video",
          "Understood why this topic matters",
          "Completed knowledge check",
          "Ready to dive into concepts"
        ]
      }
    ],
    "concepts": [
      {
        "id": "concepts-text",
        "type": "text",
        "content": `## 📚 Core Concepts\n\n### Key Ideas\n\nLet's break down the fundamental concepts:\n\n**1. First Concept**\nThis is the foundation of everything we'll learn.\n\n**2. Second Concept**\nBuilding on the first, this adds more depth.\n\n**3. Third Concept**\nCombining both, we can now solve complex problems.\n\n### Visual Representation\n\n\`\`\`mermaid\ngraph TD\n    A[Start] --> B[Learn Concept]\n    B --> C[Practice]\n    C --> D[Master]\n\`\`\``
      },
      {
        "id": "concepts-code",
        "type": "code",
        "language": "python",
        "code": `# Example: ${title}\n\ndef example_function():\n    \"\"\"\n    This demonstrates a key concept.\n    \"\"\"\n    result = "Hello, World!"\n    return result\n\n# Test it\nprint(example_function())`
      }
    ],
    "practice": [
      {
        "id": "practice-assignment",
        "type": "assignment",
        "title": `Practical Activity: ${title}`,
        "description": "Complete the following tasks to demonstrate your understanding:",
        "tasks": [
          "Task 1: Implement the concept in code",
          "Task 2: Test your implementation",
          "Task 3: Submit your work"
        ],
        "submissionType": "file_upload",
        "allowedFormats": ["py", "js", "java", "zip"],
        "dueDate": null
      },
      {
        "id": "practice-quiz",
        "type": "quiz",
        "questions": [
          {
            "id": "pq1",
            "questionType": "multiselect",
            "question": "Which of the following are true? (Select all that apply)",
            "options": [
              "Statement A is correct",
              "Statement B is incorrect",
              "Statement C is correct",
              "Statement D is incorrect"
            ],
            "correct": [0, 2],
            "explanation": "Statements A and C accurately describe the concept."
          }
        ]
      }
    ]
  };
}

// CLI argument parsing
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--interactive') || args.length === 0) {
    await interactiveMode();
  } else {
    const moduleIndex = args.indexOf('--module');
    const outcomeIndex = args.indexOf('--outcome');
    const allFlag = args.includes('--all');
    
    if (moduleIndex === -1) {
      console.error('❌ Missing --module argument');
      console.log('\nUsage:');
      console.log('  npm run seed-content -- --module SWDBF501 --outcome 1');
      console.log('  npm run seed-content -- --module SWDBF501 --all');
      console.log('  npm run seed-content -- --interactive');
      process.exit(1);
    }
    
    const moduleCode = args[moduleIndex + 1].toUpperCase();
    const module = MODULES[moduleCode as keyof typeof MODULES];
    
    if (!module) {
      console.error(`❌ Unknown module: ${moduleCode}`);
      process.exit(1);
    }
    
    if (allFlag) {
      await generateAllOutcomes(module.trackId, module.outcomes);
    } else if (outcomeIndex !== -1) {
      const outcomeNumber = parseInt(args[outcomeIndex + 1]);
      await generateOutcome(module.trackId, outcomeNumber);
    } else {
      console.error('❌ Specify --outcome NUMBER or --all');
      process.exit(1);
    }
    
    rl.close();
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
