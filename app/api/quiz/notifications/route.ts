import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export async function GET(_req: NextRequest) {
  try {
    // Local auth
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const notifications = await prisma.quizGradeNotification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        // Join through to the submission so we can build deep-links
        submission: {
          select: {
            id: true,
            nodeId: true,
            blockId: true,
            trackId: true,
            marksReleased: true,
            avgScore: true,
            status: true,
            node: { select: { id: true, title: true } },
            track: { select: { id: true, name: true, tier: true } },
          },
        },
      },
    });

    // Shape the response — attach link metadata derived from the submission
    const shaped = notifications.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
      // Link destinations
      marksReleased: n.submission?.marksReleased ?? false,
      submissionStatus: n.submission?.status ?? null,
      nodeId: n.submission?.nodeId ?? null,
      blockId: n.submission?.blockId ?? null,
      trackId: n.submission?.trackId ?? null,
      nodeTitle: n.submission?.node?.title ?? null,
      trackName: n.submission?.track?.name ?? null,
    }));

    return NextResponse.json({ notifications: shaped });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Mark ALL as read
export async function PATCH(_req: NextRequest) {
  try {
    // Local auth
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.quizGradeNotification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
