/**
 * Import Curriculum Modules to CurriculumModule table
 * Scans PDF files from "All Curriculums" directory and imports them
 * for offline access in the Curriculum page
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

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

interface ModuleData {
  code: string;
  name: string;
  department: string;
  level: string;
  category: string;
  pdfPath: string;
  pdfFileName: string;
  fileSize: number;
}

function extractModuleInfo(filename: string): { code: string; name: string } | null {
  // Remove "Updated-" prefix
  const cleanName = filename.replace(/^Updated-/i, "");

  // Remove "REVIEWED [date]_" prefix
  const cleanName2 = cleanName.replace(/^REVIEWED\s+[^_]+_\s*/i, "");

  // Pattern 1: CODE-NAME.pdf or CODE_NAME.pdf
  let match = cleanName2.match(/^([A-Z]{3,8}\d{3})[_\s-]+(.+)\.pdf$/i);
  if (match) {
    return {
      code: match[1].toUpperCase().trim(),
      name: match[2].trim().replace(/UPDATE-?/gi, "").replace(/@\d+/g, "").replace(/\s+/g, " ").trim(),
    };
  }

  // Pattern 2: CODE with spaces - "CCMEN 402  - ENGLISH.pdf"
  match = cleanName2.match(/^([A-Z]{3,6}[A-Z]{2})\s+(\d{3})\s*[_\s-]+(.+)\.pdf$/i);
  if (match) {
    return {
      code: (match[1] + match[2]).toUpperCase().trim(),
      name: match[3].trim().replace(/UPDATE-?/gi, "").replace(/@\d+/g, "").replace(/\s+/g, " ").trim(),
    };
  }

  // Pattern 3: Fix typo codes like "CMCZ401" → "CCMCZ401"
  match = cleanName2.match(/^(CM)([A-Z]{2}\d{3})[_\s-]+(.+)\.pdf$/i);
  if (match) {
    console.warn(`⚠️  Fixing typo: ${match[1]}${match[2]} → CCM${match[2].substring(0, 2)}${match[2].substring(2)}`);
    return {
      code: "CCM" + match[2].substring(0, 2) + match[2].substring(2),
      name: match[3].trim().replace(/UPDATE-?/gi, "").replace(/@\d+/g, "").replace(/\s+/g, " ").trim(),
    };
  }

  return null;
}

function getLevelFromCode(code: string): string | null {
  const match = code.match(/(\d)(\d{2})$/);
  if (match) {
    const levelNum = match[1];
    return LEVEL_MAPPING[levelNum] || null;
  }
  return null;
}

function getCategoryFromFolder(folderName: string, code: string): string {
  const folderLower = folderName.toLowerCase();
  const prefix = code.substring(0, 3).toUpperCase();

  // CCM modules
  if (prefix === "CCM" || folderLower.includes("ccm") || folderLower.includes("complementary")) {
    return "ccm";
  }

  // General modules
  if (prefix === "GEN" || folderLower.includes("general")) {
    return "general";
  }

  // Core/Specific modules
  if (folderLower.includes("specific") || folderLower.includes("core")) {
    return "core";
  }

  // Department-specific codes
  if (["BDC", "CSA", "LSV", "SWD"].includes(prefix)) {
    return "core";
  }

  return "general";
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

function scanDepartmentCurriculum(deptName: string, deptKey: string): ModuleData[] {
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
        return fs.statSync(fullPath).isDirectory() && /LEVEL\s*\d/i.test(item);
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
        if (/curriculum.structure|introductory.part|general.information/i.test(filename)) {
          continue;
        }

        const moduleInfo = extractModuleInfo(filename);
        if (!moduleInfo) {
          console.warn(`⚠️  Could not parse module: ${filename}`);
          continue;
        }

        const detectedLevel = getLevelFromCode(moduleInfo.code);
        const category = getCategoryFromFolder(folderName, moduleInfo.code);

        // Generate relative path from public/ directory
        const relativePath = pdfFile.replace(process.cwd(), "").replace(/^\//, "");

        const stats = fs.statSync(pdfFile);

        modules.push({
          code: moduleInfo.code,
          name: moduleInfo.name,
          department: deptKey,
          level: detectedLevel || level,
          category,
          pdfPath: "/" + relativePath,
          pdfFileName: filename,
          fileSize: stats.size,
        });
      }
    }
  } catch (error) {
    console.error(`Error scanning department ${deptName}:`, error);
  }

  return modules;
}

async function importModule(moduleData: ModuleData): Promise<boolean> {
  try {
    // Check if module already exists
    const existing = await prisma.curriculumModule.findUnique({
      where: { code: moduleData.code },
    });

    if (existing) {
      // Update existing
      await prisma.curriculumModule.update({
        where: { code: moduleData.code },
        data: {
          name: moduleData.name,
          department: moduleData.department,
          level: moduleData.level,
          category: moduleData.category,
          pdfPath: moduleData.pdfPath,
          pdfFileName: moduleData.pdfFileName,
          fileSize: moduleData.fileSize,
        },
      });
      console.log(`   ✅ Updated: ${moduleData.code} - ${moduleData.name}`);
    } else {
      // Create new
      await prisma.curriculumModule.create({
        data: {
          code: moduleData.code,
          name: moduleData.name,
          department: moduleData.department,
          level: moduleData.level,
          category: moduleData.category,
          pdfPath: moduleData.pdfPath,
          pdfFileName: moduleData.pdfFileName,
          fileSize: moduleData.fileSize,
          isActive: true,
        },
      });
      console.log(`   ✅ Imported: ${moduleData.code} - ${moduleData.name}`);
    }

    return true;
  } catch (error) {
    console.error(`   ❌ Error importing ${moduleData.code}:`, error instanceof Error ? error.message : error);
    return false;
  }
}

async function main() {
  console.log("\n📚 Curriculum Module Import Tool\n");
  console.log("─".repeat(80) + "\n");

  const stats = {
    total: 0,
    imported: 0,
    errors: 0,
  };

  for (const [deptName, deptKey] of Object.entries(DEPARTMENTS)) {
    console.log(`\n🏢 ${deptName} (${deptKey})`);
    const modules = scanDepartmentCurriculum(deptName, deptKey);
    stats.total += modules.length;

    console.log(`   Found ${modules.length} modules\n`);

    for (const module of modules) {
      const success = await importModule(module);
      if (success) {
        stats.imported++;
      } else {
        stats.errors++;
      }
    }
  }

  console.log("\n" + "─".repeat(80));
  console.log("\n✨ Import Complete!\n");
  console.log(`   Total modules: ${stats.total}`);
  console.log(`   ✅ Imported: ${stats.imported}`);
  console.log(`   ❌ Errors: ${stats.errors}`);
  console.log("\n");
}

main()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
