import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import Nav from "@/components/Nav";
import GlobalProgressBar from "@/components/GlobalProgressBar";
import AdminSyncBadge from "@/components/AdminSyncBadge";
import GlobalAIAssistant from "@/components/GlobalAIAssistant";
import { ModuleReadingProvider } from "@/contexts/ModuleReadingContext";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) redirect("/auth/login");

  let profile;
  try {
    profile = await prisma.userProfile.findUnique({ where: { id: user.id } });
  } catch (err) {
    // Transient DB connection failure
    console.error("[AuthLayout] DB connection error:", err);
    return (
      <html lang="en">
        <body className="min-h-screen bg-slate-950 flex items-center justify-center text-center px-4">
          <div className="max-w-sm">
            <p className="text-4xl mb-4">⚠️</p>
            <h1 className="text-xl font-bold text-white mb-2">Database temporarily unavailable</h1>
            <p className="text-slate-400 text-sm mb-6">
              The server is starting up. This usually resolves in a few seconds.
            </p>
            <a
              href={typeof window !== "undefined" ? window.location.href : "/dashboard"}
              className="inline-block rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold px-6 py-3 transition"
            >
              Retry
            </a>
          </div>
        </body>
      </html>
    );
  }

  if (!profile) redirect("/auth/login");

  return (
    <ModuleReadingProvider>
      <Nav role={profile.role} name={profile.name} profileImage={profile.profileImage ?? null} />
      {/* Global 3-segment progress bar — only for students, not trainers/admins */}
      {!["admin", "trainer"].includes(profile.role) && <GlobalProgressBar />}
      {children}
      {/* Admin-only sync badge (Tauri desktop app only) */}
      <AdminSyncBadge isAdmin={profile.role === 'admin'} />
      {/* Global AI Assistant - appears on all pages */}
      <GlobalAIAssistant userRole={profile.role} userName={profile.name} userLevel={profile.level} userCohort={profile.cohort} />
    </ModuleReadingProvider>
  );
}
