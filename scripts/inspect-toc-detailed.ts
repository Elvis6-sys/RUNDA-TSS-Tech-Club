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
  
  console.log('TOC Analysis:');
  console.log('Total nodes:', toc.length);
  console.log();
  
  // Count by type
  const counts: Record<string, number> = {};
  toc.forEach((n: any) => {
    counts[n.type] = (counts[n.type] || 0) + 1;
  });
  
  console.log('Node types:');
  Object.entries(counts).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  console.log();
  
  // Show first few nodes of each type
  console.log('Sample nodes:');
  
  const outcome = toc.find((n: any) => n.type === 'outcome');
  if (outcome) {
    console.log('\nLevel 1 (Outcome):');
    console.log('  ', JSON.stringify(outcome, null, 2));
  }
  
  const topic = toc.find((n: any) => n.type === 'topic');
  if (topic) {
    console.log('\nLevel 2 (Topic):');
    console.log('  ', JSON.stringify(topic, null, 2));
  }
  
  const subtopic = toc.find((n: any) => n.type === 'subtopic');
  if (subtopic) {
    console.log('\nLevel 3 (Subtopic):');
    console.log('  ', JSON.stringify(subtopic, null, 2));
  }
  
  const item = toc.find((n: any) => n.type === 'item');
  if (item) {
    console.log('\nLevel 4 (Item):');
    console.log('  ', JSON.stringify(item, null, 2));
  } else {
    console.log('\nLevel 4: No item-type nodes found');
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
