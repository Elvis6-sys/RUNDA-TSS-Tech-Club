import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import ModuleReader from "@/components/ModuleReader";
import LessonModuleReader from "@/components/LessonModuleReader";

export default async function ModulePage({ params }: { params: { nodeId: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { role: true, status: true, name: true, xp: true },
  });
  if (!profile || profile.status !== "approved") redirect("/dashboard");

  const node = await prisma.skillNode.findUnique({
    where: { id: params.nodeId },
    include: {
      track: { select: { id: true, name: true, icon: true } },
      progress: { where: { userId: user.id } },
      blockProgress: { where: { userId: user.id } },
    },
  });
  if (!node) redirect("/passport");

  const canEdit = ["admin", "alumni", "l5"].includes(profile.role);

  // Parse blocks JSON (SQLite stores as TEXT)
  let blocks: object[] = [];
  try {
    if (typeof node.blocks === 'string') {
      blocks = JSON.parse(node.blocks);
    } else if (Array.isArray(node.blocks)) {
      blocks = node.blocks;
    }
  } catch (e) {
    console.error('[passport/module] Failed to parse blocks:', e);
    blocks = [];
  }

  // If no blocks authored yet, find a matching lesson by title or subject
  if (blocks.length === 0) {
    const lesson = await prisma.lesson.findFirst({
      where: {
        OR: [
          { title: { contains: node.title } },
          { subject: { contains: node.track.name } },
        ],
      },
      orderBy: { order: "asc" },
    });

    return (
      <LessonModuleReader
        node={{
          id: node.id,
          title: node.title,
          description: node.description,
          xpReward: node.xpReward,
          estimatedMinutes: node.estimatedMinutes,
          track: node.track,
          progress: node.progress[0]
            ? {
              status: node.progress[0].status,
              readPct: node.progress[0].readPct,
              verifiedAt: node.progress[0].verifiedAt?.toISOString() ?? null,
              evidenceUrl: node.progress[0].evidenceUrl,
            }
            : null,
        }}
        lesson={lesson ? { id: lesson.id, title: lesson.title, subject: lesson.subject, content: lesson.content } : null}
        userId={user.id}
      />
    );
  }

  return (
    <ModuleReader
      node={{
        id: node.id,
        title: node.title,
        description: node.description,
        xpReward: node.xpReward,
        estimatedMinutes: node.estimatedMinutes,
        videoUrl: node.videoUrl,
        blocks,
        track: node.track,
        progress: node.progress[0]
          ? {
            id: node.progress[0].id,
            status: node.progress[0].status,
            readPct: node.progress[0].readPct,
            verifiedAt: node.progress[0].verifiedAt?.toISOString() ?? null,
            evidenceUrl: node.progress[0].evidenceUrl,
          }
          : null,
        blockProgress: node.blockProgress.map((bp) => ({
          blockId: bp.blockId,
          state: bp.state,
          payload: (bp.payload ?? {}) as Record<string, unknown>,
        })),
      }}
      userId={user.id}
      userXp={profile.xp}
      canEdit={canEdit}
    />
  );
}
