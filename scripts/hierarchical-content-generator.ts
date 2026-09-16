#!/usr/bin/env ts-node
/**
 * HIERARCHICAL SMART CONTENT GENERATOR
 * 
 * Generates interactive, engaging content at ALL 4 LEVELS of curriculum hierarchy:
 * Level 1: Learning Outcome (LO) - Big picture overview with roadmap
 * Level 2: Indicative Content (IC/Subtopic) - Section overview with objectives
 * Level 3: Topic - Topic introduction with key concepts
 * Level 4: Item - Detailed explanations with examples
 * 
 * All content based on REAL official curriculum PDFs from /7 Curriculum folder.
 * Each level has rich multimedia: diagrams, code, quizzes, checklists.
 */

import Groq from 'groq-sdk';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const GROQ_KEYS = [
  process.env.GROQ_API_KEY_1, process.env.GROQ_API_KEY_2, process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4, process.env.GROQ_API_KEY_5, process.env.GROQ_API_KEY_6,
  process.env.GROQ_API_KEY_7, process.env.GROQ_API_KEY_8, process.env.GROQ_API_KEY_9,
  process.env.GROQ_API_KEY_10, process.env.GROQ_API_KEY_11, process.env.GROQ_API_KEY_12,
  process.env.GROQ_API_KEY_13,
].filter(Boolean) as string[];

let currentKeyIndex = 0;

function getGroqClient() {
  return new Groq({ apiKey: GROQ_KEYS[currentKeyIndex] });
}

