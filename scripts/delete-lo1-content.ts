#!/usr/bin/env ts-node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const trackId = 'seed-track-blockchain-fundamentals';
  
  console.log('🗑️  Deleting old LO1 content...\n');

  const node = await prisma.skillNode.findUnique({
    where: { id: trackId },
    select: { id: true, blocks: true }
  });

  if (!node || !node.blocks) {
    console.log('❌ No content found');
    process.exit(1);
  }

  const blocks = node.blocks as Record<string, any[]>;
  const allKeys = Object.keys(blocks);
  const lo1Keys = allKeys.filter(k => k.startsWith('default-item-0-'));
  const otherKeys = allKeys.filter(k => !k.startsWith('default-item-0-'));
  
  console.log(`📦 Current: ${lo1Keys.length} LO1 items, ${otherKeys.length} other items`);
  
  const cleanedBlocks: Record<string, any[]> = {};
  otherKeys.forEach(key => {
    cleanedBlocks[key] = blocks[key];
  });
  
  await prisma.skillNode.update({
    where: { id: trackId },
    data: { blocks: cleanedBlocks as any }
  });
  
  console.log(`✅ Deleted ${lo1Keys.length} LO1 items\n`);
  await prisma.$disconnect();
}

main();
