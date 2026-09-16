#!/usr/bin/env ts-node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const node = await prisma.skillNode.findUnique({
    where: { id: 'seed-track-blockchain-fundamentals' },
    select: { blocks: true }
  });
  
  const blocks = node?.blocks as Record<string, any[]> || {};
  const lo1Keys = Object.keys(blocks).filter(k => k.startsWith('default-item-0-')).sort();
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 CONTENT STATUS CHECK');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`✅ LO1 Items with content: ${lo1Keys.length}/55\n`);
  
  if (lo1Keys.length > 0) {
    console.log('First 5 items:', lo1Keys.slice(0, 5));
    console.log('Last 5 items:', lo1Keys.slice(-5));
    
    // Check which items are missing
    const allExpected = Array.from({ length: 55 }, (_, i) => i);
    const existing = lo1Keys.map(k => {
      const match = k.match(/default-item-0-(\d+)-(\d+)-(\d+)/);
      return match ? parseInt(match[1]) * 100 + parseInt(match[2]) * 10 + parseInt(match[3]) : -1;
    });
    
    console.log(`\n📈 Success rate: ${Math.round(lo1Keys.length / 55 * 100)}%`);
  }
  
  await prisma.$disconnect();
}

main();