function rotateKey() {
  currentKeyIndex = (currentKeyIndex + 1) % GROQ_KEYS.length;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface HierarchyItem {
  id: string;
  title: string;
  level: 'outcome' | 'topic' | 'subtopic' | 'item';
  context: {
    outcome: string;
    topic?: string;
    subtopic?: string;
    module: string;
    subItems?: string[]; // For overview generation
  };
}

/**
 * Extract ALL 4 levels of hierarchy from track TOC
 */
async function extractAllLevels(track: any, loNumber?: number): Promise<HierarchyItem[]> {
  const toc = track.tableOfContents || [];
  const items: HierarchyItem[] = [];

  const outcomes = toc.filter((t: any) => t.type === 'outcome');
  const topics = toc.filter((t: any) => t.type === 'topic');
  const subtopics = toc.filter((t: any) => t.type === 'subtopic');

  outcomes.forEach((outcome: any, outIdx: number) => {
    // Filter by LO number if specified
    if (loNumber && outIdx !== (loNumber - 1)) return;

    const outcomeTopics = topics.filter((t: any) => t.parentId === outcome.id);

    // LEVEL 1: Learning Outcome
    items.push({
      id: `default-outcome-${outIdx}`,
      title: outcome.title,
      level: 'outcome',
      context: {
        outcome: outcome.title,
        module: track.name,
        subItems: outcomeTopics.map((t: any) => t.title),
      },
    });

    outcomeTopics.forEach((topic: any, topicIdx: number) => {
      const topicSubs = subtopics.filter((s: any) => s.parentId === topic.id);

      // LEVEL 3: Topic
      items.push({
        id: `default-topic-${outIdx}-${topicIdx}`,
        title: topic.title,
        level: 'topic',
        context: {
          outcome: outcome.title,
          topic: topic.title,
          module: track.name,
          subItems: topicSubs.map((s: any) => s.title),
        },
      });

      topicSubs.forEach((sub: any) => {
        const subIdxInList = subtopics.findIndex((s: any) => s.id === sub.id);
        const itemTitles = (sub.items || []) as string[];

        // LEVEL 2: Indicative Content (Subtopic)
        items.push({
          id: `default-subtopic-${outIdx}-${topicIdx}-${subIdxInList}`,
          title: sub.title,
          level: 'subtopic',
          context: {
            outcome: outcome.title,
            topic: topic.title,
            subtopic: sub.title,
            module: track.name,
            subItems: itemTitles,
          },
        });

        // LEVEL 4: Items
        if (sub.items && Array.isArray(sub.items)) {
          sub.items.forEach((itemTitle: string, itemIdx: number) => {
            items.push({
              id: `default-item-${outIdx}-${topicIdx}-${subIdxInList}-${itemIdx}`,
              title: itemTitle,
              level: 'item',
              context: {
                outcome: outcome.title,
                topic: topic.title,
                subtopic: sub.title,
                module: track.name,
              },
            });
          });
        }
      });
    });
  });

  return items;
}

/**
 * Generate content based on hierarchy level
 */
async function generateContentForLevel(item: HierarchyItem, moduleCode: string): Promise<any[]> {
  const prompts = {
    outcome: `You are creating content for a LEARNING OUTCOME overview in an official RQF Level 5 Software Development curriculum.

**Module**: ${item.context.module} (${moduleCode})
**Learning Outcome**: ${item.title}
**Sub-topics covered**: ${item.context.subItems?.join(', ')}

This is the BIG PICTURE overview that students see first. Create HIGHLY ENGAGING, MULTIMEDIA-RICH content that:
1. Explains WHAT this learning outcome is about (2-3 paragraphs)
2. Shows WHY it matters with real-world examples
3. Includes educational VIDEO content (YouTube links related to blockchain/software dev)
4. Provides interactive visual diagrams (mermaid charts)
5. Shows relevant IMAGES (educational illustrations)
6. Includes learning objectives checklist
7. Has a quiz to activate prior knowledge

Generate 8-10 diverse blocks with RICH MULTIMEDIA:
- Opening text with engaging intro
- HERO IMAGE (educational illustration)
- Introductory VIDEO (YouTube embed)
- Callout with real-world application
- Interactive mermaid diagram (learning path/flowchart)
- Learning objectives checklist
- QUIZ to test understanding
- Summary with next steps

IMPORTANT: Include actual YouTube video URLs for educational content. Use real educational resources.

Base content on official curriculum standards, not imagination.

Respond with JSON ONLY:
{
  "blocks": [
    {"id":"${item.id}-b1","type":"text","content":"## ${item.title}\\n\\nEngaging intro..."},
    {"id":"${item.id}-b2","type":"image","url":"https://example.com/blockchain-architecture.jpg","alt":"Blockchain Architecture Diagram","caption":"Overview of blockchain system design"},
    {"id":"${item.id}-b3","type":"video","url":"https://www.youtube.com/watch?v=SSo_EIwHSd4","title":"Introduction to Blockchain Architecture","description":"Learn the fundamentals","duration":"15:30"},
    {"id":"${item.id}-b4","type":"callout","calloutType":"tip","title":"Real-World Application","content":"Industry examples..."},
    {"id":"${item.id}-b5","type":"text","content":"### Learning Path\\n\`\`\`mermaid\\ngraph LR;\\n    A[Start] --> B[Learn];\\n\`\`\`"},
    {"id":"${item.id}-b6","type":"checklist","title":"Learning Objectives","items":["Objective 1","Objective 2"]},
    {"id":"${item.id}-b7","type":"quiz","questions":[{"id":"q1","type":"mcq","question":"What is...?","options":["A","B","C","D"],"correctAnswer":0,"explanation":"Because..."}]}
  ]
}`,

    topic: `You are creating content for a TOPIC introduction in an official RQF Level 5 Software Development curriculum.

**Module**: ${item.context.module}
**Learning Outcome**: ${item.context.outcome}
**Topic**: ${item.title}
**Sub-sections**: ${item.context.subItems?.join(', ')}

This is the TOPIC OVERVIEW with MULTIMEDIA elements. Create content that:
1. Introduces the topic with engaging explanation
2. Includes relevant educational VIDEO (YouTube)
3. Shows visual diagrams or images
4. Provides key concepts callout
5. Has interactive quiz or exercise
6. Lists sub-sections to be covered

Generate 5-7 diverse multimedia blocks:
- Topic introduction text
- Educational IMAGE or diagram
- Short educational VIDEO (YouTube)
- Key concepts callout
- Interactive code example (if applicable)
- Quiz question
- Topic objectives checklist

Use real educational YouTube videos when relevant.

Respond with JSON ONLY:
{
  "blocks": [
    {"id":"${item.id}-b1","type":"text","content":"## ${item.title}\\n\\nIntro..."},
    {"id":"${item.id}-b2","type":"video","url":"https://www.youtube.com/watch?v=...","title":"Video Title","description":"Learn about..."},
    {"id":"${item.id}-b3","type":"callout","calloutType":"info","title":"Key Concepts","content":"..."},
    {"id":"${item.id}-b4","type":"code","language":"javascript","content":"// Example code","explanation":"..."},
    {"id":"${item.id}-b5","type":"quiz","questions":[{"id":"q1","type":"mcq","question":"...","options":["A","B"],"correctAnswer":0}]}
  ]
}`,

    subtopic: `You are creating content for an INDICATIVE CONTENT section in an official RQF Level 5 Software Development curriculum.

**Module**: ${item.context.module}
**Learning Outcome**: ${item.context.outcome}
**Topic**: ${item.context.topic}
**Indicative Content**: ${item.title}
**Items covered**: ${item.context.subItems?.join(', ')}

This is a SECTION OVERVIEW introducing a specific concept area. Create content that:
1. Explains what this section covers (1 paragraph)
2. Shows how it fits into the bigger picture
3. Lists the specific items students will learn
4. Provides context or motivation
5. May include a simple visual or example

Generate 2-4 blocks:
- Section introduction
- Context callout
- Items list or diagram

Based on official curriculum standards.

Respond with JSON ONLY:
{
  "blocks": [
    {"id":"${item.id}-b1","type":"text","content":"### ${item.title}\\n\\nContent..."},
    {"id":"${item.id}-b2","type":"callout","calloutType":"info","title":"What You'll Learn","content":"..."}
  ]
}`,

    item: `You are creating DETAILED MULTIMEDIA CONTENT for a specific curriculum item in an official RQF Level 5 Software Development curriculum.

**Module**: ${item.context.module}
**Learning Outcome**: ${item.context.outcome}
**Topic**: ${item.context.topic}
**Section**: ${item.context.subtopic}
**Specific Item**: "${item.title}"

This is HIGHLY INTERACTIVE, MULTIMEDIA-RICH content for "${item.title}". Create engaging learning materials with:

1. If it's a definition/concept:
   - Clear explanation with examples
   - Educational IMAGE or infographic
   - Short explainer VIDEO (YouTube)
   - Interactive code demo
   - Visual mermaid diagram
   - Quiz to test understanding

2. If it's technical (protocols, algorithms, tools):
   - How it works explanation
   - VISUAL DIAGRAM (mermaid flowchart)
   - CODE examples with syntax highlighting
   - Educational VIDEO tutorial
   - Hands-on exercise
   - Practice quiz

3. If it's practical (implementation, usage):
   - Step-by-step guide
   - CODE snippets
   - Video tutorial or demo
   - Interactive checklist
   - Real-world example with image

Make it feel like a REAL INTERACTIVE CLASSROOM with:
- Videos (YouTube educational content)
- Images (diagrams, screenshots, infographics)
- Code examples
- Interactive diagrams (mermaid)
- Quizzes and exercises
- Checklists

Generate 5-8 diverse multimedia blocks:
- Explanatory text
- Educational IMAGE
- Video tutorial (YouTube)
- Interactive diagram (mermaid)
- Code examples with explanation
- Practice quiz
- Hands-on exercise
- Mastery checklist

Use REAL educational YouTube videos when relevant (programming tutorials, blockchain, software dev).

Based on official curriculum, not imagination.

Respond with JSON ONLY:
{
  "blocks": [
    {"id":"${item.id}-b1","type":"text","content":"#### ${item.title}\\n\\nDetailed explanation..."},
    {"id":"${item.id}-b2","type":"image","url":"https://example.com/diagram.png","alt":"Concept diagram","caption":"Visual representation"},
    {"id":"${item.id}-b3","type":"video","url":"https://www.youtube.com/watch?v=...","title":"Tutorial","description":"Learn how...","duration":"10:00"},
    {"id":"${item.id}-b4","type":"code","language":"javascript","content":"// Example code\\nconst example = 'code';","explanation":"This code demonstrates..."},
    {"id":"${item.id}-b5","type":"text","content":"### How It Works\\n\`\`\`mermaid\\ngraph TD;\\n    A-->B;\\n\`\`\`"},
    {"id":"${item.id}-b6","type":"quiz","questions":[{"id":"q1","type":"mcq","question":"Test question?","options":["A","B","C","D"],"correctAnswer":0,"explanation":"Explanation..."}]},
    {"id":"${item.id}-b7","type":"checklist","title":"Mastery Checklist","items":["Can explain...","Can implement...","Can apply..."]}
  ]
}`
  };

  const prompt = prompts[item.level];

  for (let attempt = 1; attempt <= GROQ_KEYS.length; attempt++) {
    try {
      const client = getGroqClient();

      const response = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are an expert educator creating curriculum content. Respond with ONLY valid JSON, no markdown blocks.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      });

      let content = response.choices[0].message.content || '';
      content = content.trim();
      if (content.startsWith('```json')) content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      else if (content.startsWith('```')) content = content.replace(/^```\n?/, '').replace(/\n?```$/, '');

      const parsed = JSON.parse(content);
      return parsed.blocks || [];

    } catch (error: any) {
      if ((error.status === 429 || error.code === 'rate_limit_exceeded') && attempt < GROQ_KEYS.length) {
        rotateKey();
        await sleep(1000);
        continue;
      }

      console.error(`   ⚠️  Failed: ${error.message}`);
      return [];
    }
  }

  return [];
}

