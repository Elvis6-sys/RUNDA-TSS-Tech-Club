#!/usr/bin/env ts-node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const track = await prisma.skillTrack.findUnique({
    where: { id: 'seed-track-blockchain-fundamentals' }
  });
  
  if (!track) {
    console.log('❌ Track not found');
    return;
  }
  
  const toc = track.tableOfContents as any[];
  console.log('✅ Track:', track.name);
  console.log('📊 Total TOC nodes:', toc.length);
  
  const outcomes = toc.filter((t: any) => t.type === 'outcome');
  const topics = toc.filter((t: any) => t.type === 'topic');
  const subtopics = toc.filter((t: any) => t.type === 'subtopic');
  
  console.log('\n📋 Hierarchy Breakdown:');
  console.log('  Level 1 (Learning Outcomes):', outcomes.length);
  console.log('  Level 2 (Topics):', topics.length);
  console.log('  Level 3 (Subtopics/Indicative Content):', subtopics.length);
  
  // Count Level 4 items
  let itemCount = 0;
  subtopics.forEach((sub: any) => {
    if (sub.items && Array.isArray(sub.items)) {
      itemCount += sub.items.length;
    }
  });
  console.log('  Level 4 (Items):', itemCount);
  
  console.log('\n🎯 First 3 Learning Outcomes:');
  outcomes.slice(0, 3).forEach((o: any, i: number) => {
    console.log(`  LO${i+1}: ${o.title}`);
  });
  
  console.log('\n📌 First 5 Topics:');
  topics.slice(0, 5).forEach((t: any, i: number) => {
    console.log(`  ${i+1}. ${t.title}`);
  });
  
  await prisma.$disconnect();
}

main().catch(console.error);
