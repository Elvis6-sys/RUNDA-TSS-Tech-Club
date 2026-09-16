#!/usr/bin/env ts-node
/**
 * REGENERATE LO1 CONTENT WITH REAL IMAGES
 * 
 * Deletes existing LO1 content and regenerates it with:
 * - REAL images from Unsplash (no placeholders)
 * - NO ASCII art diagrams
 * - Rich multimedia content
 */

import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

async function main() {
  const trackId = 'seed-track-blockchain-fundamentals';
  
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('🔄 REGENERATING LO1 WITH REAL IMAGES');
  console.log('   Replacing ASCII art and placeholders with professional visuals');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Get the node
    const node = await prisma.skillNode.findUnique({
      where: { id: trackId },
      select: { id: true, blocks: true }
    });

    if (!node || !node.blocks) {
      console.log('❌ No content found');
      process.exit(1);
    }

    // Step 2: Delete all LO1 items (default-item-0-*)
    const blocks = node.blocks as Record<string, any[]>;
    const allKeys = Object.keys(blocks);
    const lo1Keys = allKeys.filter(k => k.startsWith('default-item-0-'));
    const otherKeys = allKeys.filter(k => !k.startsWith('default-item-0-'));
    
    console.log(`📦 Current content:`);
    console.log(`   - LO1 items: ${lo1Keys.length} (will be deleted)`);
    console.log(`   - Other items: ${otherKeys.length} (will be kept)`);
    
    // Keep only non-LO1 content
    const cleanedBlocks: Record<string, any[]> = {};
    otherKeys.forEach(key => {
      cleanedBlocks[key] = blocks[key];
    });
    
    console.log(`\n🗑️  Deleting ${lo1Keys.length} old LO1 items...`);
    await prisma.skillNode.update({
      where: { id: trackId },
      data: { blocks: cleanedBlocks as any }
    });
    
    console.log(`✅ Deleted successfully\n`);
    
    // Step 3: Run enhanced generator to create new content
    console.log(`🚀 Regenerating LO1 with REAL images...\n`);
    console.log('═══════════════════════════════════════════════════════════════════════\n');
    
    const { stdout, stderr } = await execAsync('npx ts-node scripts/enhanced-content-generator.ts', {
      cwd: '/home/leon/Documents/RUNDA TSS Tech Club',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    
    console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('\n══════════════════════════════════════════════════════════════════════');
    console.log('✅ REGENERATION COMPLETE!');
    console.log('   LO1 now has REAL images from Unsplash');
    console.log('   No more ASCII art or placeholder images!');
    console.log('\n🎨 Refresh your browser to see the improvements:');
    console.log('   Teacher: http://localhost:3001/passport/teach/seed-track-blockchain-fundamentals');
    console.log('   Student: http://localhost:3001/learn/l5-specific-modules-swdbf501-blockchains-fundamentals');
    console.log('══════════════════════════════════════════════════════════════════════\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
