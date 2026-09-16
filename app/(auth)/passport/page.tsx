import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import ModulesPageClient from "@/components/ModulesPageClient";

export default async function PassportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      role: true,
      name: true,
      department: true,
      level: true,
      status: true,
    },
  });

  if (!profile) redirect("/auth/login");

  // ADMIN VIEW: Show all modules with department filter
  if (profile.role === "admin") {
    const allModules = await prisma.curriculumModule.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        department: true,
        level: true,
        category: true,
        description: true,
        pdfPath: true,
        pdfFileName: true,
        fileSize: true,
      },
      orderBy: [
        { department: "asc" },
        { level: "asc" },
        { category: "asc" },
        { code: "asc" },
      ],
    });

    // Group by department
    const modulesByDept: Record<string, typeof allModules> = {};
    allModules.forEach(mod => {
      if (!modulesByDept[mod.department]) {
        modulesByDept[mod.department] = [];
      }
      modulesByDept[mod.department].push(mod);
    });

    return (
      <ModulesPageClient
        role="admin"
        userName={profile.name}
        modulesByDept={modulesByDept}
        userDepartment={null}
        userLevel={null}
      />
    );
  }

  // TRAINER VIEW: Show only assigned modules (both SkillTracks and CurriculumModules)
  if (profile.role === "trainer") {
    const assignments = await prisma.trainerModule.findMany({
      where: { trainerId: user.id },
      include: {
        track: {
          select: {
            id: true,
            name: true,
            description: true,
            department: true,
            tier: true,
            icon: true,
            moduleSlug: true,
            curriculumUrl: true,
            nodes: {
              orderBy: { order: "asc" },
              select: { id: true },
            },
          },
        },
        module: {
          select: {
            id: true,
            code: true,
            name: true,
            level: true,
            category: true,
            department: true,
            description: true,
            pdfPath: true,
            pdfFileName: true,
            fileSize: true,
          },
        },
      },
    });

    // Get CurriculumModules assigned to this trainer
    const curriculumModules = assignments.filter(a => a.module).map(a => a.module!);

    // Get module codes to filter out duplicate SkillTracks
    const linkedModuleCodes = curriculumModules.map(m => m.code.toLowerCase());

    // Filter SkillTracks: only show those NOT linked to a CurriculumModule
    // (to avoid showing duplicates)
    const tracks = assignments
      .filter(a => a.track)
      .map(a => a.track!)
      .filter(track => !track.moduleSlug || !linkedModuleCodes.includes(track.moduleSlug));

    return (
      <ModulesPageClient
        role="trainer"
        userName={profile.name}
        trainerTracks={tracks}
        trainerModules={curriculumModules}
        userDepartment={null}
        userLevel={null}
      />
    );
  }

  // STUDENT VIEW: Show modules from their department + level
  if (!profile.department || !profile.level) {
    // Use role as fallback if level is not set (for existing users)
    const fallbackLevel = profile.role && ["l3", "l4", "l5"].includes(profile.role) ? profile.role : null;

    if (!profile.department || (!profile.level && !fallbackLevel)) {
      return (
        <ModulesPageClient
          role="student"
          userName={profile.name}
          userDepartment={profile.department}
          userLevel={profile.level || fallbackLevel}
          missingProfile={true}
        />
      );
    }

    // Use fallback level if level is not set
    profile.level = profile.level || fallbackLevel;
  }

  const studentModules = await prisma.curriculumModule.findMany({
    where: {
      department: profile.department!,
      level: profile.level!,
      isActive: true,
    },
    select: {
      id: true,
      code: true,
      name: true,
      department: true,
      level: true,
      category: true,
      description: true,
      pdfPath: true,
      pdfFileName: true,
      fileSize: true,
    },
    orderBy: [
      { category: "asc" },
      { code: "asc" },
    ],
  });

  console.log(`[passport] 📊 Found ${studentModules.length} modules for dept=${profile.department} level=${profile.level}`);
  console.log(`[passport] 📊 Sample:`, studentModules.slice(0, 2).map(m => ({ code: m.code, name: m.name, category: m.category })));

  // Group by category
  const groupedModules = {
    core: studentModules.filter(m => m.category === "core"),
    general: studentModules.filter(m => m.category === "general"),
    ccm: studentModules.filter(m => m.category === "ccm"),
  };

  console.log(`[passport] 📊 Grouped: core=${groupedModules.core.length}, general=${groupedModules.general.length}, ccm=${groupedModules.ccm.length}`);

  return (
    <ModulesPageClient
      role="student"
      userName={profile.name}
      userDepartment={profile.department}
      userLevel={profile.level}
      groupedModules={groupedModules}
    />
  );
}
