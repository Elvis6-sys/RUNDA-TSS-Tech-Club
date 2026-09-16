import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import ChatRoomThemed from "@/components/ChatRoomThemed";
import { canAccessRoom, getAccessibleRooms, type RoomRow } from "@/lib/chatAccess";

export default async function ChatRoomPage({ params }: { params: { roomId: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await prisma.userProfile.findUnique({ where: { id: user.id } });
  if (!profile || profile.status !== "approved") redirect("/dashboard");

  const room = await prisma.chatRoom.findUnique({ where: { id: params.roomId } });
  if (!room) redirect("/chat");

  // Resolve trainer's assigned module tiers (needed for access check)
  let trainerTiers: string[] = [];
  if (profile.role === "trainer") {
    const assignments = await prisma.trainerModule.findMany({
      where: { trainerId: profile.id },
      include: { track: { select: { tier: true } } },
    });
    trainerTiers = [...new Set(assignments.filter(a => a.track).map((a) => a.track!.tier).filter(Boolean))];
  }

  // Guard: kick out users who shouldn't be in this room
  if (!canAccessRoom(room as RoomRow, profile.role, trainerTiers)) {
    redirect("/chat");
  }

  // Build sidebar: only rooms this user can access
  const allRooms = await prisma.chatRoom.findMany({ orderBy: { createdAt: "asc" } });
  const accessibleRooms = getAccessibleRooms(allRooms as RoomRow[], profile.role, trainerTiers);

  const messages = await prisma.message.findMany({
    where: { roomId: room.id },
    include: {
      sender: { select: { id: true, name: true, role: true, profileImage: true } },
      reactions: { include: { user: { select: { id: true, name: true } } } },
      replyTo: {
        select: {
          id: true, content: true, fileName: true,
          sender: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return (
    <ChatRoomThemed
      room={{ id: room.id, name: room.name }}
      allRooms={accessibleRooms.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        tierVisibility: r.tierVisibility,
      }))}
      initialMessages={messages.map((m) => ({
        id: m.id,
        content: m.content,
        fileUrl: m.fileUrl,
        fileType: m.fileType,
        fileName: m.fileName,
        replyToId: m.replyToId,
        replyTo: m.replyTo,
        createdAt: m.createdAt.toISOString(),
        sender: { id: m.sender.id, name: m.sender.name, role: m.sender.role, profileImage: m.sender.profileImage },
        reactions: m.reactions.map((r) => ({
          id: r.id,
          emoji: r.emoji,
          user: { id: r.user.id, name: r.user.name },
        })),
      }))}
      currentUser={{ id: profile.id, name: profile.name ?? "Student", role: profile.role }}
    />
  );
}
