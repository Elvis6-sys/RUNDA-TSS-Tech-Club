/**
 * Setup test data for offline testing
 * Creates trainer, assigns modules, creates approved student
 */

import { prisma } from "../lib/prisma";
import * as bcrypt from "bcryptjs";

async function main() {
  console.log("🔧 Setting up offline test data...\n");

  // 1. Create approved student for software-development L4
  console.log("1️⃣  Creating approved student...");
  const studentPassword = await bcrypt.hash("student123", 10);
  const student = await prisma.userProfile.upsert({
    where: { email: "student@offline.test" },
    create: {
      id: "student-offline-test",
      email: "student@offline.test",
      password: studentPassword,
      name: "Test Student",
      role: "l4",  // Level 4
      level: "l4",
      department: "software-development",
      status: "approved",
    },
    update: {
      status: "approved",
      role: "l4",
      level: "l4",
      department: "software-development",
    },
  });
  console.log(`   ✅ Student: ${student.email} (${student.department} ${student.level})`);

  // 2. Create trainer account
  console.log("\n2️⃣  Creating trainer account...");
  const trainerPassword = await bcrypt.hash("trainer123", 10);
  const trainer = await prisma.userProfile.upsert({
    where: { email: "trainer@offline.test" },
    create: {
      id: "trainer-offline-test",
      email: "trainer@offline.test",
      password: trainerPassword,
      name: "Test Trainer",
      role: "trainer",
      status: "approved",
    },
    update: {
      status: "approved",
      role: "trainer",
    },
  });
  console.log(`   ✅ Trainer: ${trainer.email}`);

  // 3. Assign curriculum modules to trainer
  console.log("\n3️⃣  Assigning curriculum modules to trainer...");
  
  // Get some software-development L4 core modules
  const modules = await prisma.curriculumModule.findMany({
    where: {
      department: "software-development",
      level: "l4",
      category: "core",
      isActive: true,
    },
    take: 3,
  });

  let assignedCount = 0;
  for (const module of modules) {
    await prisma.trainerModule.upsert({
      where: {
        trainerId_moduleId: {
          trainerId: trainer.id,
          moduleId: module.id,
        },
      },
      create: {
        trainerId: trainer.id,
        moduleId: module.id,
      },
      update: {},
    });
    console.log(`   ✅ Assigned: ${module.code} - ${module.name}`);
    assignedCount++;
  }

  console.log(`\n   Total modules assigned: ${assignedCount}`);

  // 4. Summary
  console.log("\n" + "=".repeat(70));
  console.log("✅ OFFLINE TEST DATA READY!\n");
  console.log("📋 Test Accounts:");
  console.log("   Admin:   admin@test.com / admin123");
  console.log("   Student: student@offline.test / student123");
  console.log("           Department: software-development | Level: L4");
  console.log("   Trainer: trainer@offline.test / trainer123");
  console.log(`           Assigned ${assignedCount} curriculum modules`);
  console.log("\n🧪 Test Flow:");
  console.log("   1. Sign in as admin → Go to /admin/trainers");
  console.log("   2. Verify trainer appears with assigned modules");
  console.log("   3. Sign out, sign in as trainer → Go to /passport");
  console.log("   4. Verify assigned curriculum modules appear");
  console.log("   5. Click 'View Curriculum' → PDF should open");
  console.log("   6. Sign out, sign in as student → Go to /passport");
  console.log("   7. Verify student sees L4 software-development modules");
  console.log("   8. Click 'Study Module' → Should go to learn page");
  console.log("\n💡 Note: SkillTrack learn/teach pages need SkillTrack data");
  console.log("   CurriculumModule is for PDF reference only.");
  console.log("=".repeat(70));
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
