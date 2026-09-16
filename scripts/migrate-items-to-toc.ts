#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TOCItem {
  id: string;
  type: 'outcome' | 'topic' | 'subtopic' | 'item';
  title: string;
  parentId?: string;
  order?: number;
  hours?: number | null;
  performanceCriteria?: string[];
  items?: string[]; // Will be removed after migration
}

async function migrateItemsToTOC(trackId: string) {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('🔄 MIGRATING ITEMS TO CLICKABLE TOC ENTRIES');
  console.log('════════════════════════════════════════════════════════════════════════\n');

  const track = await prisma.skillTrack.findUnique({
    where: { id: trackId }
  });

  if (!track) {
    console.error(`❌ Track not found: ${trackId}`);
    process.exit(1);
  }

  const oldToc: TOCItem[] = track.tableOfContents as any;
  const newToc: TOCItem[] = [];

  console.log('📊 Current TOC:');
  console.log(`  Outcomes: ${oldToc.filter(t => t.type === 'outcome').length}`);
  console.log(`  Topics: ${oldToc.filter(t => t.type === 'topic').length}`);
  console.log(`  Subtopics: ${oldToc.filter(t => t.type === 'subtopic').length}`);
  
  let totalItemsInArrays = 0;
  oldToc.filter(t => t.type === 'subtopic').forEach(sub => {
    if (sub.items && Array.isArray(sub.items)) {
      totalItemsInArrays += sub.items.length;
    }
  });
  console.log(`  Items (in arrays): ${totalItemsInArrays}\n`);

  console.log('🔄 Converting items to clickable TOC entries...\n');

  // Calculate indices for proper ID generation
  const outcomes = oldToc.filter(t => t.type === 'outcome');

  outcomes.forEach((outcome, outIdx) => {
    // Add outcome
    newToc.push(outcome);

    const topics = oldToc.filter(t => t.type === 'topic' && t.parentId === outcome.id);
    
    topics.forEach((topic, topicIdx) => {
      // Add topic
      newToc.push(topic);

      const subtopics = oldToc.filter(t => t.type === 'subtopic' && t.parentId === topic.id);
      
      subtopics.forEach((subtopic, subIdx) => {
        // Add subtopic (without items array)
        const { items, ...subtopicWithoutItems } = subtopic;
        newToc.push(subtopicWithoutItems);

        // Convert items array to individual TOC entries
        if (items && Array.isArray(items) && items.length > 0) {
          console.log(`   📙 ${subtopic.title}: Converting ${items.length} items`);
          
          items.forEach((itemTitle, itemIdx) => {
            const itemId = `default-item-${outIdx}-${topicIdx}-${subIdx}-${itemIdx}`;
            newToc.push({
              id: itemId,
              type: 'item',
              title: itemTitle,
              parentId: subtopic.id,
              order: itemIdx
            });
          });
        }
      });
    });
  });

  console.log('\n💾 Saving migrated TOC to database...');

  await prisma.skillTrack.update({
    where: { id: trackId },
    data: { tableOfContents: newToc as any }
  });

  console.log('\n════════════════════════════════════════════════════════════════════════');
  console.log('✅ MIGRATION COMPLETE!');
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log(`📊 New TOC:
  Outcomes: ${newToc.filter(t => t.type === 'outcome').length}
  Topics: ${newToc.filter(t => t.type === 'topic').length}
  Subtopics: ${newToc.filter(t => t.type === 'subtopic').length}
  Items: ${newToc.filter(t => t.type === 'item').length} ← NOW CLICKABLE!
  Total: ${newToc.length}\n`);

  console.log('🎉 All items are now individual clickable TOC entries!');
  console.log('🔄 Refresh the browser to see clickable items in the sidebar.\n');

  await prisma.$disconnect();
}

const trackId = process.argv[2] || 'seed-track-blockchain-fundamentals';
migrateItemsToTOC(trackId).catch(console.error);
