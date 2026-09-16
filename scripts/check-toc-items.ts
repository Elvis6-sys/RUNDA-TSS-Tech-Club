#!/usr/bin/env ts-node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const track = await prisma.skillTrack.findUnique({
    where: { id: 'seed-track-blockchain-fundamentals' }
  });
  
  if (track?.tableOfContents) {
    const toc = track.tableOfContents as any[];
    const items = toc.filter((t: any) => t.type === 'item');
    
    console.log('📊 TOC Structure:');
    console.log('  Total entries:', toc.length);
    console.log('  📘 Outcomes:', toc.filter((t: any) => t.type === 'outcome').length);
    console.log('  📗 Topics:', toc.filter((t: any) => t.type === 'topic').length);
    console.log('  📙 Subtopics:', toc.filter((t: any) => t.type === 'subtopic').length);
    console.log('  📄 Items:', items.length);
    
    console.log('\n📄 Sample Level 4 Items:');
    items.slice(0, 5).forEach((item: any) => {
      const parent = toc.find((t: any) => t.id === item.parentId);
      console.log(`  - "${item.title}"`);
      console.log(`    ID: ${item.id}`);
      console.log(`    Parent: ${parent?.title || item.parentId}`);
      console.log('');
    });
  }
  
  await prisma.$disconnect();
}

check();
