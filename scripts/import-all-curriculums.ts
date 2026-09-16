/**
 * Bulk Import Script for All Department Curriculums
 * Imports modules from all 4 departments (Building Construction, Computer Systems Architecture, Land Surveying, Software Development)
 * across all 3 levels (L3, L4, L5) into the database
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
// @ts-ignore - pdf-parse doesn't have proper types
import pdfParse from "pdf-parse";

const prisma = new PrismaClient();

// ─── Configuration ────────────────────────────────────────────────────────────

const BASE_DIR = path.join(process.cwd(), "All Curriculums");

const DEPARTMENTS = {
  "BUILDING CONSTRUCTION": "building-construction",
  "COMPUTER SYSTEM AND ARCHITECTURE": "computer-systems-architecture",
  "LAND SURVEYING": "land-surveying",
  "SOFTWARE DEVELOPMENT": "software-development",
} as const;

const LEVEL_MAPPING: Record<string, string> = {
  "3": "l3",
  "4": "l4",
  "5": "l5",
};

// Module code to department mapping (for auto-detection)
const MODULE_PREFIX_TO_DEPT: Record<string, string> = {
  BDC: "building-construction",
  CSA: "computer-systems-architecture",
  LSV: "land-surveying",
  SWD: "software-development",
  GEN: "general", // Shared across departments
  CCM: "common", // Common modules (languages, entrepreneurship)
  ICT: "ict-common",
};

// ─── Utility Functions ────────────────────────────────────────────────────────

function getDepartmentFromModuleCode(code: string): string | null {
  const prefix = code.substring(0, 3).toUpperCase();
  return MODULE_PREFIX_TO_DEPT[prefix] || null;
}

function getLevelFromModuleCode(code: string): string | null {
  const match = code.match(/(\d)(\d{2})$/);
  if (match) {
    const levelNum = match[1];
    return LEVEL_MAPPING[levelNum] || null;
  }
  return null;
}

function extractModuleInfo(filename: string): {
  code: string;
  name: string;
} | null {
  // Remove "Updated-" prefix if present
  const cleanName = filename.replace(/^Updated-/i, '');

  // Remove "REVIEWED [date]_" prefix if present
  const cleanName2 = cleanName.replace(/^REVIEWED\s+[^_]+_\s*/i, '');

  // Pattern 1: CODE-NAME.pdf or CODE_NAME.pdf or CODE NAME.pdf (standard format)
  // Expanded to handle codes like LSVBA302 (3 letters + 2 letters + 3 digits)
  let match = cleanName2.match(/^([A-Z]{3,8}\d{3})[_\s-]+(.+)\.pdf$/i);
  if (match) {
    return {
      code: match[1].toUpperCase().trim(),
      name: match[2]
        .trim()
        .replace(/UPDATE-?/gi, "")
        .replace(/@\d+/g, "") // Remove @2023 suffix
        .replace(/\s+/g, " ")
        .replace(/_/g, " ")
        .trim(),
    };
  }

  // Pattern 2: CODE with spaces - "CCMEN 402  - ENGLISH.pdf"
  match = cleanName2.match(/^([A-Z]{3,6}[A-Z]{2})\s+(\d{3})\s*[_\s-]+(.+)\.pdf$/i);
  if (match) {
    return {
      code: (match[1] + match[2]).toUpperCase().trim(),
      name: match[3]
        .trim()
        .replace(/UPDATE-?/gi, "")
        .replace(/@\d+/g, "") // Remove @2023 suffix
        .replace(/\s+/g, " ")
        .replace(/_/g, " ")
        .trim(),
    };
  }

  // Pattern 2a: Typo codes like "CMCZ401" (missing first C, should be CCMCZ401)
  match = cleanName2.match(/^(CM)([A-Z]{2}\d{3})[_\s-]+(.+)\.pdf$/i);
  if (match) {
    console.warn(`⚠️  Fixing typo: ${match[1]}${match[2]} → CCM${match[2].substring(0, 2)}${match[2].substring(2)}`);
    return {
      code: 'CCM' + match[2].substring(0, 2) + match[2].substring(2),
      name: match[3]
        .trim()
        .replace(/UPDATE-?/gi, "")
        .replace(/@\d+/g, "")
        .replace(/\s+/g, " ")
        .replace(/_/g, " ")
        .trim(),
    };
  }

  // Pattern 2b: Code with underscores - "CCMPE_502 _Apply..."
  match = cleanName2.match(/^([A-Z]{3,6}[A-Z]{2})_(\d{3})\s*[_\s-]+(.+)\.pdf$/i);
  if (match) {
    return {
      code: (match[1] + match[2]).toUpperCase().trim(),
      name: match[3]
        .trim()
        .replace(/UPDATE-?/gi, "")
        .replace(/@\d+/g, "")
        .replace(/\s+/g, " ")
        .replace(/_/g, " ")
        .trim(),
    };
  }

  // Pattern 2c: Complex codes like "TRLAUT5001-TOG for..."
  match = cleanName2.match(/^([A-Z]{3,8}\d{4})[_\s-]+(.+)\.pdf$/i);
  if (match) {
    console.warn(`⚠️  Unusual code format: ${match[1]}`);
    return {
      code: match[1].toUpperCase().trim(),
      name: match[2]
        .trim()
        .replace(/UPDATE-?/gi, "")
        .replace(/@\d+/g, "")
        .replace(/\s+/g, " ")
        .replace(/_/g, " ")
        .trim(),
    };
  }

  // Pattern 3: No code - just module name like "Web Development.pdf"
  // Generate code from name (e.g., "Web Development" -> "WBDEV300")
  match = cleanName2.match(/^([A-Za-z\s]+)\.pdf$/i);
  if (match) {
    const name = match[1].trim();
    // Create a code from first letters of words + level
    const words = name.split(/\s+/).filter(w => w.length > 0);
    let codePrefix = words
      .map(w => w[0].toUpperCase())
      .join('')
      .slice(0, 5);

    // Pad to 5 chars if needed
    while (codePrefix.length < 5) {
      codePrefix += 'X';
    }

    // Add default level (300 for L3 modules without codes)
    const generatedCode = codePrefix + '301';

    console.warn(`⚠️  Generated code ${generatedCode} for: ${filename}`);

    return {
      code: generatedCode,
      name: name,
    };
  }

  return null;
}

