import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import EventsClient from "@/components/EventsClient";
import Image from "next/image";

export default async function EventsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await prisma.userProfile.findUnique({ where: { id: user.id } });
  if (!profile || profile.status !== "approved") redirect("/dashboard");

  const events = await prisma.event.findMany({ orderBy: { date: "asc" } });

  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/images/students-group.jpg"
          alt="Events background"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-900/95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
      </div>

      {/* Hero Section */}
      <div className="relative border-b border-slate-800/50 bg-gradient-to-b from-slate-900/40 to-transparent backdrop-blur-sm">
        <div className="container py-16">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-sm font-medium text-blue-300">Community Events & Activities</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
              Upcoming <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Events</span>
            </h1>

            <p className="text-xl text-slate-300 leading-relaxed max-w-2xl">
              Join our vibrant community at workshops, demo days, mentorship sessions, and holiday intensives.
              Connect, learn, and grow together.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container py-12">
        <EventsClient events={events} isAdmin={profile.role === "admin"} currentUserId={profile.id} />
      </main>
    </div>
  );
}
