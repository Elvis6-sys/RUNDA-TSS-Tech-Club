const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Cleaning up old modules without moduleSlug...\n');
  
  // Delete modules without moduleSlug (old seed data)
  const deleted = await prisma.skillTrack.deleteMany({
    where: {
      OR: [
        { moduleSlug: null },
        { moduleSlug: '' },
      ]
    },
  });

  console.log(`  ✅ Deleted ${deleted.count} old modules\n`);

  // Now verify the new imports
  console.log('📊 Verifying New Imports:\n');
  console.log('─'.repeat(80));
  
  const deptCounts = await prisma.skillTrack.groupBy({
    by: ['department'],
    _count: true,
    orderBy: { department: 'asc' },
  });

  let total = 0;
  for (const dept of deptCounts) {
    const deptName = dept.department || 'NULL';
    console.log(`  ${deptName}: ${dept._count} modules`);
    total += dept._count;
  }
  
  console.log(`  ${'─'.repeat(40)}`);
  console.log(`  TOTAL: ${total} modules\n`);

  // Check modules with department set
  const withDept = await prisma.skillTrack.count({
    where: { department: { not: null } },
  });
  
  console.log(`✅ Modules with department: ${withDept}/${total}\n`);
  
  // Show sample from each department
  console.log('🔍 Sample Modules per Department:\n');
  const departments = ['building-construction', 'computer-systems-architecture', 'land-surveying', 'software-development'];
  
  for (const dept of departments) {
    const count = await prisma.skillTrack.count({ where: { department: dept } });
    const samples = await prisma.skillTrack.findMany({
      where: { department: dept },
      take: 2,
      select: { name: true, moduleSlug: true, tier: true },
    });
    
    console.log(`  📁 ${dept}: ${count} modules`);
    for (const s of samples) {
      console.log(`    • [${s.tier}] ${s.moduleSlug?.toUpperCase()} - ${s.name}`);
    }
    console.log('');
  }

  await prisma.$disconnect();
}

cleanup().catch(console.error);