function categorizeModuleType(code: string, folderName: string): string {
  const prefix = code.substring(0, 3).toUpperCase();

  // Common/Complementary modules
  if (prefix === "CCM") return "complementary";
  if (prefix === "ICT" && code.includes("IA")) return "industrial-attachment";

  // By folder name
  const folderLower = folderName.toLowerCase();
  if (
    folderLower.includes("complementary") ||
    folderLower.includes("ccm")
  ) {
    return "complementary";
  }
  if (folderLower.includes("general")) return "general";
  if (
    folderLower.includes("specific") ||
    folderLower.includes("core")
  ) {
    return "core-technical";
  }

  // By module code
  if (prefix === "GEN") return "general";

  // Department-specific technical modules
  if (["BDC", "CSA", "LSV", "SWD"].includes(prefix)) {
    return "core-technical";
  }

  return "general";
}

async function extractPdfContent(pdfPath: string): Promise<{
  text: string;
  pages: number;
}> {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    // @ts-ignore
    const data = await pdfParse(dataBuffer);
    return {
      text: data.text,
      pages: data.numpages,
    };
  } catch (error) {
    console.error(`Error parsing PDF ${pdfPath}:`, error);
    return { text: "", pages: 0 };
  }
}

function extractLearningOutcomes(text: string): string[] {
  const outcomes: string[] = [];

  // Common patterns in RTB/TVET curriculum
  const patterns = [
    /(?:learning outcomes?|outcomes?|competenc(?:y|ies)|objectives?)[:\s]*\n((?:[\s\S](?!module|unit|assessment))+)/gi,
    /(?:by the end of this module|upon completion)[,\s]+(?:the )?(?:student|learner|trainee)[s]?\s+(?:will|should|shall)[:\s]+((?:[\s\S](?!module|unit))+)/gi,
    /(?:^|\n)\s*(?:\d+[.)]\s*|[•\-*]\s*)((?:understand|explain|demonstrate|apply|analyze|design|develop|implement|perform|construct|install|maintain|repair|assess)\s+[^\n]+)/gim,
  ];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const block = match[1] || match[0];
      // Split by newlines or bullet points
      const lines = block
        .split(/\n|(?=[•\-*])|(?=\d+[.)])/)
        .map((line) =>
          line
            .trim()
            .replace(/^[\d.)•\-*\s]+/, "")
            .trim()
        )
        .filter((line) => line.length > 20 && line.length < 500);

      outcomes.push(...lines);
    }
  }

  // Remove duplicates and limit
  return [...new Set(outcomes)].slice(0, 10);
}

// ─── Scan Functions ───────────────────────────────────────────────────────────

interface ModuleData {
  code: string;
  name: string;
  department: string;
  level: string;
  moduleType: string;
  pdfPath: string;
  folderName: string;
}

