/**
 * Regenerate Table of Contents for all tracks with curriculum PDFs
 * Uses the existing API endpoints (extract-pdf + toc-generate)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function regenerateAllTOC() {
  console.log("🔄 Starting TOC regeneration for all modules...\n");

  // Get all tracks with curriculum URLs
  const tracks = await prisma.skillTrack.findMany({
    where: {
      curriculumUrl: {
        not: null,
      },
    },
    select: {
      id: true,
      name: true,
      curriculumUrl: true,
    },
  });

  console.log(`📚 Found ${tracks.length} tracks with curriculum PDFs\n`);

  let successCount = 0;
  let failCount = 0;
  const results: Array<{ name: string; status: string; items: number }> = [];

  for (const track of tracks) {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`📖 Processing: ${track.name}`);
    console.log(`${"=".repeat(70)}`);

    try {
      // Step 1: Extract PDF text
      console.log(`📄 Extracting PDF text...`);
      const extractRes = await fetch(`http://localhost:3001/api/passport/tracks/${track.id}/extract-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!extractRes.ok) {
        throw new Error(`PDF extraction failed: ${extractRes.status}`);
      }

      const extractData = await extractRes.json();
      console.log(`✅ Extracted ${extractData.characterCount} characters from ${extractData.extractedPages} pages`);

      // Step 2: Generate TOC
      console.log(`🔄 Generating TOC...`);
      const tocRes = await fetch(`http://localhost:3001/api/passport/tracks/${track.id}/toc-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          curriculumText: extractData.text,
          moduleCode: extractData.moduleCode,
        }),
      });

      if (!tocRes.ok) {
        throw new Error(`TOC generation failed: ${tocRes.status}`);
      }

      const { toc, source } = await tocRes.json();

      if (!toc || toc.length === 0) {
        throw new Error("Empty TOC returned");
      }

      // Count structure
      const outcomes = toc.filter((t: any) => t.type === "outcome");
      const topics = toc.filter((t: any) => t.type === "topic");
      const subtopics = toc.filter((t: any) => t.type === "subtopic");
      const totalItems = subtopics.reduce((sum: number, sub: any) => sum + (sub.items?.length || 0), 0);

      console.log(`\n📊 Generated TOC (source: ${source}):`);
      console.log(`   • Learning Outcomes: ${outcomes.length}`);
      console.log(`   • Topics: ${topics.length}`);
      console.log(`   • Subtopics: ${subtopics.length}`);
      console.log(`   • Items (4th level): ${totalItems}`);
      console.log(`   • Total nodes: ${toc.length}`);

      console.log(`✅ TOC saved to database`);
      successCount++;
      results.push({
        name: track.name,
        status: `SUCCESS (${source})`,
        items: toc.length,
      });

    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
      failCount++;
      results.push({ name: track.name, status: `ERROR: ${error.message}`, items: 0 });
    }

    // Small delay to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Final summary
  console.log(`\n${"=".repeat(70)}`);
  console.log(`📊 FINAL SUMMARY`);
  console.log(`${"=".repeat(70)}`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📚 Total: ${tracks.length}\n`);

  // Detailed results table
  console.log(`\n📋 Detailed Results:\n`);
  console.log(`${"Module Name".padEnd(50)} ${"Status".padEnd(30)} ${"Items"}`);
  console.log(`${"-".repeat(85)}`);

  for (const result of results) {
    const truncatedName = result.name.length > 48 ? result.name.substring(0, 45) + "..." : result.name;
    console.log(
      `${truncatedName.padEnd(50)} ${result.status.padEnd(30)} ${result.items}`
    );
  }

  await prisma.$disconnect();
}

// Run the script
regenerateAllTOC()
  .then(() => {
    console.log("\n✅ TOC regeneration complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