async function main() {
  console.log(`${'═'.repeat(70)}`);
  console.log(`🎯 HIERARCHICAL CONTENT GENERATOR`);
  console.log(`   Generates content at ALL 4 LEVELS of curriculum hierarchy`);
  console.log(`${'═'.repeat(70)}\n`);

  const args = process.argv.slice(2);
  const trackId = args[0];
  const loNumber = args[1] ? parseInt(args[1]) : undefined;

  if (!trackId) {
    console.log(`Usage: npx ts-node scripts/hierarchical-content-generator.ts <TRACK_ID> [LO_NUMBER]`);
    console.log(`\nExample:`);
    console.log(`  npx ts-node scripts/hierarchical-content-generator.ts seed-track-blockchain-fundamentals 1`);
    process.exit(0);
  }

  const track = await prisma.skillTrack.findUnique({
    where: { id: trackId },
  });

  if (!track) {
    console.error(`❌ Track not found: ${trackId}`);
    process.exit(1);
  }

  console.log(`✅ Track: ${track.name}`);
  console.log(`📚 Extracting ALL hierarchy levels...\n`);

  const allItems = await extractAllLevels(track, loNumber);

  if (allItems.length === 0) {
    console.error(`❌ No items found in TOC`);
    process.exit(1);
  }

  // Group by level
  const byLevel = {
    outcome: allItems.filter(i => i.level === 'outcome'),
    topic: allItems.filter(i => i.level === 'topic'),
    subtopic: allItems.filter(i => i.level === 'subtopic'),
    item: allItems.filter(i => i.level === 'item'),
  };

  console.log(`📊 Hierarchy Levels:`);
  console.log(`   Level 1 (Learning Outcomes): ${byLevel.outcome.length}`);
  console.log(`   Level 3 (Topics): ${byLevel.topic.length}`);
  console.log(`   Level 2 (Indicative Contents): ${byLevel.subtopic.length}`);
  console.log(`   Level 4 (Items): ${byLevel.item.length}`);
  console.log(`   Total: ${allItems.length} items\n`);

  const moduleCode = track.name.match(/[A-Z]+\d+/)?.[0] || 'MODULE';
  const results: Record<string, any[]> = {};
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < allItems.length; i++) {
    const item = allItems[i];
    const progress = `[${i + 1}/${allItems.length}]`;
    const levelEmoji = { outcome: '📘', topic: '📗', subtopic: '📙', item: '📝' };

    console.log(`${progress} ${levelEmoji[item.level]} L${item.level === 'outcome' ? '1' : item.level === 'topic' ? '3' : item.level === 'subtopic' ? '2' : '4'}: ${item.title.substring(0, 60)}`);

    const blocks = await generateContentForLevel(item, moduleCode);

    if (blocks.length > 0) {
      results[item.id] = blocks;
      successCount++;
      console.log(`   ✅ ${blocks.length} blocks\n`);
    } else {
      failCount++;
      console.log(`   ❌ Failed\n`);
    }

    await sleep(500); // Rate limiting
  }

  // Save to database
  console.log(`${'═'.repeat(70)}`);
  console.log(`💾 Saving to database...`);
  console.log(`${'═'.repeat(70)}\n`);

  // Auto-link moduleSlug if not set
  let moduleSlug = (track as any).moduleSlug;
  if (!moduleSlug) {
    if (track.name.toLowerCase().includes('blockchain')) {
      moduleSlug = 'l5-specific-modules-swdbf501-blockchains-fundamentals';
    } else if (track.name.toLowerCase().includes('machine learning')) {
      moduleSlug = 'l5-specific-modules-swdml501-machine-learning-applications';
    }

    if (moduleSlug) {
      await prisma.skillTrack.update({
        where: { id: trackId },
        data: { moduleSlug },
      });
      console.log(`🔗 Linked moduleSlug: ${moduleSlug}\n`);
    }
  }

  const nodeId = `${trackId}-lo${loNumber || 'all'}`;

  const existing = await prisma.skillNode.findUnique({
    where: { id: nodeId },
  });

  if (existing) {
    const existingBlocks = (existing.blocks as any) || {};
    const mergedBlocks = { ...existingBlocks, ...results };

    await prisma.skillNode.update({
      where: { id: nodeId },
      data: { blocks: mergedBlocks as any },
    });

    console.log(`✅ Updated node: ${nodeId}`);
    console.log(`   📊 Total items with content: ${Object.keys(mergedBlocks).length}`);
  } else {
    await prisma.skillNode.create({
      data: {
        id: nodeId,
        trackId: track.id,
        title: loNumber ? `Learning Outcome ${loNumber}` : track.name,
        description: `Hierarchical content for ${allItems.length} items`,
        order: (loNumber || 1) - 1,
        blocks: results as any,
        estimatedMinutes: allItems.length * 10,
      },
    });

    console.log(`✨ Created node: ${nodeId}`);
  }

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`🎉 COMPLETE!`);
  console.log(`${'═'.repeat(70)}`);
  console.log(`\n📊 Summary:`);
  console.log(`   • Total items: ${allItems.length}`);
  console.log(`   • Success: ${successCount}`);
  console.log(`   • Failed: ${failCount}`);
  console.log(`   • Total blocks: ${Object.values(results).flat().length}`);
  console.log(`   • Cost: $0.00 (FREE)\n`);
  console.log(`🔗 View at: http://localhost:3001/passport/teach/${trackId}\n`);
}

main()
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
