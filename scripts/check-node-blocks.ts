#!/usr/bin/env ts-node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const nodes = await prisma.skillNode.findMany({
    where: { 
      trackId: 'seed-track-blockchain-fundamentals'
    },
    select: { id: true, title: true, blocks: true }
  });
  
  console.log('📦 Found', nodes.length, 'nodes\n');
  
  nodes.forEach((node: any) => {
    const blocks = node.blocks as any;
    const keys = blocks ? Object.keys(blocks) : [];
    console.log(`\nNode: ${node.id}`);
    console.log(`  Title: ${node.title}`);
    console.log(`  Block keys (${keys.length}):`, keys.slice(0, 10));
    
    // Check for item keys
    const itemKeys = keys.filter((k: string) => k.includes('default-item'));
    console.log(`  📄 Item keys: ${itemKeys.length}`);
    if (itemKeys.length > 0) {
      console.log(`  Sample items:`, itemKeys.slice(0, 5));
      // Show sample content
      const sampleKey = itemKeys[0];
      const sampleBlocks = blocks[sampleKey];
      console.log(`  Content for "${sampleKey}":`, sampleBlocks?.length, 'blocks');
    }
  });
  
  await prisma.$disconnect();
}

check();
