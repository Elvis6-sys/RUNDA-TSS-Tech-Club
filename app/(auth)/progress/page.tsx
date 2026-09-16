import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import ProgressClient from "@/components/ProgressClient";

export default async function ProgressPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { status: true },
  });

  if (!profile || profile.status !== "approved") redirect("/dashboard");

  return <ProgressClient />;
}
