import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import AdminTrainerPanel from "@/components/AdminTrainerPanel";

export default async function AdminTrainersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (!profile || profile.role !== "admin") redirect("/dashboard");

  // Fetch all trainers with their module assignments
  const trainers = await prisma.userProfile.findMany({
    where: { role: "trainer" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      trainedModules: {
        select: {
          id: true,
          module: {
            select: {
              id: true,
              code: true,
              name: true,
              level: true,
              category: true,
              department: true,
            }
          },
        },
      },
    },
  });

  // All curriculum modules so admin can assign, grouped by department
  const allModules = await prisma.curriculumModule.findMany({
    where: { isActive: true },
    orderBy: [
      { department: "asc" },
      { level: "asc" },
      { category: "asc" },
      { code: "asc" },
    ],
    select: {
      id: true,
      code: true,
      name: true,
      level: true,
      category: true,
      department: true,
    },
  });

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-8">

        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-violet-400">Admin · Trainers</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Manage Trainers</h1>
          <p className="mt-2 text-slate-400 max-w-xl">
            Create trainer accounts, then assign curriculum modules by selecting department,
            level, module type (Core/General/CCM), and specific module. Trainers will see
            their assigned modules and can prepare content for them.
          </p>
        </div>

        {/* Panel */}
        <AdminTrainerPanel
          trainers={trainers.map((t) => ({
            ...t,
            trainedModules: t.trainedModules
              .filter((m) => m.module !== null)
              .map((m) => ({
                id: m.id,
                module: m.module!,
              })),
          }))}
          allModules={allModules}
        />
      </div>
    </main>
  );
}
