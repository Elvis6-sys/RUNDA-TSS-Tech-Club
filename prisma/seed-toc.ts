/**
 * seed-toc.ts — Seeds table of contents for all tracks from static curriculum.
 * Run: npx ts-node --compiler-options '{"module":"CommonJS","esModuleInterop":true}' prisma/seed-toc.ts
 */
import { PrismaClient } from "@prisma/client";
import { getCurriculumContent } from "../lib/curriculumContent";

const prisma = new PrismaClient();

type TOCItem = {
  id: string; type: "outcome" | "topic" | "subtopic";
  title: string; hours?: number; performanceCriteria?: string[];
  items?: string[]; parentId?: string;
};

function buildTOC(trackName: string): TOCItem[] | null {
  const c = getCurriculumContent(trackName);
  if (!c) return null;
  const toc: TOCItem[] = [];
  for (const lo of c.learningOutcomes) {
    toc.push({ id: lo.id, type: "outcome", title: lo.title, hours: lo.hours, performanceCriteria: lo.performanceCriteria });
    for (const topic of lo.topics) {
      const tid = `${lo.id}-${topic.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24)}`;
      toc.push({ id: tid, type: "topic", title: topic.title, parentId: lo.id });
      for (const sub of topic.subtopics) {
        const sid = `${tid}-${sub.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20)}`;
        toc.push({ id: sid, type: "subtopic", title: sub.title, items: sub.items, parentId: tid });
      }
    }
  }
  return toc;
}

function buildSkeleton(name: string, nodeCount: number): TOCItem[] {
  return [
    { id: "lo1", type: "outcome", title: `Understand ${name} Fundamentals`, hours: nodeCount * 8,
      performanceCriteria: [`Core concepts of ${name} are properly understood`, `Fundamentals are correctly applied`] },
    { id: "lo1-t1", type: "topic", title: "Core Concepts", parentId: "lo1" },
    { id: "lo1-t1-s1", type: "subtopic", title: "Introduction & Overview", parentId: "lo1-t1",
      items: [`Definition and purpose of ${name}`, "Key terminology", "Industry applications and relevance", "Learning objectives and outcomes"] },
    { id: "lo1-t1-s2", type: "subtopic", title: "Environment Setup", parentId: "lo1-t1",
      items: ["Required tools and software", "Installation steps", "Verify setup", "First hands-on exercise"] },
    { id: "lo2", type: "outcome", title: `Apply ${name} Techniques`, hours: nodeCount * 10,
      performanceCriteria: ["Techniques are correctly applied to practical problems", "Output meets specified requirements"] },
    { id: "lo2-t1", type: "topic", title: "Practical Application", parentId: "lo2" },
    { id: "lo2-t1-s1", type: "subtopic", title: "Guided Exercises", parentId: "lo2-t1",
      items: ["Follow step-by-step tutorial", "Complete lab exercises", "Apply to sample problems", "Document your work"] },
    { id: "lo2-t1-s2", type: "subtopic", title: "Mini Project", parentId: "lo2-t1",
      items: ["Define project scope", "Implement solution", "Test and validate", "Present findings"] },
    { id: "lo3", type: "outcome", title: `Evaluate & Improve ${name} Skills`, hours: nodeCount * 5,
      performanceCriteria: ["Work is critically evaluated", "Improvements are identified and applied"] },
    { id: "lo3-t1", type: "topic", title: "Review & Assessment", parentId: "lo3" },
    { id: "lo3-t1-s1", type: "subtopic", title: "Self-Assessment Checklist", parentId: "lo3-t1",
      items: ["Review all learning outcomes", "Identify gaps in understanding", "Revisit challenging concepts", "Complete final assessment"] },
  ];
}

async function main() {
  const tracks = await prisma.skillTrack.findMany({
    where: { id: { startsWith: "seed-track-" } },
    select: { id: true, name: true, _count: { select: { nodes: true } } },
    orderBy: [{ tier: "asc" }, { order: "asc" }],
  });

  console.log(`\nSeeding TOC for ${tracks.length} tracks…\n`);
  let withStatic = 0, withSkeleton = 0;

  const updates = tracks.map(track => {
    const toc = buildTOC(track.name) ?? buildSkeleton(track.name, track._count.nodes);
    const source = buildTOC(track.name) ? "static" : "skeleton";
    if (source === "static") withStatic++; else withSkeleton++;
    const label = source === "static" ? "✦" : "○";
    console.log(`  ${label} [${source.toUpperCase().padEnd(8)}] ${track.name} (${toc.filter(t => t.type === "outcome").length} LOs, ${toc.length} items)`);
    return prisma.skillTrack.update({ where: { id: track.id }, data: { tableOfContents: toc as object } });
  });

  await Promise.all(updates);
  console.log(`\n✓ Done — ${withStatic} from static curriculum, ${withSkeleton} from skeleton.\n`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
