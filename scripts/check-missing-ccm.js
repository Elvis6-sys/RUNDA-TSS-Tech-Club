const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const ccmModules = await prisma.skillTrack.groupBy({
    by: ['moduleSlug', 'department'],
    where: {
      curriculumType: 'rtb-tvet',
      moduleSlug: { startsWith: 'ccm' }
    },
    _count: true
  });

  const ccmBySlug = {};
  ccmModules.forEach(m => {
    if (!ccmBySlug[m.moduleSlug]) {
      ccmBySlug[m.moduleSlug] = [];
    }
    ccmBySlug[m.moduleSlug].push(m.department);
  });

  console.log('CCM modules NOT in all 4 departments:\n');
  Object.entries(ccmBySlug).forEach(([slug, depts]) => {
    if (depts.length < 4) {
      console.log(`  ${slug.toUpperCase()}: ${depts.join(', ')} (${depts.length} dept)`);
    }
  });
  
  console.log('\n\nThis is EXPECTED because:');
  console.log('- Some CCM modules only exist in certain levels (L3/L4/L5)');
  console.log('- Not all departments have the same level folders in /All Curriculums');
  console.log('- Example: A CCM module in L3 Building Construction may not exist in L5 Software Development');
  
  await prisma.$disconnect();
}

check().catch(console.error);
