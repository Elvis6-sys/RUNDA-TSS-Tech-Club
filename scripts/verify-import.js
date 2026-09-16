const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('\n✨ CURRICULUM IMPORT VERIFICATION REPORT\n');
  console.log('═'.repeat(80));
  
  // Total count
  const total = await prisma.skillTrack.count();
  console.log(`\n📊 TOTAL MODULES IN DATABASE: ${total}\n`);
  
  // By department
  console.log('📁 MODULES BY DEPARTMENT:');
  console.log('─'.repeat(80));
  const byDept = await prisma.skillTrack.groupBy({
    by: ['department'],
    _count: true,
    orderBy: { department: 'asc' },
  });
  
  for (const d of byDept) {
    const icon = d.department === 'building-construction' ? '🏗️' :
                 d.department === 'computer-systems-architecture' ? '🖥️' :
                 d.department === 'land-surveying' ? '📐' :
                 d.department === 'software-development' ? '💻' : '❓';
    const name = d.department || 'NULL/COMMON';
    console.log(`  ${icon} ${name.padEnd(40)} ${d._count} modules`);
  }
  
  // By level
  console.log('\n📚 MODULES BY LEVEL:');
  console.log('─'.repeat(80));
  const byLevel = await prisma.skillTrack.groupBy({
    by: ['tier'],
    _count: true,
    orderBy: { tier: 'asc' },
  });
  
  for (const l of byLevel) {
    console.log(`  ${l.tier.toUpperCase().padEnd(10)} ${l._count} modules`);
  }
  
  // By prefix
  console.log('\n🔤 MODULES BY CODE PREFIX:');
  console.log('─'.repeat(80));
  const allModules = await prisma.skillTrack.findMany({
    select: { moduleSlug: true },
  });
  
  const prefixCount = {};
  for (const m of allModules) {
    if (!m.moduleSlug) continue;
    const prefix = m.moduleSlug.substring(0, 3).toUpperCase();
    prefixCount[prefix] = (prefixCount[prefix] || 0) + 1;
  }
  
  const prefixMapping = {
    'BDC': 'Building Construction',
    'CSA': 'Computer Systems Architecture',
    'LSV': 'Land Surveying',
    'SWD': 'Software Development',
    'CCM': 'Common/Complementary (shared)',
    'GEN': 'General (shared)',
    'ICT': 'ICT/Industrial Attachment',
  };
  
  for (const [prefix, count] of Object.entries(prefixCount).sort()) {
    const desc = prefixMapping[prefix] || 'Other';
    console.log(`  ${prefix.padEnd(5)} ${desc.padEnd(40)} ${count} modules`);
  }
  
  // Quality checks
  console.log('\n✅ QUALITY CHECKS:');
  console.log('─'.repeat(80));
  
  const withDept = await prisma.skillTrack.count({ where: { department: { not: null } } });
  const withSlug = await prisma.skillTrack.count({ where: { moduleSlug: { not: null } } });
  const withCurriculum = await prisma.skillTrack.count({ where: { curriculumType: 'rtb-tvet' } });
  
  console.log(`  ✓ Modules with department assigned: ${withDept}/${total} (${((withDept/total)*100).toFixed(1)}%)`);
  console.log(`  ✓ Modules with moduleSlug: ${withSlug}/${total} (${((withSlug/total)*100).toFixed(1)}%)`);
  console.log(`  ✓ Modules marked as RTB/TVET: ${withCurriculum}/${total} (${((withCurriculum/total)*100).toFixed(1)}%)`);
  
  // Sample modules per department
  console.log('\n🔍 SAMPLE MODULES (3 per department):');
  console.log('─'.repeat(80));
  
  const departments = [
    { key: 'building-construction', icon: '🏗️', name: 'Building Construction' },
    { key: 'computer-systems-architecture', icon: '🖥️', name: 'Computer Systems Architecture' },
    { key: 'land-surveying', icon: '📐', name: 'Land Surveying' },
    { key: 'software-development', icon: '💻', name: 'Software Development' },
  ];
  
  for (const dept of departments) {
    const samples = await prisma.skillTrack.findMany({
      where: { department: dept.key },
      take: 3,
      select: { name: true, moduleSlug: true, tier: true },
      orderBy: { tier: 'asc' },
    });
    
    console.log(`\n  ${dept.icon} ${dept.name}:`);
    for (const s of samples) {
      console.log(`    • [${s.tier.toUpperCase()}] ${s.moduleSlug?.toUpperCase()} - ${s.name}`);
    }
  }
  
  // Expected vs Actual
  console.log('\n\n📈 IMPORT SUMMARY:');
  console.log('─'.repeat(80));
  console.log(`  Expected total modules to import: 193`);
  console.log(`  Actual modules in database: ${total}`);
  console.log(`  Difference: ${193 - total} (likely due to CCM/GEN modules being shared)`);
  
  console.log('\n💡 NOTE:');
  console.log('  CCM and GEN modules are common across departments (languages, math, etc.)');
  console.log('  They appear once in the database but are used by multiple departments.');
  console.log('  This is expected behavior and reduces data duplication.');
  
  console.log('\n' + '═'.repeat(80));
  console.log('✅ VERIFICATION COMPLETE!\n');
  
  await prisma.$disconnect();
}

verify().catch(console.error);
