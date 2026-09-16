import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/passport/module-track?moduleCode=BDCRS401
 * 
 * Returns or creates a SkillTrack for a CurriculumModule
 */
export async function GET(request: NextRequest) {
  const fs = require('fs');
  const logPath = '/tmp/module-track-debug.log';

  function log(msg: string) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    console.log(`[module-track] ${msg}`);
    try {
      fs.appendFileSync(logPath, line);
    } catch (e) {
      console.error('Failed to write log:', e);
    }
  }

  try {
    log('=== NEW REQUEST ===');
    const user = await getCurrentUser();
    if (!user) {
      log('ERROR: No user found (unauthorized)');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    log(`User ID: ${user.id}`);

    const moduleCode = request.nextUrl.searchParams.get("moduleCode");
    if (!moduleCode) {
      log('ERROR: No moduleCode in request');
      return NextResponse.json({ error: "moduleCode required" }, { status: 400 });
    }
    log(`Module Code: ${moduleCode}`);

    // Find the curriculum module
    const module = await prisma.curriculumModule.findUnique({
      where: { code: moduleCode },
    });

    if (!module) {
      log(`ERROR: Module not found in database: ${moduleCode}`);
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }
    log(`Module found: ${module.id} - ${module.name}`);

    // Check if trainer is assigned to this module
    log(`Checking assignment: trainerId=${user.id}, moduleId=${module.id}`);
    const assignment = await prisma.trainerModule.findFirst({
      where: {
        trainerId: user.id,
        moduleId: module.id,
      },
    });
    log(`Assignment query completed. Result: ${assignment ? 'FOUND' : 'NULL'}`);

    if (!assignment) {
      log(`ERROR: Trainer not assigned to module. TrainerId: ${user.id}, ModuleId: ${module.id}`);
      log('Checking all assignments for this trainer...');
      const allAssignments = await prisma.trainerModule.findMany({
        where: { trainerId: user.id },
        select: { id: true, moduleId: true, trackId: true }
      });
      log(`Total assignments: ${allAssignments.length}`);
      allAssignments.forEach(a => log(`  - Assignment: moduleId=${a.moduleId}, trackId=${a.trackId}`));
      return NextResponse.json({ error: "Not assigned to this module" }, { status: 403 });
    }
    log(`Assignment found: ${assignment.id}`);

    // Find or create a SkillTrack for this module
    let track = await prisma.skillTrack.findFirst({
      where: {
        moduleSlug: moduleCode.toLowerCase(),
      },
    });

    if (!track) {
      // Create a new SkillTrack for this module
      track = await prisma.skillTrack.create({
        data: {
          name: module.name,
          description: module.description || `Curriculum module: ${module.name}`,
          department: module.department,
          tier: module.level, // Use level as tier
          icon: "📚",
          moduleSlug: moduleCode.toLowerCase(),
          curriculumUrl: module.pdfPath,
          curriculumType: "uploaded",
          order: module.order || 0,
        },
      });

      console.log(`✅ Created SkillTrack ${track.id} for module ${moduleCode}`);
    } else {
      console.log(`✅ Found existing SkillTrack ${track.id} for module ${moduleCode}`);
    }

    // Ensure current trainer has TrainerModule link to this track
    // The trainer already has an assignment with this moduleId, so update it to add trackId
    if (assignment.trackId !== track.id) {
      await prisma.trainerModule.update({
        where: { id: assignment.id },
        data: { trackId: track.id },
      });
      log(`✅ Updated TrainerModule ${assignment.id} to link track ${track.id}`);
    } else {
      log(`✅ TrainerModule already linked to track ${track.id}`);
    }

    // Only generate TOC if track was just created (not if reusing existing)
    if (!track.tableOfContents || track.tableOfContents === '[]') {
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const { existsSync } = await import('fs');
        const pdfParse = require('pdf-parse/lib/pdf-parse.js');
        const { parseRQFCurriculum } = await import('@/lib/parseRQFCurriculum');

        // Use same path resolution logic as extract-pdf route
        const relativePath = module.pdfPath.startsWith('/')
          ? module.pdfPath.substring(1)  // Remove leading slash
          : module.pdfPath;

        let basePath: string;
        if (process.env.IS_ELECTRON === 'true') {
          const cwd = process.cwd();
          if (cwd.includes('.next/standalone')) {
            basePath = cwd.substring(0, cwd.indexOf('.next/standalone'));
          } else if (cwd.includes('app.asar.unpacked')) {
            basePath = cwd.substring(0, cwd.indexOf('app.asar.unpacked') + 'app.asar.unpacked'.length);
          } else {
            basePath = cwd;
          }
          console.log(`[module-track] Electron mode - Base path: ${basePath}`);
        } else {
          basePath = process.cwd();
          console.log(`[module-track] Dev mode - Base path: ${basePath}`);
        }

        const pdfFullPath = path.join(basePath, relativePath);
        console.log(`[module-track] Reading PDF from: ${pdfFullPath}`);
        console.log(`[module-track] File exists: ${existsSync(pdfFullPath)}`);

        if (!existsSync(pdfFullPath)) {
          console.error(`[module-track] PDF not found at: ${pdfFullPath}`);
          throw new Error(`PDF not found: ${pdfFullPath}`);
        }

        const buffer = await fs.readFile(pdfFullPath);
        const pdfData = await pdfParse(buffer);
        const text = pdfData.text;

        console.log(`[module-track] Extracted ${text.length} characters from PDF`);

        // Parse curriculum structure
        const toc = parseRQFCurriculum(text, module.name);

        if (toc && toc.length > 0) {
          // Save TOC to database (must be JSON string, not object)
          await prisma.skillTrack.update({
            where: { id: track.id },
            data: { tableOfContents: JSON.stringify(toc) },
          });
          console.log(`✅ TOC generated and saved: ${toc.length} items`);
        } else {
          console.log(`⚠️ TOC parsing returned null - will use skeleton`);
        }
      } catch (error) {
        console.error("Failed to generate TOC:", error);
        // Non-fatal - trainer can regenerate manually
      }
    }

    return NextResponse.json({ trackId: track.id });
  } catch (error) {
    const fs = require('fs');
    const logPath = '/tmp/module-track-debug.log';
    const errorMsg = error instanceof Error ? error.message : String(error);
    const stackTrace = error instanceof Error ? error.stack : '';

    try {
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] EXCEPTION: ${errorMsg}\n${stackTrace}\n`);
    } catch (e) {
      // ignore
    }

    console.error("Error in module-track API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
