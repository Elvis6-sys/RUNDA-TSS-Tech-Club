#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import Groq from 'groq-sdk';
import { ApiKeyManager } from '../lib/api-key-manager';

const prisma = new PrismaClient();
const apiKeyManager = new ApiKeyManager();

interface TOCItem {
  id: string;
  type: 'outcome' | 'topic' | 'subtopic' | 'item';
  title: string;
  parentId?: string;
  order?: number;
}

async function generateItems(subtopicTitle: string, parentTopic: string, parentOutcome: string): Promise<string[]> {
  const prompt = `You are analyzing a blockchain curriculum.

Learning Outcome: ${parentOutcome}
Topic: ${parentTopic}
Subtopic: ${subtopicTitle}

Generate 5-8 specific, granular Level 4 learning items (smallest units of learning) for this subtopic.
Each item should be a specific concept, skill, or knowledge point that a student needs to master.

Examples of good Level 4 items:
- "Define blockchain"
- "Explain consensus mechanisms"
- "Identify hash functions"
- "Compare PoW and PoS"

Return ONLY a JSON array of strings, nothing else:
["item1", "item2", "item3", ...]`;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    });

    const content = response.choices[0]?.message?.content?.trim() || '[]';

    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn(`⚠️  Could not parse items for "${subtopicTitle}"`);
      return [];
    }

    const items = JSON.parse(jsonMatch[0]);
    return items.filter((item: any) => typeof item === 'string' && item.length > 0);
  } catch (error) {
    console.error(`❌ Error generating items for "${subtopicTitle}":`, error);
    return [];
  }
}

async function main() {
  const trackId = process.argv[2] || 'seed-track-blockchain-fundamentals';

  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('🎯 ADD LEVEL 4 ITEMS TO TEACHER-CREATED TOC');
  console.log('════════════════════════════════════════════════════════════════════════\n');

  // Load current TOC
  const track = await prisma.skillTrack.findUnique({
    where: { id: trackId }
  });

  if (!track) {
    console.error(`❌ Track not found: ${trackId}`);
    process.exit(1);
  }

  const toc: TOCItem[] = track.tableOfContents as any;

  console.log('📊 Current TOC:');
  console.log(`  Outcomes: ${toc.filter(t => t.type === 'outcome').length}`);
  console.log(`  Topics: ${toc.filter(t => t.type === 'topic').length}`);
  console.log(`  Subtopics: ${toc.filter(t => t.type === 'subtopic').length}`);
  console.log(`  Items: ${toc.filter(t => t.type === 'item').length}\n`);

  // Find subtopics without items
  const subtopics = toc.filter(t => t.type === 'subtopic');
  const subtopicsNeedingItems = subtopics.filter(sub => {
    return toc.filter(t => t.type === 'item' && t.parentId === sub.id).length === 0;
  });

  console.log(`🔍 Found ${subtopicsNeedingItems.length} subtopics without Level 4 items\n`);

  const newToc = [...toc];
  let totalItemsAdded = 0;

  for (let i = 0; i < subtopicsNeedingItems.length; i++) {
    const subtopic = subtopicsNeedingItems[i];

    // Find parent topic and outcome for context
    const parentTopic = toc.find(t => t.id === subtopic.parentId);
    const parentOutcome = parentTopic ? toc.find(t => t.id === parentTopic.parentId) : null;

    console.log(`[${i + 1}/${subtopicsNeedingItems.length}] 📙 ${subtopic.title}`);
    console.log(`   Topic: ${parentTopic?.title || 'Unknown'}`);
    console.log(`   Outcome: ${parentOutcome?.title || 'Unknown'}`);

    // Generate items using AI
    const itemTitles = await generateItems(
      subtopic.title,
      parentTopic?.title || '',
      parentOutcome?.title || ''
    );

    if (itemTitles.length === 0) {
      console.log(`   ⚠️  No items generated, skipping\n`);
      continue;
    }

    // Add items to TOC
    const outcomeIndex = toc.filter(t => t.type === 'outcome').findIndex(o => o.id === parentOutcome?.id);
    const topicIndex = toc.filter(t => t.type === 'topic' && t.parentId === parentOutcome?.id).findIndex(t => t.id === parentTopic?.id);
    const subtopicIndex = toc.filter(t => t.type === 'subtopic' && t.parentId === parentTopic?.id).findIndex(s => s.id === subtopic.id);

    itemTitles.forEach((itemTitle, itemIdx) => {
      const itemId = `item-${outcomeIndex}-${topicIndex}-${subtopicIndex}-${itemIdx}`;
      newToc.push({
        id: itemId,
        type: 'item',
        title: itemTitle,
        parentId: subtopic.id,
        order: itemIdx
      });
    });

    totalItemsAdded += itemTitles.length;
    console.log(`   ✅ Added ${itemTitles.length} items\n`);

    // Save progress every 5 subtopics
    if ((i + 1) % 5 === 0) {
      await prisma.skillTrack.update({
        where: { id: trackId },
        data: { tableOfContents: newToc as any }
      });
      console.log(`💾 Progress saved (${newToc.filter(t => t.type === 'item').length} items)\n`);
    }
  }

  // Final save
  await prisma.skillTrack.update({
    where: { id: trackId },
    data: { tableOfContents: newToc as any }
  });

  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('✅ COMPLETE!');
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log(`📊 Final TOC:
  Outcomes: ${newToc.filter(t => t.type === 'outcome').length}
  Topics: ${newToc.filter(t => t.type === 'topic').length}
  Subtopics: ${newToc.filter(t => t.type === 'subtopic').length}
  Items: ${newToc.filter(t => t.type === 'item').length} (Added: ${totalItemsAdded})
  Total: ${newToc.length}\n`);

  console.log('🚀 Next step: Generate content for all items:');
  console.log(`   npx ts-node scripts/curriculum-aware-content-generator.ts ${trackId} 1\n`);

  await prisma.$disconnect();
}

main().catch(console.error);