function scanDepartmentCurriculum(
  deptName: string,
  deptKey: string
): ModuleData[] {
  const modules: ModuleData[] = [];
  const deptPath = path.join(BASE_DIR, deptName);

  if (!fs.existsSync(deptPath)) {
    console.warn(`⚠️  Department path not found: ${deptPath}`);
    return modules;
  }

  try {
    const levelFolders = fs
      .readdirSync(deptPath)
      .filter((item) => {
        const fullPath = path.join(deptPath, item);
        return (
          fs.statSync(fullPath).isDirectory() &&
          /LEVEL\s*\d/i.test(item)
        );
      });

    for (const levelFolder of levelFolders) {
      const levelMatch = levelFolder.match(/LEVEL\s*(\d)/i);
      if (!levelMatch) continue;

      const levelNum = levelMatch[1];
      const level = LEVEL_MAPPING[levelNum];
      if (!level) continue;

      const levelPath = path.join(deptPath, levelFolder);
      const pdfFiles = findPdfFiles(levelPath);

      for (const pdfFile of pdfFiles) {
        const filename = path.basename(pdfFile);
        const folderName = path.basename(path.dirname(pdfFile));

        // Skip curriculum structure files
        if (
          /curriculum.structure|introductory.part|general.information/i.test(
            filename
          )
        ) {
          continue;
        }

        const moduleInfo = extractModuleInfo(filename);
        if (!moduleInfo) {
          console.warn(`⚠️  Could not parse module: ${filename}`);
          continue;
        }

        const detectedLevel = getLevelFromModuleCode(moduleInfo.code);

        // IMPORTANT: Always use the folder's department, even for CCM/GEN modules
        // Each department has its own version of common modules (different content/context)
        const finalDept = deptKey;

        modules.push({
          code: moduleInfo.code,
          name: moduleInfo.name,
          department: finalDept,
          level: detectedLevel || level,
          moduleType: categorizeModuleType(moduleInfo.code, folderName),
          pdfPath: pdfFile,
          folderName,
        });
      }
    }
  } catch (error) {
    console.error(`Error scanning department ${deptName}:`, error);
  }

  return modules;
}

