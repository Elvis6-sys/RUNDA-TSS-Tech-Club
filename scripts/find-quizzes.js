#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findQuizzes() {
  try {
    console.log('🔍 Searching for quizzes in the database...\n');

    // Get all skill nodes with blocks
    const nodes = await prisma.skillNode.findMany({
      include: {
        track: {
          select: {
            name: true,
            tier: true,
          }
        }
      },
      take: 50,
    });

    console.log(`📊 Total SkillNodes found: ${nodes.length}\n`);

    if (nodes.length === 0) {
      console.log('⚠️  No SkillNodes found in database.');
      console.log('💡 You may need to seed your database or create content first.\n');
      return;
    }

    // Filter nodes that have quiz blocks
    const nodesWithQuizzes = nodes.filter(node => {
      if (!node.blocks) return false;
      const blocks = Array.isArray(node.blocks) ? node.blocks : [];
      return blocks.some(block => block.type === 'quiz');
    });

    console.log(`🎯 Nodes with quiz blocks: ${nodesWithQuizzes.length}\n`);

    if (nodesWithQuizzes.length === 0) {
      console.log('⚠️  No quiz blocks found in any SkillNode.');
      console.log('💡 You may need to create learning modules with quizzes.\n');
      
      console.log('📋 Sample nodes found (without quizzes):');
      nodes.slice(0, 5).forEach((node, idx) => {
        console.log(`\n${idx + 1}. ${node.title}`);
        console.log(`   ID: ${node.id}`);
        console.log(`   Track: ${node.track?.name || 'N/A'}`);
        console.log(`   Tier: ${node.track?.tier || 'N/A'}`);
        const blocks = Array.isArray(node.blocks) ? node.blocks : [];
        console.log(`   Blocks: ${blocks.length} (types: ${blocks.map(b => b.type).join(', ')})`);
      });
      return;
    }

    // Display nodes with quizzes
    console.log('✅ Found SkillNodes with quizzes:\n');
    console.log('=' .repeat(80));

    nodesWithQuizzes.forEach((node, idx) => {
      const blocks = Array.isArray(node.blocks) ? node.blocks : [];
      const quizBlocks = blocks.filter(b => b.type === 'quiz');
      
      console.log(`\n${idx + 1}. 📚 ${node.title}`);
      console.log(`   ${'─'.repeat(70)}`);
      console.log(`   ID: ${node.id}`);
      console.log(`   Track: ${node.track?.name || 'N/A'}`);
      console.log(`   Tier: ${node.track?.tier || 'N/A'}`);
      console.log(`   XP Reward: ${node.xpReward}`);
      console.log(`   Est. Time: ${node.estimatedMinutes} mins`);
      console.log(`   Total Blocks: ${blocks.length}`);
      console.log(`   Quiz Blocks: ${quizBlocks.length}`);
      
      // Show quiz details
      quizBlocks.forEach((quiz, qIdx) => {
        const questions = quiz.questions || [];
        const questionCount = questions.length || (quiz.question ? 1 : 0);
        console.log(`\n   Quiz ${qIdx + 1}:`);
        console.log(`     - Block ID: ${quiz.id}`);
        console.log(`     - Title: ${quiz.title || 'Untitled Quiz'}`);
        console.log(`     - Questions: ${questionCount}`);
        
        if (questions.length > 0) {
          questions.slice(0, 2).forEach((q, i) => {
            console.log(`     - Q${i + 1}: ${q.question?.substring(0, 60)}...`);
          });
        } else if (quiz.question) {
          console.log(`     - Question: ${quiz.question.substring(0, 60)}...`);
        }
      });
      
      console.log(`\n   📍 URL: /learn/${node.id}`);
      console.log(`   🔗 Direct link: http://localhost:3000/learn/${node.id}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ Summary: Found ${quizBlocks} quiz(s) across ${nodesWithQuizzes.length} module(s)\n`);

  } catch (error) {
    console.error('❌ Error querying database:', error.message);
    console.error('\n💡 Make sure your DATABASE_URL is set correctly in .env');
  } finally {
    await prisma.$disconnect();
  }
}

// Count total quiz blocks
function countQuizBlocks(nodes) {
  return nodes.reduce((total, node) => {
    const blocks = Array.isArray(node.blocks) ? node.blocks : [];
    return total + blocks.filter(b => b.type === 'quiz').length;
  }, 0);
}

findQuizzes();
