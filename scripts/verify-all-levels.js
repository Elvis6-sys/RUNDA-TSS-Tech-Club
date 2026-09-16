const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  console.log('\n🔍 PRECISE VERIFICATION OF ALL 4 HIERARCHY LEVELS\n');
  console.log('═'.repeat(70) + '\n');
  
  const track = await prisma.skillTrack.findUnique({
    where: { id: 'seed-track-blockchain-fundamentals' },
    select: { tableOfContents: true }
  });
  
  const node = await prisma.skillNode.findUnique({
    where: { id: 'seed-track-blockchain-fundamentals-lo1' },
    select: { blocks: true }
  });
  
  if (!node || !node.blocks) {
    console.log('❌ No blocks found in database\n');
    process.exit(1);
  }
  
  const blocks = node.blocks;
  const toc = track.tableOfContents || [];
  
  const outcomes = toc.filter(t => t.type === 'outcome');
  const topics = toc.filter(t => t.type === 'topic');
  const subtopics = toc.filter(t => t.type === 'subtopic');
  
  // Check each level
  console.log('📘 LEVEL 1: LEARNING OUTCOMES\n');
  outcomes.forEach((outcome, outIdx) => {
    const key = `default-outcome-${outIdx}`;
    const hasContent = blocks[key] && Array.isArray(blocks[key]);
    const numBlocks = hasContent ? blocks[key].length : 0;
    
    console.log(`${hasContent ? '✅' : '❌'} ${outcome.title}`);
    console.log(`   Key: ${key}`);
    console.log(`   Blocks: ${numBlocks}`);
    if (hasContent && numBlocks > 0) {
      console.log(`   Block types: ${blocks[key].map(b => b.type).join(', ')}`);
    }
    console.log('');
  });
  
  console.log('\n📗 LEVEL 3: TOPICS\n');
  let topicCount = 0;
  outcomes.forEach((outcome, outIdx) => {
    const outcomeTopics = topics.filter(t => t.parentId === outcome.id);
    outcomeTopics.forEach((topic, topicIdx) => {
      topicCount++;
      const key = `default-topic-${outIdx}-${topicIdx}`;
      const hasContent = blocks[key] && Array.isArray(blocks[key]);
      const numBlocks = hasContent ? blocks[key].length : 0;
      
      if (topicCount <= 5) {
        console.log(`${hasContent ? '✅' : '❌'} ${topic.title}`);
        console.log(`   Key: ${key}`);
        console.log(`   Blocks: ${numBlocks}`);
        console.log('');
      }
    });
  });
  if (topicCount > 5) console.log(`... and ${topicCount - 5} more topics\n`);
  
  console.log('\n📙 LEVEL 2: INDICATIVE CONTENTS (Subtopics)\n');
  let subCount = 0;
  outcomes.forEach((outcome, outIdx) => {
    const outcomeTopics = topics.filter(t => t.parentId === outcome.id);
    outcomeTopics.forEach((topic, topicIdx) => {
      const topicSubs = subtopics.filter(s => s.parentId === topic.id);
      topicSubs.forEach(sub => {
        subCount++;
        const subIdxInList = subtopics.findIndex(s => s.id === sub.id);
        const key = `default-subtopic-${outIdx}-${topicIdx}-${subIdxInList}`;
        const hasContent = blocks[key] && Array.isArray(blocks[key]);
        const numBlocks = hasContent ? blocks[key].length : 0;
        
        if (subCount <= 5) {
          console.log(`${hasContent ? '✅' : '❌'} ${sub.title}`);
          console.log(`   Key: ${key}`);
          console.log(`   Blocks: ${numBlocks}`);
          console.log('');
        }
      });
    });
  });
  if (subCount > 5) console.log(`... and ${subCount - 5} more subtopics\n`);
  
  console.log('\n📝 LEVEL 4: ITEMS\n');
  let itemCount = 0;
  let itemWithContent = 0;
  outcomes.forEach((outcome, outIdx) => {
    const outcomeTopics = topics.filter(t => t.parentId === outcome.id);
    outcomeTopics.forEach((topic, topicIdx) => {
      const topicSubs = subtopics.filter(s => s.parentId === topic.id);
      topicSubs.forEach(sub => {
        const subIdxInList = subtopics.findIndex(s => s.id === sub.id);
        if (sub.items && Array.isArray(sub.items)) {
          sub.items.forEach((itemTitle, itemIdx) => {
            itemCount++;
            const key = `default-item-${outIdx}-${topicIdx}-${subIdxInList}-${itemIdx}`;
            const hasContent = blocks[key] && Array.isArray(blocks[key]);
            if (hasContent) itemWithContent++;
            
            if (itemCount <= 5) {
              const numBlocks = hasContent ? blocks[key].length : 0;
              console.log(`${hasContent ? '✅' : '❌'} ${itemTitle}`);
              console.log(`   Key: ${key}`);
              console.log(`   Blocks: ${numBlocks}`);
              console.log('');
            }
          });
        }
      });
    });
  });
  if (itemCount > 5) console.log(`... and ${itemCount - 5} more items\n`);
  
  console.log('\n' + '═'.repeat(70));
  console.log('📊 FINAL SUMMARY\n');
  console.log(`Level 1 - Learning Outcomes:   ${outcomes.length} in TOC, ${outcomes.filter((o, i) => blocks[`default-outcome-${i}`]).length} with content`);
  console.log(`Level 3 - Topics:              ${topics.length} in TOC, ${Object.keys(blocks).filter(k => k.includes('topic') && !k.includes('subtopic')).length} with content`);
  console.log(`Level 2 - Indicative Contents: ${subtopics.length} in TOC, ${Object.keys(blocks).filter(k => k.includes('subtopic')).length} with content`);
  console.log(`Level 4 - Items:               ${itemCount} in TOC, ${itemWithContent} with content`);
  console.log('═'.repeat(70));
  
  const allLevelsHaveContent = 
    outcomes.some((o, i) => blocks[`default-outcome-${i}`]) &&
    Object.keys(blocks).some(k => k.includes('topic') && !k.includes('subtopic')) &&
    Object.keys(blocks).some(k => k.includes('subtopic')) &&
    itemWithContent > 0;
  
  if (allLevelsHaveContent) {
    console.log('\n✅ SUCCESS: Content exists at ALL 4 hierarchy levels!');
    console.log('✅ Teachers can now click on any level and see content');
    console.log('✅ Students will have a rich, multi-level learning experience\n');
  } else {
    console.log('\n❌ INCOMPLETE: Some levels are missing content\n');
  }
  
  await prisma.$disconnect();
})();
