import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import dynamic from "next/dynamic";

// Load student viewer without SSR
const StudentModuleViewer = dynamic(
  () => import("@/components/StudentModuleViewer"),
  { ssr: false }
);

export default async function StudentTrackPage({
  params,
}: {
  params: { trackId: string };
}) {
  const user = await getCurrentUser();

  if (!user) redirect("/auth/login");

  // Get user profile
  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      role: true,
      status: true,
      xp: true,
      department: true,
      level: true
    },
  });

  if (!profile || profile.status !== "approved") {
    redirect("/dashboard");
  }

  // Load track with all related data
  const track = await prisma.skillTrack.findUnique({
    where: { id: params.trackId },
    select: {
      id: true,
      name: true,
      description: true,
      tableOfContents: true,
      nodes: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          blocks: true,
          xpReward: true,
          order: true,
          estimatedMinutes: true,
        }
      },
      customTocEntries: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          type: true,
          title: true,
          hours: true,
          order: true,
          sourceId: true,
          parentId: true,
          isCustom: true,
        }
      },
    },
  });

  if (!track) {
    redirect("/passport");
  }

  // Get user's progress
  const progress = await prisma.skillProgress.findMany({
    where: {
      userId: user.id,
      nodeId: { in: track.nodes.map(n => n.id) }
    },
    select: {
      nodeId: true,
      status: true,
      readPct: true,
    }
  });

  const progressMap = Object.fromEntries(
    progress.map(p => [p.nodeId, p])
  );

  // Parse tableOfContents from JSON string
  let parsedTableOfContents: any[] = [];
  if (track.tableOfContents) {
    try {
      const parsed = JSON.parse(track.tableOfContents);
      parsedTableOfContents = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('❌ Failed to parse tableOfContents:', e);
      parsedTableOfContents = [];
    }
  }

  return (
    <StudentModuleViewer
      track={{
        id: track.id,
        name: track.name,
        description: track.description,
        tableOfContents: parsedTableOfContents,
        nodes: track.nodes.map(n => {
          // Parse blocks from JSON string
          let parsedBlocks: Record<string, any[]> | null = null;
          if (n.blocks) {
            if (typeof n.blocks === 'string') {
              try {
                parsedBlocks = JSON.parse(n.blocks);
              } catch (e) {
                console.error('❌ Failed to parse node blocks:', e);
                parsedBlocks = {};
              }
            } else if (typeof n.blocks === 'object') {
              parsedBlocks = n.blocks as Record<string, any[]>;
            }
          }
          return { ...n, blocks: parsedBlocks };
        }),
      }}
      customTocEntries={track.customTocEntries}
      user={{
        id: profile.id,
        name: profile.name || "Student",
        xp: profile.xp || 0
      }}
      progress={progressMap}
    />
  );
}
