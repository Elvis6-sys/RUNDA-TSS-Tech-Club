import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/auth/login");

  // Check if user is a trainer
  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  // Redirect trainers to their dashboard
  if (profile?.role === "trainer") {
    redirect("/trainer/dashboard");
  }

  return <DashboardClient />;
}
