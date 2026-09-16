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
  
  console.log('═'.repeat(80));
  console.log('📊 BLOCKCHAIN FUNDAMENTALS - HIERARCHY ANALYSIS');
  console.log('═'.repeat(80));
  console.log();
  console.log('Track ID:', track.id);
  console.log('Track Name:', track.name);
  console.log('Total Nodes:', toc.length);
  console.log();
  
  // Organize by type
  const outcomes = toc.filter((t: any) => t.type === 'outcome');
  const topics = toc.filter((t: any) => t.type === 'topic');
  const subtopics = toc.filter((t: any) => t.type === 'subtopic');
  
  console.log('HIERARCHY BREAKDOWN:');
  console.log('  Level 1 (Learning Outcomes):', outcomes.length);
  console.log('  Level 2 (Topics):', topics.length);
  console.log('  Level 3 (Indicative Content):', subtopics.length);
  
  // Count Level 4 items
  let totalItems = 0;
  const subtopicsWithItems: any[] = [];
  
  subtopics.forEach((sub: any) => {
    if (sub.items && Array.isArray(sub.items) && sub.items.length > 0) {
      totalItems += sub.items.length;
      subtopicsWithItems.push(sub);
    }
  });
  
  console.log('  Level 4 (Items):', totalItems);
  console.log();
  
  // Show sample structure
  console.log('═'.repeat(80));
  console.log('SAMPLE HIERARCHY STRUCTURE:');
  console.log('═'.repeat(80));
  console.log();
  
  // Show first LO with its children
  if (outcomes.length > 0) {
    const firstLO = outcomes[0];
    console.log(`📘 Level 1: ${firstLO.title}`);
    
    // Find topics under this LO
    const loTopics = topics.filter((t: any) => t.parentId === firstLO.id);
    loTopics.slice(0, 2).forEach((topic: any) => {
      console.log(`  ├─ 📗 Level 2: ${topic.title}`);
      
      // Find subtopics under this topic
      const topicSubs = subtopics.filter((s: any) => s.parentId === topic.id);
      topicSubs.slice(0, 2).forEach((sub: any, idx: number) => {
        const isLast = idx === Math.min(topicSubs.length, 2) - 1;
        const prefix = isLast ? '  └─' : '  ├─';
        console.log(`${prefix} 📙 Level 3: ${sub.title}`);
        
        // Show items if they exist
        if (sub.items && Array.isArray(sub.items) && sub.items.length > 0) {
          sub.items.slice(0, 3).forEach((item: string, itemIdx: number) => {
            const itemIsLast = itemIdx === Math.min(sub.items.length, 3) - 1;
            const itemPrefix = isLast ? '      ' : '  │   ';
            const bullet = itemIsLast ? '└─' : '├─';
            console.log(`${itemPrefix}${bullet} 📄 Level 4: ${item}`);
          });
          if (sub.items.length > 3) {
            const itemPrefix = isLast ? '      ' : '  │   ';
            console.log(`${itemPrefix}   ... (${sub.items.length - 3} more items)`);
          }
        }
      });
      if (topicSubs.length > 2) {
        console.log(`     ... (${topicSubs.length - 2} more subtopics)`);
      }
    });
    if (loTopics.length > 2) {
      console.log(`  ... (${loTopics.length - 2} more topics)`);
    }
  }
  
  console.log();
  console.log('═'.repeat(80));
  console.log('GENERATION PLAN:');
  console.log('═'.repeat(80));
  console.log();
  console.log(`This track has:`);
  console.log(`  • ${outcomes.length} Learning Outcomes (Level 1 overviews needed)`);
  console.log(`  • ${topics.length} Topics (Level 2 introductions needed)`);
  console.log(`  • ${subtopics.length} Indicative Content (Level 3 main lessons needed)`);
  console.log(`  • ${totalItems} Items (Level 4 details needed)`);
  console.log();
  console.log(`Total content pieces to generate: ${outcomes.length + topics.length + subtopics.length + totalItems}`);
  console.log();
  console.log(`Estimated generation time:`);
  console.log(`  • With 17 keys: ~${Math.ceil((outcomes.length + topics.length + subtopics.length + totalItems) / 10)} minutes`);
  console.log();
  
  await prisma.$disconnect();
}

main().catch(console.error);