function findPdfFiles(dir: string): string[] {
  const results: string[] = [];

  function scan(directory: string) {
    try {
      const items = fs.readdirSync(directory);
      for (const item of items) {
        const fullPath = path.join(directory, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scan(fullPath);
        } else if (item.toLowerCase().endsWith(".pdf")) {
          results.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${directory}:`, error);
    }
  }

  scan(dir);
  return results;
}

// ─── Database Import ──────────────────────────────────────────────────────────

async function importModule(
  moduleData: ModuleData,
  options: { skipExisting: boolean; extractContent: boolean }
): Promise<boolean> {
  try {
    // Use module code + department as unique identifier
    // This ensures each department gets its own copy of CCM/GEN modules
    const slug = moduleData.code.toLowerCase();

    if (options.skipExisting) {
      const existing = await prisma.skillTrack.findFirst({
        where: {
          moduleSlug: slug,
          department: moduleData.department,
        },
      });
      if (existing) {
        console.log(`   ⏭️  Skipping: ${moduleData.code} (${moduleData.department})`);
        return false;
      }
    }

    // Extract PDF content if requested
    let description = "";
    let tableOfContents: any[] = [];

    if (options.extractContent) {
      const pdfContent = await extractPdfContent(moduleData.pdfPath);
      if (pdfContent.text) {
        // Extract first paragraph as description
        const paragraphs = pdfContent.text
          .split(/\n\n+/)
          .map((p) => p.trim())
          .filter((p) => p.length > 50 && p.length < 1000);
        description = paragraphs[0] || "";

        // Extract learning outcomes as TOC
        const learningOutcomes = extractLearningOutcomes(pdfContent.text);
        tableOfContents = learningOutcomes.map((outcome, idx) => ({
          id: `lo-${idx + 1}`,
          title: outcome,
          type: "learning-outcome",
          order: idx + 1,
        }));
      }
    }

    // Map level to tier
    const tierMapping: Record<string, string> = {
      l3: "l3",
      l4: "l4",
      l5: "l5",
    };

    // Create SkillTrack in database (one per department, even for shared modules)
    const existing = await prisma.skillTrack.findFirst({
      where: {
        moduleSlug: slug,
        department: moduleData.department,
      },
    });

    if (existing) {
      // Update existing
      await prisma.skillTrack.update({
        where: { id: existing.id },
        data: {
          name: moduleData.name,
          description: description || `${moduleData.name} - ${moduleData.code}`,
          department: moduleData.department,
          tier: tierMapping[moduleData.level] || "all",
          curriculumType: "rtb-tvet",
          curriculumUrl: moduleData.pdfPath,
          moduleSlug: slug,
          tableOfContents: tableOfContents.length > 0 ? tableOfContents : [],
        },
      });
    } else {
      // Create new (ALWAYS create, even if same code exists for different department)
      await prisma.skillTrack.create({
        data: {
          name: moduleData.name,
          description: description || `${moduleData.name} - ${moduleData.code}`,
          department: moduleData.department,
          tier: tierMapping[moduleData.level] || "all",
          curriculumType: "rtb-tvet",
          curriculumUrl: moduleData.pdfPath,
          moduleSlug: slug,
          tableOfContents: tableOfContents.length > 0 ? tableOfContents : [],
          order: parseInt(moduleData.code.slice(-2)) || 0,
        },
      });
    }

    console.log(`   ✅ ${moduleData.code} [${moduleData.department}]`);
    return true;
  } catch (error) {
    console.error(
      `   ❌ Error importing ${moduleData.code}:`,
      error instanceof Error ? error.message : error
    );
    return false;
  }
}

// ─── Main Script ──────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "import";

  const options = {
    skipExisting: args.includes("--skip-existing"),
    extractContent: args.includes("--extract-content"),
    dryRun: args.includes("--dry-run"),
    department: args.find((arg) => arg.startsWith("--dept="))?.split("=")[1],
  };

  console.log("\n🎓 RTB/TVET Curriculum Bulk Import Tool\n");
  console.log("Options:", {
    command,
    skipExisting: options.skipExisting,
    extractContent: options.extractContent,
    dryRun: options.dryRun,
    department: options.department || "ALL",
  });
  console.log("\n" + "─".repeat(80) + "\n");

  if (command === "scan") {
    // Scan and display statistics
    console.log("📊 Scanning all curriculums...\n");

    const stats: Record<
      string,
      { total: number; byLevel: Record<string, number> }
    > = {};

    for (const [deptName, deptKey] of Object.entries(DEPARTMENTS)) {
      if (options.department && options.department !== deptKey) continue;

      console.log(`\n📁 ${deptName} (${deptKey})`);
      const modules = scanDepartmentCurriculum(deptName, deptKey);

      stats[deptKey] = {
        total: modules.length,
        byLevel: {},
      };

      for (const module of modules) {
        stats[deptKey].byLevel[module.level] =
          (stats[deptKey].byLevel[module.level] || 0) + 1;
      }

      console.log(`   Total modules: ${modules.length}`);
      console.log(
        `   By level: ${Object.entries(stats[deptKey].byLevel)
          .map(([lvl, count]) => `${lvl.toUpperCase()}=${count}`)
          .join(", ")}`
      );
    }

    console.log("\n" + "─".repeat(80));
    console.log("\n📈 Summary:");
    const grandTotal = Object.values(stats).reduce(
      (sum, s) => sum + s.total,
      0
    );
    console.log(`   Total modules to import: ${grandTotal}`);
    console.log("\n");
    return;
  }

  if (command === "import") {
    // Import all modules
    console.log("📥 Importing all curriculums...\n");

    const results = {
      total: 0,
      imported: 0,
      skipped: 0,
      errors: 0,
    };

    for (const [deptName, deptKey] of Object.entries(DEPARTMENTS)) {
      if (options.department && options.department !== deptKey) continue;

      console.log(`\n🏢 ${deptName} (${deptKey})`);
      const modules = scanDepartmentCurriculum(deptName, deptKey);
      results.total += modules.length;

      console.log(`   Found ${modules.length} modules\n`);

      for (const module of modules) {
        if (options.dryRun) {
          console.log(
            `   [DRY RUN] Would import: ${module.code} - ${module.name}`
          );
          results.imported++;
        } else {
          const success = await importModule(module, options);
          if (success) {
            results.imported++;
          } else {
            results.skipped++;
          }
        }
      }
    }

    console.log("\n" + "─".repeat(80));
    console.log("\n✨ Import Complete!\n");
    console.log(`   Total modules: ${results.total}`);
    console.log(`   ✅ Imported: ${results.imported}`);
    console.log(`   ⏭️  Skipped: ${results.skipped}`);
    console.log(`   ❌ Errors: ${results.errors}`);
    console.log("\n");
    return;
  }

  console.error(`❌ Unknown command: ${command}`);
  console.log("\nUsage:");
  console.log("  npm run import-curriculums scan              # Scan and show stats");
  console.log("  npm run import-curriculums import            # Import all modules");
  console.log("  npm run import-curriculums import --skip-existing");
  console.log("  npm run import-curriculums import --extract-content");
  console.log("  npm run import-curriculums import --dept=building-construction");
  console.log("  npm run import-curriculums import --dry-run");
}

main()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
