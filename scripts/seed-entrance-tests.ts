/**
 * Seed Script: Initialize Entrance Test System
 * Creates entrance test templates in the database
 * Run with: npx tsx scripts/seed-entrance-tests.ts
 */

import { PrismaClient } from '@prisma/client';
import { 
  ENTRANCE_TEST_TEMPLATES, 
  getEntranceTestTemplate,
  calculateTotalPoints,
  calculatePointsBreakdown
} from '../lib/entrance-test-templates';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding entrance test system...\n');

  let totalTemplates = 0;
  let totalQuestions = 0;

  for (const [trade, levels] of Object.entries(ENTRANCE_TEST_TEMPLATES)) {
    console.log(`\n📚 Trade: ${trade}`);
    
    for (const [level, template] of Object.entries(levels)) {
      const totalPoints = calculateTotalPoints(template);
      const { objectivePoints, subjectivePoints } = calculatePointsBreakdown(template);
      
      console.log(`  📝 Level ${level.toUpperCase()}:`);
      console.log(`     - Questions: ${template.questions.length}`);
      console.log(`     - Total Points: ${totalPoints}`);
      console.log(`     - Objective: ${objectivePoints} pts`);
      console.log(`     - Subjective: ${subjectivePoints} pts`);
      console.log(`     - Duration: ${template.duration} min`);
      console.log(`     - Passing: ${template.passingScore}%`);

      totalTemplates++;
      totalQuestions += template.questions.length;
    }
  }

  console.log(`\n✅ Summary:`);
  console.log(`   - Total Templates: ${totalTemplates}`);
  console.log(`   - Total Questions: ${totalQuestions}`);
  console.log(`   - Average Questions per Test: ${Math.round(totalQuestions / totalTemplates)}`);

  console.log(`\n✅ Entrance test templates are ready!`);
  console.log(`   They will be loaded dynamically when students take the test.`);
  console.log(`   No database seeding needed - all stored in code for offline access.`);

  // Optional: Verify all pending entrance tests
  const pendingTests = await prisma.entranceTest.findMany({
    where: { status: 'pending' },
    include: { user: true }
  });

  if (pendingTests.length > 0) {
    console.log(`\n📋 Found ${pendingTests.length} pending entrance test(s):`);
    for (const test of pendingTests) {
      const template = getEntranceTestTemplate(test.trade, test.level);
      console.log(`   - ${test.user.name} (${test.user.email})`);
      console.log(`     Trade: ${test.trade}, Level: ${test.level}`);
      console.log(`     Template: ${template ? '✅ Available' : '❌ Not found'}`);
    }
  } else {
    console.log(`\n✅ No pending entrance tests found.`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding entrance tests:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
