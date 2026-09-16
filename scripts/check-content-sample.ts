#!/usr/bin/env ts-node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const node = await prisma.skillNode.findUnique({
    where: { id: 'seed-track-blockchain-fundamentals' }
  });
  
  const blocks = node?.blocks as any;
  const firstItem = blocks['default-item-0-0-0-0'];
  
  console.log('\n📄 Sample item: default-item-0-0-0-0');
  console.log(`Total blocks: ${firstItem?.length || 0}\n`);
  
  firstItem?.forEach((block: any, idx: number) => {
    console.log(`\nBlock ${idx}: ${block.type}`);
    if (block.type === 'text' && block.content) {
      const preview = block.content.substring(0, 300);
      console.log('Content:', preview);
      if (block.content.includes('mermaid')) {
        console.log('*** CONTAINS MERMAID! ***');
      }
    }
  });
  
  await prisma.$disconnect();
}

check();
