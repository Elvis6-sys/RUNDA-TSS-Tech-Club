/**
 * Regenerate Table of Contents for all tracks with curriculum PDFs
 * 
 * This script:
 * 1. Finds all tracks that have curriculumUrl (PDF uploaded)
 * 2. Extracts text from each PDF
 * 3. Regenerates TOC using the improved parseRQFCurriculum
 * 4. Saves updated TOC back to database
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";
import { parseRQFCurriculum, type TOCItem } from "../lib/parseRQFCurriculum";

const prisma = new PrismaClient();

// Extract text from PDF using pdf-parse
async function extractPDFText(pdfPath: string): Promise<string> {
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const dataBuffer = await fs.readFile(pdfPath);
    const data = await pdfParse(dataBuffer);
    return data.text || "";
  } catch (error) {
    console.error(`❌ Failed to extract PDF: ${error}`);
    return "";
  }
}

// Find PDF file path from URL
function getPDFPath(curriculumUrl: string): string {
  // curriculumUrl format: /All Curriculums/DEPARTMENT/LEVEL/MODULE.pdf
  // Maps to /All Curriculums/... (root folder, not in public)
  if (curriculumUrl.startsWith("/All Curriculums")) {
    return path.join(process.cwd(), curriculumUrl);
  }
  // Legacy format: /uploads/resources/filename.pdf
  const filename = curriculumUrl.split("/").pop() || "";
  return path.join(process.cwd(), "public", "uploads", "resources", filename);
}

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
      tableOfContents: true,
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

    if (!track.curriculumUrl) {
      console.log("⚠️  No curriculum URL, skipping");
      continue;
    }

    try {
      // Extract PDF text
      const pdfPath = getPDFPath(track.curriculumUrl);
      console.log(`📄 PDF path: ${pdfPath}`);

      const pdfText = await extractPDFText(pdfPath);

      if (!pdfText) {
        console.log("❌ Failed to extract PDF text");
        failCount++;
        results.push({ name: track.name, status: "FAILED: No text extracted", items: 0 });
        continue;
      }

      console.log(`✅ Extracted ${pdfText.length} characters from PDF`);

      // Parse with enhanced parser
      const toc = parseRQFCurriculum(pdfText, track.name);

      if (!toc || toc.length === 0) {
        console.log("❌ Parser returned empty TOC");
        failCount++;
        results.push({ name: track.name, status: "FAILED: Empty TOC", items: 0 });
        continue;
      }

      // Count structure
      const outcomes = toc.filter((t) => t.type === "outcome");
      const topics = toc.filter((t) => t.type === "topic");
      const subtopics = toc.filter((t) => t.type === "subtopic");
      const totalItems = subtopics.reduce((sum, sub) => sum + (sub.items?.length || 0), 0);

      console.log(`\n📊 Generated TOC:`);
      console.log(`   • Learning Outcomes: ${outcomes.length}`);
      console.log(`   • Topics: ${topics.length}`);
      console.log(`   • Subtopics: ${subtopics.length}`);
      console.log(`   • Items (4th level): ${totalItems}`);
      console.log(`   • Total nodes: ${toc.length}`);

      // Save to database
      await prisma.skillTrack.update({
        where: { id: track.id },
        data: {
          tableOfContents: JSON.stringify(toc),
        },
      });

      console.log(`✅ TOC saved to database`);
      successCount++;
      results.push({
        name: track.name,
        status: "SUCCESS",
        items: toc.length,
      });

    } catch (error: any) {
      console.error(`❌ Error processing ${track.name}:`, error.message);
      failCount++;
      results.push({ name: track.name, status: `ERROR: ${error.message}`, items: 0 });
    }
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
  console.log(`${"Module Name".padEnd(50)} ${"Status".padEnd(25)} ${"Items"}`);
  console.log(`${"-".repeat(80)}`);

  for (const result of results) {
    const truncatedName = result.name.length > 48 ? result.name.substring(0, 45) + "..." : result.name;
    console.log(
      `${truncatedName.padEnd(50)} ${result.status.padEnd(25)} ${result.items}`
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
