import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import { getLearnModule } from "@/lib/learnContent";
import LearnModuleReader from "@/components/LearnModuleReader";

export default async function LearnModulePage({
  params,
}: {
  params: { moduleSlug: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  // Verify profile
  let profile = null;
  try {
    profile = await prisma.userProfile.findUnique({
      where: { id: user.id },
      select: { role: true, status: true, name: true, xp: true },
    });
  } catch {
    // DB error — allow through in dev
  }
  if (profile && profile.status !== "approved") redirect("/dashboard");

  // Trainers should not access this page — redirect to passport
  if (profile?.role === "trainer") {
    redirect("/passport");
  }

  // Check if this moduleSlug has database-driven content  
  // If yes, redirect to unified view that uses same TOC as teacher.
  // IMPORTANT: redirect() throws internally — must NOT be inside try/catch.
  let dbTrackId: string | null = null;
  try {
    const track = await prisma.skillTrack.findFirst({
      where: { moduleSlug: params.moduleSlug },
      select: { id: true, tableOfContents: true },
    });
    if (track?.tableOfContents) {
      // Parse and check if it's actually not empty
      try {
        const parsed = JSON.parse(track.tableOfContents);
        if (Array.isArray(parsed) && parsed.length > 0) {
          dbTrackId = track.id;
        }
      } catch (e) {
        console.error('Failed to parse tableOfContents:', e);
      }
    }
  } catch (error) {
    console.error('Error loading track:', error);
  }

  if (dbTrackId) {
    redirect(`/learn/track/${dbTrackId}`);
  }

  // Fall back to static content from /lib/learnContent.ts
  const module = getLearnModule(params.moduleSlug);

  // Try to get existing progress (non-blocking)
  let existingProgress: { readPct: number; status: string } | null = null;
  try {
    const node = await prisma.skillNode.findFirst({
      where: {
        track: { name: module.trackName, tier: module.tier },
        title: { contains: module.moduleCode },
      },
    });
    if (node) {
      const sp = await prisma.skillProgress.findUnique({
        where: { userId_nodeId: { userId: user.id, nodeId: node.id } },
      });
      if (sp) existingProgress = { readPct: sp.readPct, status: sp.status };
    }
  } catch {
    // First-time users won't have a node yet
  }

  return (
    <LearnModuleReader
      moduleSlug={params.moduleSlug}
      module={module}
      initialProgress={existingProgress}
      userName={profile?.name ?? "Student"}
    />
  );
}
