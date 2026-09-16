const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    // Count CCM modules by department
    const ccmModules = await prisma.skillTrack.groupBy({
      by: ['moduleSlug', 'department'],
      where: {
        curriculumType: 'rtb-tvet',
        moduleSlug: {
          startsWith: 'ccm'
        }
      },
      _count: true
    });
    
    console.log('📊 CCM Modules by Department:');
    console.log('Total CCM module entries:', ccmModules.length);
    
    // Check if each CCM module has entries for multiple departments
    const modulesBySlug = {};
    ccmModules.forEach(m => {
      if (!modulesBySlug[m.moduleSlug]) {
        modulesBySlug[m.moduleSlug] = [];
      }
      modulesBySlug[m.moduleSlug].push(m.department);
    });
    
    console.log('\nSample CCM Modules:');
    Object.entries(modulesBySlug).slice(0, 5).forEach(([slug, depts]) => {
      console.log(`  ${slug}: ${depts.join(', ')}`);
    });
    
    // Check a specific module (Citizenship)
    const ccmcz301 = await prisma.skillTrack.findMany({
      where: {
        moduleSlug: 'ccmcz301',
        curriculumType: 'rtb-tvet'
      },
      select: {
        department: true,
        name: true
      }
    });
    
    console.log('\n🔍 CCMCZ301 (Citizenship) entries:');
    ccmcz301.forEach(m => {
      console.log(`  - ${m.department}: ${m.name}`);
    });
    
    // Count modules per department
    const deptCounts = await prisma.skillTrack.groupBy({
      by: ['department'],
      where: {
        curriculumType: 'rtb-tvet'
      },
      _count: true
    });
    
    console.log('\n📁 Total Modules Per Department:');
    deptCounts.sort((a, b) => (b._count || 0) - (a._count || 0)).forEach(d => {
      console.log(`  ${d.department || 'NULL'}: ${d._count} modules`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
