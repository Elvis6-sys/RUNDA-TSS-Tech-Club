import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import { getAccessibleRooms } from "@/lib/chatAccess";

export default async function ChatPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await prisma.userProfile.findUnique({ where: { id: user.id } });
  if (!profile || profile.status !== "approved") redirect("/dashboard");

  // Seed default rooms once
  const count = await prisma.chatRoom.count();
  if (count === 0) {
    await prisma.chatRoom.createMany({
      data: [
        { name: "General", type: "general", tierVisibility: null },
        { name: "L3 Room", type: "tier", tierVisibility: "l3" },
        { name: "L4 Room", type: "tier", tierVisibility: "l4" },
        { name: "L5 Room", type: "tier", tierVisibility: "l5" },
        { name: "Alumni Lounge", type: "tier", tierVisibility: "alumni" },
        { name: "Admin", type: "tier", tierVisibility: "admin" },
      ],
    });
  }

  const allRooms = await prisma.chatRoom.findMany({ orderBy: { createdAt: "asc" } });

  // For trainers we also need their assigned module tiers
  let trainerTiers: string[] = [];
  if (profile.role === "trainer") {
    const assignments = await prisma.trainerModule.findMany({
      where: { trainerId: profile.id },
      include: { track: { select: { tier: true } } },
    });
    trainerTiers = [...new Set(assignments.filter(a => a.track).map((a) => a.track!.tier).filter(Boolean))];
  }

  const rooms = getAccessibleRooms(allRooms, profile.role, trainerTiers);

  const defaultRoom = rooms[0];
  if (defaultRoom) redirect(`/chat/${defaultRoom.id}`);

  return (
    <main className="container py-10">
      <div className="text-center text-slate-400">No chat rooms available.</div>
    </main>
  );
}
