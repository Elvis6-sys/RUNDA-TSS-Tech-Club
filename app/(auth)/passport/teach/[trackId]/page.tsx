import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import { canManageTrack } from "@/lib/trainerGuard";
import dynamic from "next/dynamic";
import { getCurriculumContent } from "@/lib/curriculumContent";
import MODULES from "@/lib/learnContent";
import type { TOCItem } from "@/app/api/passport/tracks/[trackId]/toc-generate/route";

// Skip SSR for all trainer UI — purely client-side interactive
const TrainerModuleViewer = dynamic(() => import("@/components/TrainerModuleViewer"), { ssr: false });
const EnhancedQuizGradingDashboard = dynamic(() => import("@/components/EnhancedQuizGradingDashboard"), { ssr: false });
const QuizReportDashboard = dynamic(() => import("@/components/QuizReportDashboard"), {
  ssr: false,
  loading: () => <div className="rounded-2xl border border-slate-700 bg-slate-900/40 p-8 text-center"><span className="text-slate-500 text-sm">Loading reports dashboard...</span></div>
});

export default async function TrainerModulePage({
  params,
}: {
  params: { trackId: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { role: true, status: true },
  });
  if (!profile || profile.status !== "approved") redirect("/dashboard");
  if (profile.role !== "trainer" && profile.role !== "admin") redirect("/passport");

  const allowed = await canManageTrack(
    { id: user.id, role: profile.role },
    params.trackId
  );
  if (!allowed) redirect("/passport");

  const track = await prisma.skillTrack.findUnique({
    where: { id: params.trackId },
    select: {
      id: true,
      name: true,
      description: true,
      icon: true,
      tier: true,
      curriculumUrl: true,
      curriculumType: true,
      tableOfContents: true,
      nodes: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          order: true,
        },
      },
    },
  });
  if (!track) redirect("/passport");

  // Pre-fetch customTocEntries server-side so TrainerModuleViewer has them
  // on first render (no async gap = correct displayToc immediately)
  const initialCustomEntries = await prisma.customTocEntry.findMany({
    where: { trackId: params.trackId },
    orderBy: [{ order: 'asc' }],
    select: {
      id: true,
      type: true,
      parentId: true,
      title: true,
      hours: true,
      order: true,
      isCustom: true,
      sourceId: true,
    },
  });

  const [lessons, resources] = await Promise.all([
    prisma.lesson.findMany({
      where: { subject: track.name },
      orderBy: [{ order: "asc" }],
      select: {
        id: true,
        title: true,
        subject: true,
        tierVisibility: true,
        order: true,
      },
    }),
    prisma.resource.findMany({
      where: {
        subject: track.name,
        trainerId: user.id, // Only show resources uploaded by this teacher
      },
      select: {
        id: true,
        title: true,
        subject: true,
        tierVisibility: true,
        fileUrl: true,
        url: true,
      },
    }),
  ]);

  // Parse tableOfContents from JSON string
  let toc: TOCItem[] = [];
  if (track.tableOfContents) {
    try {
      const parsed = typeof track.tableOfContents === 'string'
        ? JSON.parse(track.tableOfContents)
        : track.tableOfContents;
      toc = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse tableOfContents:', e);
      toc = [];
    }
  }

  // If track has no TOC yet, auto-seed from built-in curriculum (non-blocking)
  if (toc.length === 0) {
    try {
      const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const res = await fetch(
        `${base}/api/passport/tracks/${params.trackId}/toc-generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
          cache: "no-store",
        }
      );
      if (res.ok) {
        const data = await res.json();
        toc = data.toc ?? [];
      }
    } catch {
      // Non-fatal — viewer renders with empty TOC and prompts upload
    }
  }

  // Resolve module code from built-in curriculum registry
  const curriculumMeta = getCurriculumContent(track.name);

  // Find matching learnContent module by exact trackName or moduleCode — no loose substring match
  const learnModule = MODULES.find(
    (m) =>
      m.trackName.toLowerCase() === track.name.toLowerCase() ||
      (curriculumMeta && m.moduleCode === curriculumMeta.code)
  );
  const moduleSlug = learnModule?.slug ?? null;

  return (
    <>
      <TrainerModuleViewer
        track={{
          id: track.id,
          name: track.name,
          description: track.description,
          icon: track.icon,
          tier: track.tier,
          curriculumUrl: track.curriculumUrl,
          curriculumType: track.curriculumType,
          tableOfContents: toc,
        }}
        lessons={lessons.map((l) => ({
          id: l.id,
          title: l.title,
          order: l.order,
          tierVisibility: l.tierVisibility,
        }))}
        resources={resources.map((r) => ({
          id: r.id,
          title: r.title,
          fileUrl: r.fileUrl,
          url: r.url,
        }))}
        nodeCount={track.nodes.length}
        moduleCode={curriculumMeta?.code}
        moduleSlug={moduleSlug}
        trackId={track.id}
        initialCustomTocEntries={initialCustomEntries}
      />
    </>
  );
}
