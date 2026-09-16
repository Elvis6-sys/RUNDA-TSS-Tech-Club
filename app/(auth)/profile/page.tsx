import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      school: true,
      cohort: true,
      level: true,
      role: true,
      xp: true,
      profileImage: true,
      createdAt: true,
    },
  });

  if (!profile) redirect("/auth/login");

  return <ProfileClient profile={profile} />;
}
