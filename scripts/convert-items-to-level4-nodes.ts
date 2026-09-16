#!/usr/bin/env ts-node
/**
 * Convert items[] arrays in Level 3 subtopics into separate Level 4 TOC nodes
 * 
 * BEFORE:
 * Level 3: { id: "subtopic-1", items: ["Define", "blockchain", "History"] }
 * 
 * AFTER:
 * Level 3: { id: "subtopic-1" } (no items array)
 * Level 4: { id: "item-1-1", title: "Define", type: "item", parentId: "subtopic-1" }
 * Level 4: { id: "item-1-2", title: "blockchain", type: "item", parentId: "subtopic-1" }
 * Level 4: { id: "item-1-3", title: "History", type: "item", parentId: "subtopic-1" }
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const trackId = process.argv[2] || 'seed-track-blockchain-fundamentals';
  
  console.log('═'.repeat(80));
  console.log('🔄 CONVERTING ITEMS TO LEVEL 4 NODES');
  console.log('═'.repeat(80));
  console.log();
  
  const track = await prisma.skillTrack.findUnique({
    where: { id: trackId }
  });
  
  if (!track) {
    console.log('❌ Track not found:', trackId);
    return;
  }
  
  const toc = track.tableOfContents as any[];
  console.log('Track:', track.name);
  console.log('Current TOC nodes:', toc.length);
  console.log();
  
  // Find all subtopics with items
  const subtopics = toc.filter((t: any) => t.type === 'subtopic');
  const subtopicsWithItems = subtopics.filter((s: any) => s.items && Array.isArray(s.items) && s.items.length > 0);
  
  console.log('Subtopics with items[]:', subtopicsWithItems.length);
  
  if (subtopicsWithItems.length === 0) {
    console.log('✅ No conversion needed - no items[] found');
    return;
  }
  
  let totalItemsConverted = 0;
  const newTOC = [...toc];
  
  // Convert each subtopic's items into separate nodes
  subtopicsWithItems.forEach((subtopic: any) => {
    console.log(`\nProcessing: ${subtopic.title}`);
    console.log(`  Items to convert: ${subtopic.items.length}`);
    
    subtopic.items.forEach((itemTitle: string, idx: number) => {
      const itemNode = {
        id: `${subtopic.id}-item-${idx + 1}`,
        title: itemTitle,
        type: 'item',
        parentId: subtopic.id,
        order: idx,
        description: `${itemTitle} - detailed content`
      };
      
      newTOC.push(itemNode);
      totalItemsConverted++;
      console.log(`    ✅ Created: ${itemNode.id} - "${itemTitle}"`);
    });
    
    // Remove items array from subtopic
    const subtopicIdx = newTOC.findIndex((n: any) => n.id === subtopic.id);
    if (subtopicIdx !== -1) {
      delete newTOC[subtopicIdx].items;
    }
  });
  
  console.log();
  console.log('═'.repeat(80));
  console.log('CONVERSION SUMMARY');
  console.log('═'.repeat(80));
  console.log(`  Subtopics processed: ${subtopicsWithItems.length}`);
  console.log(`  Level 4 items created: ${totalItemsConverted}`);
  console.log(`  New TOC size: ${newTOC.length} (was ${toc.length})`);
  console.log();
  
  // Update database
  await prisma.skillTrack.update({
    where: { id: trackId },
    data: { tableOfContents: newTOC as any }
  });
  
  console.log('✅ TOC updated in database!');
  console.log();
  console.log('Updated hierarchy:');
  console.log(`  Level 1 (Outcomes): ${newTOC.filter((t: any) => t.type === 'outcome').length}`);
  console.log(`  Level 2 (Topics): ${newTOC.filter((t: any) => t.type === 'topic').length}`);
  console.log(`  Level 3 (Subtopics): ${newTOC.filter((t: any) => t.type === 'subtopic').length}`);
  console.log(`  Level 4 (Items): ${newTOC.filter((t: any) => t.type === 'item').length}`);
  console.log();
  
  await prisma.$disconnect();
}

main().catch(console.error);
