/**
 * Fix User Levels Script
 * 
 * Sets the `level` field for users who have role=l3/l4/l5 but level=null
 * This fixes the issue where students approved before the level field was added
 * cannot access modules.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixUserLevels() {
  console.log("\n🔧 Fixing user levels...\n");

  // Find users with l3/l4/l5 role but no level set
  const usersToFix = await prisma.userProfile.findMany({
    where: {
      role: { in: ["l3", "l4", "l5"] },
      level: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      level: true,
    },
  });

  console.log(`Found ${usersToFix.length} users to fix\n`);

  if (usersToFix.length === 0) {
    console.log("✅ No users need fixing!");
    return;
  }

  // Update each user
  for (const user of usersToFix) {
    await prisma.userProfile.update({
      where: { id: user.id },
      data: { level: user.role }, // Set level to match role
    });

    console.log(`✅ Fixed: ${user.email} (${user.name}) - level set to ${user.role}`);
  }

  console.log(`\n✅ Fixed ${usersToFix.length} users!\n`);
}

fixUserLevels()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
