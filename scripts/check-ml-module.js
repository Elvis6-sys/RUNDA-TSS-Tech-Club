const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkModule() {
  try {
    const node = await prisma.skillNode.findFirst({
      where: {
        title: { contains: 'Machine Learning', mode: 'insensitive' }
      },
      include: { track: true }
    });

    if (!node) {
      console.log('❌ Module not found');
      return;
    }

    console.log('✅ Found module:', node.title);
    console.log('   ID:', node.id);
    console.log('   Track:', node.track?.name || 'N/A');
    
    const blocks = Array.isArray(node.blocks) ? node.blocks : [];
    const quizBlocks = blocks.filter(b => b.type === 'quiz');
    
    console.log('\n📊 Content:');
    console.log('   Total blocks:', blocks.length);
    console.log('   Quiz blocks:', quizBlocks.length);
    
    if (quizBlocks.length > 0) {
      quizBlocks.forEach((quiz, idx) => {
        const questions = quiz.questions || [];
        console.log(`\n   Quiz ${idx + 1}:`);
        console.log(`     ID: ${quiz.id}`);
        console.log(`     Title: ${quiz.title || 'Untitled'}`);
        console.log(`     Questions: ${questions.length}`);
      });
    } else {
      console.log('\n⚠️  No quiz blocks found in this module');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkModule();
