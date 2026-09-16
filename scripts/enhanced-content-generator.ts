#!/usr/bin/env ts-node
/**
 * ENHANCED MULTIMEDIA CONTENT GENERATOR FOR TVET STUDENTS
 * 
 * Creates TRULY engaging, interactive, professional content:
 * - Rich text with styling (headings, colors, bold, italic, highlights)
 * - Educational videos from YouTube (curated blockchain content)
 * - Interactive quizzes with explanations
 * - Practical activities with submission forms
 * - Visual diagrams and infographics
 * - Callouts, tips, warnings, and pro tips
 * - Code examples with syntax highlighting
 * - Real-world case studies
 * - Progress checklists
 * - Downloadable PDFs and resources
 */

import Groq from 'groq-sdk';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// ══════════════════════════════════════════════════════════════════════
// 📚 CURATED EDUCATIONAL CONTENT
// ══════════════════════════════════════════════════════════════════════

const GROQ_KEYS = [
  process.env.GROQ_API_KEY_1, process.env.GROQ_API_KEY_2, process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4, process.env.GROQ_API_KEY_5, process.env.GROQ_API_KEY_6,
  process.env.GROQ_API_KEY_7, process.env.GROQ_API_KEY_8, process.env.GROQ_API_KEY_9,
  process.env.GROQ_API_KEY_10, process.env.GROQ_API_KEY_11, process.env.GROQ_API_KEY_12,
  process.env.GROQ_API_KEY_13, process.env.GROQ_API_KEY_14, process.env.GROQ_API_KEY_15,
  process.env.GROQ_API_KEY_16, process.env.GROQ_API_KEY_17, process.env.GROQ_API_KEY_18,
  process.env.GROQ_API_KEY_19, process.env.GROQ_API_KEY_20,
].filter(Boolean) as string[];

let currentKeyIndex = 0;

console.log(`🔑 Loaded ${GROQ_KEYS.length} Groq API keys for rotation`);

// Curated educational videos
const BLOCKCHAIN_VIDEOS = {
  intro: [
    { url: "https://www.youtube.com/watch?v=SSo_EIwHSd4", title: "Blockchain in 7 Minutes", duration: "7:23" },
    { url: "https://www.youtube.com/watch?v=qOVAbKKSH10", title: "How Blockchain Works - Simply Explained", duration: "25:33" },
  ],
  architecture: [
    { url: "https://www.youtube.com/watch?v=_160oMzblY8", title: "Blockchain Architecture Explained", duration: "18:20" },
    { url: "https://www.youtube.com/watch?v=V0JdeRzVndI", title: "Distributed Ledger Technology", duration: "15:42" },
  ],
  consensus: [
    { url: "https://www.youtube.com/watch?v=fw3WkySh_Ho", title: "Consensus Mechanisms", duration: "12:15" },
    { url: "https://www.youtube.com/watch?v=M3EFi_POhps", title: "PoW vs PoS", duration: "16:45" },
  ],
  cryptography: [
    { url: "https://www.youtube.com/watch?v=jhXCTbFnK8o", title: "Cryptography Basics", duration: "21:10" },
    { url: "https://www.youtube.com/watch?v=Z3FwixsBE94", title: "Hash Functions", duration: "14:30" },
  ],
};

// ══════════════════════════════════════════════════════════════════════
// 🔧 UTILITIES
// ══════════════════════════════════════════════════════════════════════

function getGroqClient() {
  return new Groq({ apiKey: GROQ_KEYS[currentKeyIndex] });
}

