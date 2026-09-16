import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const modules = await prisma.curriculumModule.findMany({
    select: { code: true, name: true, department: true, level: true, category: true },
    orderBy: [{ department: 'asc' }, { level: 'asc' }, { code: 'asc' }]
  });
  
  console.log(`\nTotal modules in database: ${modules.length}\n`);
  
  const byDept = modules.reduce((acc, m) => {
    if (!acc[m.department]) acc[m.department] = {};
    if (!acc[m.department][m.level]) acc[m.department][m.level] = [];
    acc[m.department][m.level].push({ code: m.code, name: m.name, category: m.category });
    return acc;
  }, {});
  
  for (const [dept, levels] of Object.entries(byDept)) {
    console.log(`\n━━━ ${dept.toUpperCase()} ━━━`);
    for (const [level, mods] of Object.entries(levels)) {
      console.log(`  ${level.toUpperCase()}: ${mods.length} modules`);
      mods.forEach(m => console.log(`    - ${m.code}: ${m.name} (${m.category})`));
    }
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
