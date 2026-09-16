import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding admin and trainer users...');

  const hashedPassword = await bcrypt.hash('12345678', 10);

  // Create first admin user: leotuyi10@gmail.com
  const admin1 = await prisma.userProfile.upsert({
    where: { email: 'leotuyi10@gmail.com' },
    update: {},
    create: {
      id: 'admin_' + Date.now(),
      email: 'leotuyi10@gmail.com',
      password: hashedPassword,
      name: 'Leo Tuyi',
      role: 'admin',
      status: 'approved',
      school: 'RUNDA TSS',
      cohort: '2024',
      xp: 0,
    },
  });

  console.log('✅ Admin user created:', admin1.email);

  // Wait a bit to ensure unique ID
  await new Promise(resolve => setTimeout(resolve, 10));

  // Create trainer user: leotuyi100@gmail.com
  const trainer = await prisma.userProfile.upsert({
    where: { email: 'leotuyi100@gmail.com' },
    update: {},
    create: {
      id: 'trainer_' + Date.now(),
      email: 'leotuyi100@gmail.com',
      password: hashedPassword,
      name: 'Leo Tuyi (Trainer)',
      role: 'trainer',
      status: 'approved',
      school: 'RUNDA TSS',
      cohort: '2024',
      xp: 0,
    },
  });

  console.log('✅ Trainer user created:', trainer.email);
  console.log('🎉 Admin and trainer users are ready for offline app!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
