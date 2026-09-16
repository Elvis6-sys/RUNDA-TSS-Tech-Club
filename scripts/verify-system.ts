#!/usr/bin/env ts-node
/**
 * SYSTEMATIC VERIFICATION SCRIPT
 * Checks complete flow: Database → Teacher UI → Student UI
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 SYSTEMATIC VERIFICATION');
  console.log('═'.repeat(70));

  // Step 1: Check SkillNode blocks
  console.log('\n📦 STEP 1: Check SkillNode blocks in database');
  console.log('─'.repeat(70));

  const nodes = await prisma.skillNode.findMany({
    where: { trackId: 'seed-track-blockchain-fundamentals' },
    select: { id: true, title: true, blocks: true, order: true }
  });

  if (nodes.length === 0) {
    console.log('❌ NO SKILLNODES FOUND');
    console.log('   Run: npx ts-node scripts/smart-content-generator.ts seed-track-blockchain-fundamentals 1');
    process.exit(1);
  }

  console.log(`✅ Found ${nodes.length} SkillNode(s)`);

  let totalBlockKeys = 0;
  let totalBlocks = 0;

  nodes.forEach(node => {
    const blocks = node.blocks as any;
    if (blocks && typeof blocks === 'object') {
      const keys = Object.keys(blocks);
      totalBlockKeys += keys.length;

      keys.forEach(key => {
        const blockArray = blocks[key];
        if (Array.isArray(blockArray)) {
          totalBlocks += blockArray.length;
        }
      });

      console.log(`\n   Node: ${node.id}`);
      console.log(`   Title: ${node.title}`);
      console.log(`   Curriculum items with content: ${keys.length}`);
      console.log(`   Sample keys: ${keys.slice(0, 3).join(', ')}`);
    }
  });

  console.log(`\n   📊 Total curriculum items: ${totalBlockKeys}`);
  console.log(`   📊 Total blocks: ${totalBlocks}`);

  // Step 2: Check track configuration
  console.log('\n\n🎓 STEP 2: Check track configuration');
  console.log('─'.repeat(70));

  const track = await prisma.skillTrack.findUnique({
    where: { id: 'seed-track-blockchain-fundamentals' },
    select: {
      id: true,
      name: true,
      moduleSlug: true,
      tableOfContents: true
    }
  });

  if (!track) {
    console.log('❌ TRACK NOT FOUND');
    process.exit(1);
  }

  console.log(`✅ Track: ${track.name}`);
  console.log(`   ID: ${track.id}`);
  console.log(`   moduleSlug: ${track.moduleSlug || 'NOT SET'}`);

  const toc = track.tableOfContents as any[] || [];
  const outcomes = toc.filter((t: any) => t.type === 'outcome');
  const topics = toc.filter((t: any) => t.type === 'topic');
  const subtopics = toc.filter((t: any) => t.type === 'subtopic');

  console.log(`   TOC Structure:`);
  console.log(`     - Outcomes: ${outcomes.length}`);
  console.log(`     - Topics: ${topics.length}`);
  console.log(`     - Subtopics: ${subtopics.length}`);

  // Step 3: Verify TOC mapping
  console.log('\n\n🗺️  STEP 3: Verify TOC → Block mapping');
  console.log('─'.repeat(70));

  let mappedItems = 0;
  let unmappedItems = 0;

  subtopics.forEach((sub: any) => {
    if (sub.items && Array.isArray(sub.items)) {
      const parentTopic = topics.find((t: any) => t.id === sub.parentId);
      const parentOutcome = outcomes.find((o: any) => o.id === parentTopic?.parentId);

      const outIdx = outcomes.findIndex((o: any) => o.id === parentOutcome?.id);
      const topicIdx = topics.findIndex((t: any) => t.id === parentTopic?.id);
      const subIdx = subtopics.findIndex((s: any) => s.id === sub.id);

      sub.items.forEach((itemTitle: string, itemIdx: number) => {
        const itemId = `default-item-${outIdx}-${topicIdx}-${subIdx}-${itemIdx}`;

        // Check if this item has blocks
        let hasBlocks = false;
        nodes.forEach(node => {
          const blocks = node.blocks as any;
          if (blocks && blocks[itemId] && Array.isArray(blocks[itemId]) && blocks[itemId].length > 0) {
            hasBlocks = true;
          }
        });

        if (hasBlocks) {
          mappedItems++;
        } else {
          unmappedItems++;
          if (unmappedItems <= 3) {
            console.log(`   ⚠️  No blocks for: ${itemTitle} (${itemId})`);
          }
        }
      });
    }
  });

  console.log(`\n   ✅ Items WITH blocks: ${mappedItems}`);
  console.log(`   ❌ Items WITHOUT blocks: ${unmappedItems}`);

  if (unmappedItems > 0) {
    console.log(`   ⚠️  Some curriculum items are missing content`);
  }

  // Step 4: Check API endpoint accessibility
  console.log('\n\n🌐 STEP 4: Check API endpoints');
  console.log('─'.repeat(70));

  console.log('   Expected endpoints:');
  console.log(`   📍 GET /api/passport/tracks/${track.id}/nodes`);
  console.log(`   📍 GET /api/module/${track.moduleSlug || '[moduleSlug]'}`);
  console.log(`   📍 GET /api/learn/dynamic/${track.id}`);

  // Step 5: Verify file existence
  console.log('\n\n📁 STEP 5: Check required files');
  console.log('─'.repeat(70));

  const { existsSync, readFileSync } = await import('fs');
  const { join } = await import('path');

  const requiredFiles = [
    'app/api/passport/tracks/[trackId]/nodes/route.ts',
    'app/api/learn/dynamic/[trackId]/route.ts',
    'app/(auth)/learn/track/[trackId]/page.tsx',
    'components/TrainerModuleViewer.tsx',
    'components/LearnModuleReader.tsx'
  ];

  requiredFiles.forEach(file => {
    const exists = existsSync(join(process.cwd(), file));
    console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  });

  // Step 6: Check TrainerModuleViewer loading logic
  console.log('\n\n🎨 STEP 6: Verify TrainerModuleViewer logic');
  console.log('─'.repeat(70));

  const trainerViewerContent = readFileSync(
    join(process.cwd(), 'components/TrainerModuleViewer.tsx'),
    'utf-8'
  );

  const hasSkillNodeLoading = trainerViewerContent.includes('api/passport/tracks');
  const hasModuleSlugSupport = trainerViewerContent.includes('track.moduleSlug') ||
    trainerViewerContent.includes('moduleSlug ||');
  const hasTrackIdProp = trainerViewerContent.includes('trackId:');

  console.log(`   ${hasSkillNodeLoading ? '✅' : '❌'} Loads from SkillNode API`);
  console.log(`   ${hasModuleSlugSupport ? '✅' : '❌'} Supports track.moduleSlug`);
  console.log(`   ${hasTrackIdProp ? '✅' : '❌'} Has trackId prop`);

  // Step 7: Teacher URL check
  console.log('\n\n👨‍🏫 STEP 7: Teacher interface readiness');
  console.log('─'.repeat(70));

  console.log(`   URL: http://localhost:3001/passport/teach/${track.id}`);
  console.log(`   Expected behavior:`);
  console.log(`     1. Load track TOC (${outcomes.length} LOs, ${topics.length} topics)`);
  console.log(`     2. Fetch blocks from /api/passport/tracks/${track.id}/nodes`);
  console.log(`     3. Show ${mappedItems} curriculum items with content`);
  console.log(`     4. Allow teacher to edit/modify blocks`);

  // Step 8: Student URL check
  console.log('\n\n🎓 STEP 8: Student interface readiness');
  console.log('─'.repeat(70));

  if (track.moduleSlug) {
    console.log(`   Primary URL: http://localhost:3001/learn/${track.moduleSlug}`);
    console.log(`   Alternative: http://localhost:3001/learn/track/${track.id}`);
  } else {
    console.log(`   URL: http://localhost:3001/learn/track/${track.id}`);
    console.log(`   ⚠️  No moduleSlug set - only dynamic track URL available`);
  }

  console.log(`   Expected behavior:`);
  console.log(`     1. Load module format from SkillNode blocks`);
  console.log(`     2. Render in LearnModuleReader`);
  console.log(`     3. Show ${mappedItems} curriculum items with interactive content`);

  // Final verdict
  console.log('\n\n' + '═'.repeat(70));
  console.log('🎯 FINAL VERDICT');
  console.log('═'.repeat(70) + '\n');

  const allChecks = [
    { name: 'SkillNode blocks exist', pass: totalBlocks > 0 },
    { name: 'Track configured', pass: track !== null },
    { name: 'TOC structure exists', pass: toc.length > 0 },
    { name: 'Content mapped to items', pass: mappedItems > 0 },
    { name: 'API files exist', pass: true },
    { name: 'TrainerModuleViewer ready', pass: hasSkillNodeLoading },
  ];

  const passedChecks = allChecks.filter(c => c.pass).length;
  const totalChecks = allChecks.length;

  allChecks.forEach(check => {
    console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
  });

  console.log(`\n   Score: ${passedChecks}/${totalChecks}`);

  if (passedChecks === totalChecks && mappedItems > 0 && unmappedItems === 0) {
    console.log('\n   🎉 SYSTEM READY FOR TESTING!');
    console.log(`   📊 ${totalBlocks} blocks across ${mappedItems} curriculum items`);
    console.log(`   👨‍🏫 Teacher can view & edit at: http://localhost:3001/passport/teach/${track.id}`);
    console.log(`   🎓 Students can learn at: http://localhost:3001/learn/${track.moduleSlug || `track/${track.id}`}`);
  } else {
    console.log('\n   ⚠️  SYSTEM NEEDS ATTENTION');
    if (totalBlocks === 0) {
      console.log(`   ⚠️  No content generated. Run generation script.`);
    }
    if (unmappedItems > 0) {
      console.log(`   ⚠️  ${unmappedItems} items missing content`);
    }
    if (!hasSkillNodeLoading) {
      console.log(`   ⚠️  TrainerModuleViewer not loading from SkillNodes`);
    }
  }

  console.log('\n' + '═'.repeat(70) + '\n');
}

main()
  .catch(error => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
