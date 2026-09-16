#!/usr/bin/env ts-node
/**
 * Save generated blockchain content to database in correct format
 * Maps TOC nodes to SkillNode.blocks for display in LearnModuleReader
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const trackId = 'seed-track-blockchain-fundamentals';
  
  console.log('═'.repeat(80));
  console.log('💾 SAVING GENERATED CONTENT TO DATABASE');
  console.log('═'.repeat(80));
  console.log();
  
  const track = await prisma.skillTrack.findUnique({
    where: { id: trackId }
  });
  
  if (!track) {
    console.log('❌ Track not found');
    return;
  }
  
  const toc = track.tableOfContents as any[];
  
  console.log('Track:', track.name);
  console.log('TOC nodes:', toc.length);
  console.log();
  
  // Check existing SkillNodes
  const existingNodes = await prisma.skillNode.findMany({
    where: { trackId }
  });
  
  console.log('Existing SkillNodes:', existingNodes.length);
  console.log();
  
  if (existingNodes.length === 0) {
    console.log('⚠️  No SkillNodes found. Creating nodes for TOC structure...\n');
    
    // Create SkillNode for each Learning Outcome
    const outcomes = toc.filter((t: any) => t.type === 'outcome');
    
    for (const outcome of outcomes) {
      // Create a node for this LO with placeholder blocks
      const node = await prisma.skillNode.create({
        data: {
          id: outcome.id,
          trackId: trackId,
          title: outcome.title,
          description: `Interactive content for ${outcome.title}`,
          order: outcomes.indexOf(outcome),
          blocks: {
            // This will store the actual content blocks
            message: 'Generated content will be inserted here'
          } as any,
          estimatedMinutes: outcome.hours * 60 || 600
        }
      });
      
      console.log(`✅ Created SkillNode: ${node.id}`);
    }
    
    console.log();
  }
  
  console.log('═'.repeat(80));
  console.log('✅ DATABASE STRUCTURE READY');
  console.log('═'.repeat(80));
  console.log();
  console.log('Next step: Re-run generation with updated script that saves directly');
  console.log('Or manually map generated content to SkillNode.blocks');
  console.log();
  
  await prisma.$disconnect();
}

main().catch(console.error);