function rotateKey() {
  currentKeyIndex = (currentKeyIndex + 1) % GROQ_KEYS.length;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function selectVideo(topic: string) {
  const topicLower = topic.toLowerCase();
  if (topicLower.includes('consensus') || topicLower.includes('proof')) {
    return BLOCKCHAIN_VIDEOS.consensus[Math.floor(Math.random() * BLOCKCHAIN_VIDEOS.consensus.length)];
  } else if (topicLower.includes('crypto') || topicLower.includes('hash')) {
    return BLOCKCHAIN_VIDEOS.cryptography[Math.floor(Math.random() * BLOCKCHAIN_VIDEOS.cryptography.length)];
  } else if (topicLower.includes('architecture') || topicLower.includes('design')) {
    return BLOCKCHAIN_VIDEOS.architecture[Math.floor(Math.random() * BLOCKCHAIN_VIDEOS.architecture.length)];
  } else {
    return BLOCKCHAIN_VIDEOS.intro[Math.floor(Math.random() * BLOCKCHAIN_VIDEOS.intro.length)];
  }
}

// ══════════════════════════════════════════════════════════════════════
// 🎨 ENHANCED CONTENT GENERATION
// ══════════════════════════════════════════════════════════════════════

async function generateEnhancedContent(item: any, context: any, retries = 3): Promise<any[]> {
  const video = selectVideo(item.title);

  // Enhanced prompts with specific UI/UX instructions
  const systemPrompt = `You are an expert TVET curriculum designer creating ENGAGING, INTERACTIVE, MULTIMEDIA-RICH content for technical students.

CRITICAL RULES:
1. Make content VISUALLY APPEALING with proper formatting
2. Use REAL-WORLD examples from industry
3. Include HANDS-ON practical activities
4. Add INTERACTIVE elements (quizzes, checklists, activities)
5. Write in FRIENDLY, ENCOURAGING tone
6. Break complex concepts into SIMPLE steps
7. Add VISUAL AIDS (diagrams, code examples)
8. Include PRO TIPS and WARNINGS
9. Make students EXCITED to learn

TEXT FORMATTING RULES:
- Use ## for main headings
- Use ### for sub-headings
- Use **bold** for important concepts
- Use *italic* for emphasis
- Use > for callouts/quotes
- Use code for technical terms
- Use bullet points for lists
- Add emojis for visual interest

Response MUST be valid JSON with "blocks" array. No markdown code fences.`;

  const userPrompt = `Create AMAZING content for: "${item.title}"

Context:
- Topic: ${context.topic}
- Section: ${context.subtopic}
- Module: ${context.module}

Generate 12-15 diverse, ULTRA-ENGAGING interactive blocks:

MUST INCLUDE THESE BLOCK TYPES:
1. Hero text with emojis and formatting
2. Educational video (already provided)
3. **Visual diagram as IMAGE** (use actual image URL, NOT mermaid code)
4. Code example with explanation
5. Interactive quiz (3-4 questions)
6. Pro tip callout
7. Warning/common mistake callout
8. Case study callout
9. Practical activity checklist
10. **PDF Document** - Reference material
11. **Note-Taking Block** - For student notes
12. **Assignment Submission** - Practical task
13. **Image/Infographic** - Visual learning aid
14. Mastery checklist

BLOCK EXAMPLES:

**CRITICAL: USE REAL WORKING IMAGES - NO PLACEHOLDERS, NO ASCII ART**

**Visual Diagram Block - Use placehold.co (reliable, attractive, branded):**
{"id":"diagram1","type":"image","url":"https://placehold.co/1200x600/1e293b/38bdf8?text=Blockchain+Diagram","alt":"${item.title} visual representation","caption":"📊 ${item.title} - Conceptual diagram"}

**Alternative Diagram - Professional theme:**
{"id":"diagram2","type":"image","url":"https://placehold.co/900x500/0f172a/6366f1?text=Technical+Overview","alt":"Technical diagram","caption":"💻 Technical architecture overview"}

**Infographic/Image Block - Colorful design:**
{"id":"image1","type":"image","url":"https://placehold.co/800x600/1e40af/60a5fa?text=Key+Concepts","alt":"${item.title} concept visualization","caption":"🎨 Key concepts illustrated"}

**Architecture Diagram - Cyan professional theme:**
{"id":"arch1","type":"image","url":"https://placehold.co/1000x600/164e63/22d3ee?text=Architecture","alt":"System architecture","caption":"🏗️ Architectural overview"}

**PDF Block:**
{"id":"pdf1","type":"document","title":"Reference: ${item.title} Guide","description":"Official TVET curriculum PDF","url":"https://example.com/blockchain-guide.pdf","fileType":"pdf"}

**Note-Taking Block:**
{"id":"notes1","type":"text","content":"### 📝 Your Notes\\n\\n**Take notes here:**\\n\\n> Use the note-taking tool below to write down key points, questions, and insights.\\n\\n*Your notes are automatically saved.*"}

**Assignment Block:**
{"id":"assignment1","type":"checklist","title":"🎯 Practical Assignment","items":["Research 3 real-world applications of ${item.title}","Create a simple implementation or diagram","Document your process with screenshots","Submit your work using the form below","Review 2 peer submissions"]}

Return valid JSON with 12-15 blocks including ALL types above. Use IMAGE blocks for diagrams, NOT mermaid code:
{
  "blocks": [
    {"id":"intro","type":"text","content":"## 🎯 ${item.title}\\n\\n**Welcome!** Let's master this together...\\n\\n### What You'll Learn\\n- Concept 1\\n- Concept 2\\n- Concept 3"},
    {"id":"video","type":"video","url":"${video.url}","title":"${video.title}","description":"Watch to understand ${item.title}","duration":"${video.duration}"},
    {"id":"diagram","type":"image","url":"https://placehold.co/1200x600/1e293b/38bdf8?text=System+Architecture","alt":"Architecture visual","caption":"📊 System architecture"},
    {"id":"code","type":"code","language":"javascript","content":"// Example code\\nconst blockchain = {\\n  blocks: [],\\n  addBlock: function(data) {\\n    this.blocks.push(data);\\n  }\\n};","explanation":"This demonstrates..."},
    {"id":"quiz","type":"quiz","questions":[{"id":"q1","type":"mcq","question":"What is the main purpose of ${item.title}?","options":["Option A - Incorrect","Option B - Correct answer","Option C - Incorrect","Option D - Incorrect"],"correctAnswer":1,"explanation":"**Correct!** Option B is right because..."}]},
    {"id":"tip","type":"callout","calloutType":"tip","title":"💡 Pro Tip","content":"**Industry Secret:** Professionals use this technique to..."},
    {"id":"warn","type":"callout","calloutType":"warning","title":"⚠️ Common Mistake","content":"**Watch Out!** Students often forget to... Make sure you..."},
    {"id":"case","type":"callout","calloutType":"info","title":"🏢 Real-World Example","content":"**Company X** implemented ${item.title} and achieved..."},
    {"id":"activity","type":"checklist","title":"🔨 Hands-On Activity","items":["Download starter code from repository","Implement the core function","Test with sample data","Debug any errors","Upload your solution"]},
    {"id":"pdf","type":"document","title":"📄 Study Guide","description":"Comprehensive reference material","url":"https://example.com/guide.pdf","fileType":"pdf"},
    {"id":"notes","type":"text","content":"### 📝 Take Notes\\n\\n**Your personal notebook:**\\n\\n> Write your thoughts, questions, and key takeaways here.\\n\\n*Notes auto-save as you type.*"},
    {"id":"assignment","type":"checklist","title":"🎯 Submit Your Work","items":["Complete the practical exercise","Capture screenshots of results","Write a brief explanation (100 words)","Upload files below","Wait for AI feedback"]},
    {"id":"infographic","type":"image","url":"https://placehold.co/800x600/1e40af/60a5fa?text=Key+Concepts","alt":"Concept visualization","caption":"🎨 Visual summary of key points"},
    {"id":"mastery","type":"checklist","title":"✅ Self-Assessment","items":["I can explain ${item.title} clearly","I can implement it in code","I understand common pitfalls","I can teach this to others"]}
  ]
}

CRITICAL REQUIREMENTS:
- ALL image blocks MUST use placehold.co: https://placehold.co/WIDTHxHEIGHT/bgcolor/textcolor?text=YourText
- placehold.co is FREE, reliable, fast, and always works
- Use attractive color schemes: Dark blue (1e293b), Sky blue (38bdf8), Indigo (6366f1)
- Add descriptive text to images using ?text= parameter
- Example: https://placehold.co/900x500/0f172a/6366f1?text=Blockchain+Network
- NO Unsplash URLs (deprecated)
- NO Picsum URLs (slow/unreliable)  
- NO ASCII art diagrams in text blocks  
- NO mermaid code
- Use ONLY placehold.co for all images

Example working URLs:
- https://placehold.co/1200x600/1e293b/38bdf8?text=Architecture
- https://placehold.co/900x500/0f172a/6366f1?text=Technical+Diagram  
- https://placehold.co/800x600/1e40af/60a5fa?text=Key+Points

Return ONLY valid JSON.`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = getGroqClient();

      const response = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 3500,
      });

      let content = response.choices[0].message.content || '';
      content = content.trim();

      // Strip markdown code blocks
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (content.startsWith('```')) {
        content = content.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(content);
      const blocks = parsed.blocks || [];

      console.log(`   ✅ Generated ${blocks.length} enhanced blocks`);
      return blocks;

    } catch (error: any) {
      console.log(`   ⚠️  Attempt ${attempt} failed: ${error.message?.substring(0, 100)}`);

      if (error.message?.includes('rate_limit') || error.message?.includes('429')) {
        rotateKey();
        await sleep(2000);
      } else if (attempt < retries) {
        await sleep(1000);
      }
    }
  }

  return [];
}

