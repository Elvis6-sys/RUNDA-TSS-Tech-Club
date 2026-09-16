/**
 * Offline Curriculum Import Script
 * 
 * This script:
 * 1. Scans All Curriculums folder
 * 2. Copies PDFs to public/curriculums/ (for offline access)
 * 3. Imports module metadata to SQLite database
 * 4. Organizes by Department, Level, and Category
 * 
 * Usage: npx ts-node scripts/import-curriculum-offline.ts
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// ═══ Configuration ═══════════════════════════════════════════════════════════
const BASE_DIR = path.join(process.cwd(), "All Curriculums");
const PUBLIC_DIR = path.join(process.cwd(), "public", "curriculums");

const DEPARTMENTS: Record<string, string> = {
  "BUILDING CONSTRUCTION": "building-construction",
  "COMPUTER SYSTEM AND ARCHITECTURE": "computer-systems-architecture",
  "LAND SURVEYING": "land-surveying",
  "SOFTWARE DEVELOPMENT": "software-development",
};

const LEVELS: Record<string, string> = {
  "3": "l3",
  "4": "l4",
  "5": "l5",
};

const CATEGORIES: Record<string, string> = {
  "General modules": "general",
  "General Modules": "general",
  "Specific Modules": "core",
  "Core Modules": "core",
  "CCM": "ccm",
  "CCM Modules-1": "ccm",
};

// ═══ Utility Functions ═══════════════════════════════════════════════════════

function extractModuleCode(filename: string): string | null {
  // Clean filename
  const clean = filename.replace(/^Updated-/i, "").replace(/^REVIEWED\s+[^_]+_\s*/i, "");
  
  // Pattern: CODE-NAME.pdf or CODE NAME.pdf
  let match = clean.match(/^([A-Z]{3,8}\d{3})[_\s-]+(.+)\.pdf$/i);
  if (match) return match[1].toUpperCase();
  
  // Pattern: CCMEN 402 - NAME.pdf
  match = clean.match(/^([A-Z]{3,6})\s+(\d{3})\s*[_\s-]+(.+)\.pdf$/i);
  if (match) return (match[1] + match[2]).toUpperCase();
  
  return null;
}

function extractModuleName(filename: string): string {
  const clean = filename
    .replace(/^Updated-/i, "")
    .replace(/^REVIEWED\s+[^_]+_\s*/i, "")
    .replace(/\.pdf$/i, "");
  
  // Remove code prefix
  const match = clean.match(/^[A-Z]{3,8}\d{3}[_\s-]+(.+)$/i);
  if (match) {
    return match[1]
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  
  return clean.replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

function getLevelFromFolderPath(folderPath: string): string | null {
  const match = folderPath.match(/LEVEL\s+(\d)/i) || folderPath.match(/Level\s+(\d)/i);
  if (match) {
    return LEVELS[match[1]] || null;
  }
  return null;
}

function ensureDirectoryExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
}

// ═══ Main Import Function ════════════════════════════════════════════════════

async function importCurriculum() {
  console.log("🚀 Starting Offline Curriculum Import...\n");
  
  // Ensure public/curriculums directory exists
  ensureDirectoryExists(PUBLIC_DIR);
  
  let totalModules = 0;
  let totalCopied = 0;
  
  // Loop through each department
  for (const [deptFolder, deptSlug] of Object.entries(DEPARTMENTS)) {
    const deptPath = path.join(BASE_DIR, deptFolder);
    
    if (!fs.existsSync(deptPath)) {
      console.log(`⚠️  Skipping ${deptFolder} - folder not found`);
      continue;
    }
    
    console.log(`\n📚 Processing: ${deptFolder}`);
    console.log(`   Slug: ${deptSlug}`);
    
    // Create department folder in public
    const deptPublicDir = path.join(PUBLIC_DIR, deptSlug);
    ensureDirectoryExists(deptPublicDir);
    
    // Get all level folders
    const levelFolders = fs.readdirSync(deptPath).filter(f => {
      const fullPath = path.join(deptPath, f);
      return fs.statSync(fullPath).isDirectory();
    });
    
    for (const levelFolder of levelFolders) {
      const level = getLevelFromFolderPath(levelFolder);
      if (!level) continue;
      
      console.log(`\n   📖 Level: ${level.toUpperCase()}`);
      const levelPath = path.join(deptPath, levelFolder);
      
      // Create level folder in public
      const levelPublicDir = path.join(deptPublicDir, level);
      ensureDirectoryExists(levelPublicDir);
      
      // Get category folders (General, Core, CCM)
      const categoryFolders = fs.readdirSync(levelPath).filter(f => {
        const fullPath = path.join(levelPath, f);
        return fs.statSync(fullPath).isDirectory();
      });
      
      for (const categoryFolder of categoryFolders) {
        const category = CATEGORIES[categoryFolder];
        if (!category) continue;
        
        console.log(`      📂 Category: ${categoryFolder} → ${category}`);
        const categoryPath = path.join(levelPath, categoryFolder);
        
        // Create category folder in public
        const categoryPublicDir = path.join(levelPublicDir, category);
        ensureDirectoryExists(categoryPublicDir);
        
        // Get all PDF files
        const pdfFiles = fs.readdirSync(categoryPath).filter(f => f.endsWith(".pdf"));
        
        for (const pdfFile of pdfFiles) {
          const sourcePath = path.join(categoryPath, pdfFile);
          const code = extractModuleCode(pdfFile);
          
          if (!code) {
            console.log(`         ⚠️  Skipped: ${pdfFile} (couldn't extract code)`);
            continue;
          }
          
          const name = extractModuleName(pdfFile);
          const destPath = path.join(categoryPublicDir, pdfFile);
          const relativePath = path.relative(PUBLIC_DIR, destPath);
          const publicPath = `/curriculums/${relativePath.replace(/\\/g, "/")}`;
          
          // Copy PDF file
          try {
            fs.copyFileSync(sourcePath, destPath);
            totalCopied++;
          } catch (error) {
            console.log(`         ❌ Failed to copy: ${pdfFile}`);
            continue;
          }
          
          // Get file size
          const stats = fs.statSync(destPath);
          const fileSize = stats.size;
          
          // Insert/update in database
          try {
            await prisma.curriculumModule.upsert({
              where: { code },
              create: {
                code,
                name,
                department: deptSlug,
                level,
                category,
                pdfPath: publicPath,
                pdfFileName: pdfFile,
                fileSize,
                isActive: true,
              },
              update: {
                name,
                department: deptSlug,
                level,
                category,
                pdfPath: publicPath,
                pdfFileName: pdfFile,
                fileSize,
              },
            });
            
            totalModules++;
            console.log(`         ✅ ${code} - ${name}`);
          } catch (error) {
            console.log(`         ❌ DB Error: ${code} - ${(error as Error).message}`);
          }
        }
      }
    }
  }
  
  console.log("\n" + "═".repeat(70));
  console.log(`\n🎉 Import Complete!`);
  console.log(`   📁 PDFs copied: ${totalCopied}`);
  console.log(`   💾 Modules in database: ${totalModules}`);
  console.log(`   📂 Location: public/curriculums/`);
  console.log(`\n✅ All curriculum files are now available OFFLINE!\n`);
}

// ═══ Run Import ══════════════════════════════════════════════════════════════

importCurriculum()
  .catch((error) => {
    console.error("\n❌ Import failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
