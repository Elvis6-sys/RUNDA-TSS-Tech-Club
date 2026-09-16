const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  try {
    console.log('════════════════════════════════════════════════════════════════');
    console.log('        FINAL CURRICULUM IMPORT VERIFICATION REPORT');
    console.log('════════════════════════════════════════════════════════════════\n');

    // Total count
    const total = await prisma.skillTrack.count({
      where: { curriculumType: 'rtb-tvet' }
    });
    console.log(`📊 TOTAL MODULES IN DATABASE: ${total}\n`);

    // By department
    const byDept = await prisma.skillTrack.groupBy({
      by: ['department'],
      where: { curriculumType: 'rtb-tvet' },
      _count: true
    });
    
    console.log('📁 MODULES BY DEPARTMENT:');
    console.log('────────────────────────────────────────────────────────────────');
    byDept.sort((a, b) => (b._count || 0) - (a._count || 0)).forEach(d => {
      const icon = d.department === 'building-construction' ? '🏗️' :
                   d.department === 'computer-systems-architecture' ? '🖥️' :
                   d.department === 'land-surveying' ? '📐' :
                   d.department === 'software-development' ? '💻' : '❓';
      console.log(`  ${icon} ${d.department?.padEnd(35)} ${d._count} modules`);
    });

    // By level
    const byLevel = await prisma.skillTrack.groupBy({
      by: ['tier'],
      where: { curriculumType: 'rtb-tvet' },
      _count: true
    });
    
    console.log('\n📚 MODULES BY LEVEL:');
    console.log('────────────────────────────────────────────────────────────────');
    byLevel.sort((a, b) => (a.tier || '').localeCompare(b.tier || '')).forEach(l => {
      console.log(`  ${l.tier?.toUpperCase().padEnd(10)} ${l._count} modules`);
    });

    // Check CCM separation
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

    console.log('\n✅ CCM/GEN MODULE SEPARATION CHECK:');
    console.log('────────────────────────────────────────────────────────────────');
    console.log(`  Total CCM entries: ${ccmModules.length}`);
    console.log(`  Unique CCM codes: ${Object.keys(ccmBySlug).length}`);
    
    // Check that each CCM has entries for all 4 departments
    const deptCount = {};
    Object.values(ccmBySlug).forEach(depts => {
      const count = depts.length;
      deptCount[count] = (deptCount[count] || 0) + 1;
    });
    
    console.log('\n  Distribution of CCM modules across departments:');
    Object.entries(deptCount).sort((a, b) => b[0] - a[0]).forEach(([count, num]) => {
      const status = count === '4' ? '✓' : '⚠️';
      console.log(`    ${status} ${num} modules in ${count} department(s)`);
    });

    // Sample modules
    console.log('\n🔍 SAMPLE MODULES PER DEPARTMENT:');
    console.log('────────────────────────────────────────────────────────────────');
    
    const departments = [
      'building-construction',
      'computer-systems-architecture', 
      'land-surveying',
      'software-development'
    ];

    for (const dept of departments) {
      const samples = await prisma.skillTrack.findMany({
        where: {
          department: dept,
          curriculumType: 'rtb-tvet'
        },
        select: {
          moduleSlug: true,
          name: true,
          tier: true
        },
        take: 3
      });

      const icon = dept === 'building-construction' ? '🏗️' :
                   dept === 'computer-systems-architecture' ? '🖥️' :
                   dept === 'land-surveying' ? '📐' : '💻';
      
      console.log(`  ${icon} ${dept}:`);
      samples.forEach(s => {
        console.log(`    • [${s.tier?.toUpperCase()}] ${s.moduleSlug.toUpperCase()} - ${s.name}`);
      });
    }

    // Verify CCMEN302 (the REVIEWED file)
    console.log('\n🎯 SPECIAL CHECK: CCMEN302 (REVIEWED file):');
    console.log('────────────────────────────────────────────────────────────────');
    const ccmen302 = await prisma.skillTrack.findMany({
      where: {
        moduleSlug: 'ccmen302',
        curriculumType: 'rtb-tvet'
      },
      select: {
        department: true,
        name: true
      }
    });
    
    if (ccmen302.length === 0) {
      console.log('  ❌ NOT FOUND - This is an ERROR!');
    } else {
      console.log(`  ✅ Found ${ccmen302.length} entries:`);
      ccmen302.forEach(m => {
        console.log(`    - ${m.department}: ${m.name}`);
      });
    }

    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('✅ VERIFICATION COMPLETE!');
    console.log('════════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