// ══════════════════════════════════════════════════════════════════════
// 🚀 MAIN EXECUTION
// ══════════════════════════════════════════════════════════════════════

async function main() {
  const trackId = 'seed-track-blockchain-fundamentals';

  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('🎨 ENHANCED MULTIMEDIA CONTENT GENERATOR');
  console.log('   Creating engaging, interactive TVET content');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  try {
    const track = await prisma.skillTrack.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      console.log(`❌ Track not found: ${trackId}`);
      process.exit(1);
    }

    console.log(`✅ Track: ${track.name}\n`);

    // Get Learning Outcome 1 items
    const toc = track.tableOfContents as any[];
    const outcomes = toc.filter((t: any) => t.type === 'outcome');
    const outcome1 = outcomes[0]; // First outcome

    if (!outcome1) {
      console.log('❌ Learning Outcome 1 not found');
      console.log('Available TOC items:', toc.slice(0, 5));
      process.exit(1);
    }

    // Get all items under LO1
    const topics = toc.filter((t: any) => t.type === 'topic' && t.parentId === outcome1.id);
    const subtopics = toc.filter((t: any) => topics.some(topic => topic.id === t.parentId) && t.type === 'subtopic');
    const items = toc.filter((t: any) =>
      t.type === 'item' && subtopics.some(sub => sub.id === t.parentId)
    );

    console.log(`📊 Learning Outcome 1: "${outcome1.title}"`);
    console.log(`   Topics: ${topics.length}`);
    console.log(`   Subtopics: ${subtopics.length}`);
    console.log(`   Items: ${items.length}\n`);

    // Load existing content
    const node = await prisma.skillNode.findUnique({
      where: { id: trackId }
    });

    const existingBlocks: Record<string, any> = (node?.blocks as any) || {};

    console.log('🤖 Generating enhanced content...\n');

    // Generate for each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const progress = `[${i + 1}/${items.length}]`;

      // Find parent subtopic and topic
      const parentSubtopic = subtopics.find(s => s.id === item.parentId);
      const parentTopic = topics.find(t => t.id === parentSubtopic?.parentId);

      console.log(`${progress} 📄 ${item.title}`);

      const context = {
        outcome: outcome1.title,
        topic: parentTopic?.title || '',
        subtopic: parentSubtopic?.title || '',
        module: track.name,
      };

      const blocks = await generateEnhancedContent(
        { ...item, level: 'item' },
        context
      );

      if (blocks.length > 0) {
        existingBlocks[item.id] = blocks;
      }

      // Save every 5 items
      if ((i + 1) % 5 === 0) {
        await prisma.skillNode.upsert({
          where: { id: trackId },
          create: {
            id: trackId,
            trackId: track.id,
            title: 'Enhanced Content',
            blocks: existingBlocks
          },
          update: {
            blocks: existingBlocks
          }
        });
        console.log(`   💾 Saved progress (${Object.keys(existingBlocks).length} items)\n`);
      }

      await sleep(500);
    }

    // Final save
    await prisma.skillNode.upsert({
      where: { id: trackId },
      create: {
        id: trackId,
        trackId: track.id,
        title: 'Enhanced Content',
        blocks: existingBlocks
      },
      update: {
        blocks: existingBlocks
      }
    });

    console.log('\n══════════════════════════════════════════════════════════════════════');
    console.log('✅ ENHANCED CONTENT GENERATION COMPLETE');
    console.log(`   Generated content for ${items.length} items`);
    console.log('\n🎨 View at:');
    console.log(`   Teacher: http://localhost:3001/passport/teach/${trackId}`);
    console.log(`   Student: http://localhost:3001/learn/l5-specific-modules-swdbf501-blockchains-fundamentals`);
    console.log('══════════════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
