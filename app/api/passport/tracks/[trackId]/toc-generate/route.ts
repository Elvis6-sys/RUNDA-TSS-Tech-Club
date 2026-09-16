/**
 * POST /api/passport/tracks/[trackId]/toc-generate
 *
 * Generates a structured, curriculum-accurate Table of Contents.
 *
 * Priority chain:
 *  1. Static built-in curriculum (curriculumContent.ts) — always preferred,
 *     100% matches the official RQF curriculum PDFs already parsed.
 *  2. AI (Groq llama-3.3-70b) — only when PDF text is uploaded AND the
 *     module isn't in the static registry. Uses a carefully structured
 *     prompt that extracts the exact RQF hierarchy.
 *  3. Skeleton — absolute last resort.
 *
 * The generated TOC is saved to SkillTrack.tableOfContents immediately.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/local-auth";
import { getCallerProfile, canManageTrack } from "@/lib/trainerGuard";
import { getCurriculumContent } from "@/lib/curriculumContent";
import { parseRQFCurriculum, type TOCItem } from "@/lib/parseRQFCurriculum";

// Re-export TOCItem for use in other components
export type { TOCItem };

// ─── Utility: make a slug ─────────────────────────────────────────────────────

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

// ─── Priority 1: Build TOC from static curriculum (exact curriculum accuracy) ─

function buildStaticTOC(trackName: string): TOCItem[] | null {
  const curriculum = getCurriculumContent(trackName);
  if (!curriculum) return null;

  const toc: TOCItem[] = [];

  for (const lo of curriculum.learningOutcomes) {
    // Learning Outcome
    toc.push({
      id: lo.id,
      type: "outcome",
      title: lo.title,
      hours: lo.hours,
      performanceCriteria: lo.performanceCriteria,
    });

    for (const topic of lo.topics) {
      const topicId = `${lo.id}-${slug(topic.title)}`;

      // Topic (indicative content section)
      toc.push({
        id: topicId,
        type: "topic",
        title: topic.title,
        parentId: lo.id,
      });

      for (const sub of topic.subtopics) {
        const subId = `${topicId}-${slug(sub.title)}`;

        // Subtopic with items (detailed content checklist)
        toc.push({
          id: subId,
          type: "subtopic",
          title: sub.title,
          items: sub.items ?? [],
          parentId: topicId,
        });
      }
    }
  }

  return toc;
}

// ─── Priority 3: AI extraction (fallback, if pattern parsing fails) ──────────

async function generateWithGroq(
  curriculumText: string,
  trackName: string,
  moduleCode: string,
): Promise<TOCItem[] | null> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return null;

  // Groq's gpt-oss-120b has 8000 TPM limit. With prompt overhead (~2000 tokens),
  // we have ~6000 tokens for curriculum text. 1 token ≈ 4 chars → 24000 chars max.
  // Use 16000 to be safe and ensure the most important content (beginning) is included
  const text = curriculumText.slice(0, 16000);

  const systemPrompt = `You are an expert RQF (Rwanda Qualifications Framework) curriculum analyst.
Your task is to extract a COMPLETE and ACCURATE Table of Contents from the given curriculum document.

The output must be a JSON array of TOCItem objects ONLY — no extra text, no markdown, no code fences.

Each TOCItem has this shape:
{
  "id": "string",              // unique slug, e.g. "lo1", "lo1-t1", "lo1-t1-s1"
  "type": "outcome"|"topic"|"subtopic",
  "title": "string",           // EXACT title from the document
  "hours": number,             // learning hours (outcome only)
  "performanceCriteria": [],   // string array (outcome only) — exact text from document
  "items": [],                 // string array (subtopic only) — exact bullet points
  "parentId": "string"         // topic/subtopic must reference their parent id
}

STRICT RULES:
1. Extract EVERY learning outcome sequentially (LO1, LO2, LO3...) exactly as numbered in the document.
2. For each outcome, extract ALL indicative content topics as type="topic".
3. For each topic, extract ALL sub-items/checkmarks as type="subtopic" with their bullet points in "items".
4. Use EXACT text from the document — do NOT paraphrase or summarise.
5. Learning hours must come from the document (e.g. "Learning hours: 30").
6. Performance criteria must be copied exactly from "Performance Criteria" sections.
7. Subtopic items must include ALL ✔ checkmarks and their nested bullet points.
8. Maintain the exact sequential order as it appears in the document.
9. IDs must be hierarchical: lo1 → lo1-t1 → lo1-t1-s1, lo1-t1-s2, etc.`;

  const userPrompt = `Module: "${trackName}" (${moduleCode})

CURRICULUM DOCUMENT:
${text}

Extract the complete, sequential, accurate TOC as a JSON array. Include every learning outcome, every topic, every subtopic, every performance criterion, and every bullet point exactly as written.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",  // 128K context, better for large documents
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,   // near-zero for faithful extraction
        max_tokens: 8000,  // large enough for full curriculum
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[toc-generate] Groq error:", response.status, err);
      return null;
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // Handle { toc: [...] }, { items: [...] }, { tableOfContents: [...] }, or plain array
    const arr: TOCItem[] = Array.isArray(parsed)
      ? parsed
      : (parsed.toc ?? parsed.items ?? parsed.tableOfContents ?? parsed.outcomes ?? []);

    if (!Array.isArray(arr) || arr.length === 0) return null;

    // Validate basic structure — must have at least one outcome with hours
    const hasOutcomes = arr.some(t => t.type === "outcome" && t.hours);
    if (!hasOutcomes) return null;

    return arr;
  } catch (e) {
    console.error("[toc-generate] Groq parse error:", e);
    return null;
  }
}

// ─── Priority 3: Minimal skeleton ────────────────────────────────────────────

function buildSkeletonTOC(trackName: string, nodeCount: number): TOCItem[] {
  const h = Math.round((nodeCount || 4) * 8);
  return [
    {
      id: "lo1", type: "outcome",
      title: `LO1: Introduce ${trackName}`,
      hours: h,
      performanceCriteria: [
        "Core concepts are properly understood",
        "Environment is correctly set up",
      ],
    },
    {
      id: "lo1-t1", type: "topic",
      title: "Foundation Concepts",
      parentId: "lo1",
    },
    {
      id: "lo1-t1-s1", type: "subtopic",
      title: "Overview & Environment Setup",
      parentId: "lo1-t1",
      items: ["Install required tools", "Configure environment", "Verify setup"],
    },
  ];
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: { trackId: string } },
) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const caller = await getCallerProfile(user.id);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await canManageTrack(caller, params.trackId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const track = await prisma.skillTrack.findUnique({
    where: { id: params.trackId },
    select: { name: true, _count: { select: { nodes: true } } },
  });
  if (!track) return NextResponse.json({ error: "Track not found" }, { status: 404 });

  const body = await req.json().catch(() => ({})) as {
    curriculumText?: string;
    moduleCode?: string;
  };
  const { curriculumText, moduleCode = "" } = body;

  let toc: TOCItem[] | null = null;
  let source = "skeleton";

  // ── Priority 1: Pattern-based parsing from PDF (most accurate for ALL modules) ──
  if (curriculumText?.trim()) {
    console.log(`[toc-generate] Trying pattern-based PDF parsing for "${track.name}"...`);
    const parsedTOC = parseRQFCurriculum(curriculumText, track.name);
    if (parsedTOC && parsedTOC.length > 0) {
      toc = parsedTOC;
      source = "parsed";
      console.log(`[toc-generate] ✅ Pattern parsing extracted ${parsedTOC.length} items`);
    } else {
      console.log("[toc-generate] Pattern parsing failed, trying Groq AI...");

      // ── Priority 2: AI (only if pattern parsing fails) ───────────────────────
      const aiTOC = await generateWithGroq(curriculumText, track.name, moduleCode);
      if (aiTOC && aiTOC.length > 0) {
        toc = aiTOC;
        source = "ai";
        console.log(`[toc-generate] Groq AI generated ${aiTOC.length} items`);
      } else {
        console.log("[toc-generate] Groq AI also failed, checking static fallback");
      }
    }
  }

  // ── Priority 3: Static built-in curriculum (fallback only) ─────────────────
  if (!toc) {
    const staticTOC = buildStaticTOC(track.name);
    if (staticTOC && staticTOC.length > 0) {
      toc = staticTOC;
      source = "static";
      console.log(`[toc-generate] Using static curriculum for "${track.name}" (${staticTOC.length} items)`);
    }
  }

  // ── Priority 4: Skeleton (last resort) ──────────────────────────────────────
  if (!toc) {
    toc = buildSkeletonTOC(track.name, track._count.nodes);
    source = "skeleton";
    console.log(`[toc-generate] Using skeleton TOC for "${track.name}"`);
  }

  // Save to DB with timeout protection
  console.log(`[toc-generate] Saving ${toc.length} items to database...`);
  try {
    await Promise.race([
      prisma.skillTrack.update({
        where: { id: params.trackId },
        data: { tableOfContents: JSON.stringify(toc) },  // Must be string, not object
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database save timeout')), 10000)
      )
    ]);
    console.log(`[toc-generate] Database save successful`);

    // 🔔 Notify all connected students immediately
    const { emitTrackChange } = await import('@/lib/trackEvents');
    emitTrackChange(params.trackId, 'toc_updated');
  } catch (err) {
    console.error(`[toc-generate] Database save failed:`, err);
    // Still return the TOC even if save fails - user can manually retry
  }

  return NextResponse.json({ toc, source });
}
