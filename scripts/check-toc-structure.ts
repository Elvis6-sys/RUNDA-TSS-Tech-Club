#!/usr/bin/env ts-node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const track = await prisma.skillTrack.findUnique({
    where: { id: 'seed-track-blockchain-fundamentals' }
  });
  
  if (!track) {
    console.log('Track not found');
    return;
  }
  
  const toc = track.tableOfContents as any[];
  
  console.log('Current TOC Structure:\n');
  
  // Find subtopics with items
  const subtopics = toc.filter((t: any) => t.type === 'subtopic');
  const firstSubWithItems = subtopics.find((s: any) => s.items && s.items.length > 0);
  
  if (firstSubWithItems) {
    console.log('Example Level 3 (Subtopic):');
    console.log('  ID:', firstSubWithItems.id);
    console.log('  Title:', firstSubWithItems.title);
    console.log('  Type:', firstSubWithItems.type);
    console.log('  Items (Level 4):', firstSubWithItems.items);
    console.log('\n❌ PROBLEM: Items are stored as array, not separate nodes!');
    console.log('\n✅ SOLUTION: Convert items array to individual TOC nodes');
  }
  
  // Check if any Level 4 nodes exist as separate entities
  const level4Nodes = toc.filter((t: any) => 
    t.type === 'item' || 
    (t.parentId && subtopics.some((s: any) => s.id === t.parentId))
  );
  
  console.log('\nLevel 4 nodes as separate TOC entries:', level4Nodes.length);
  
  if (level4Nodes.length === 0) {
    console.log('\n📋 ACTION NEEDED:');
    console.log('   Need to convert items[] arrays into separate TOC nodes');
    console.log('   Each item should be: { id, title, type: "item", parentId, order }');
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
