/**
 * POST /api/passport/tracks/[trackId]/extract-pdf
 *
 * Extracts text content from a curriculum PDF stored locally.
 * This text is then used by the toc-generate endpoint for AI-powered TOC extraction.
 *
 * Flow:
 * 1. Fetch track's curriculumUrl from database
 * 2. Read PDF from local filesystem (public/uploads/projects/)
 * 3. Extract text using pdf-parse
 * 4. Return text + moduleCode for TOC generation
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/local-auth";
import { getCallerProfile, canManageTrack } from "@/lib/trainerGuard";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(
  req: NextRequest,
  { params }: { params: { trackId: string } },
) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const caller = await getCallerProfile(user.id);
  if (!caller) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await canManageTrack(caller, params.trackId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const track = await prisma.skillTrack.findUnique({
    where: { id: params.trackId },
    select: {
      id: true,
      name: true,
      moduleSlug: true,
      curriculumUrl: true,
    },
  });

  if (!track) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  if (!track.curriculumUrl) {
    return NextResponse.json(
      { error: "No curriculum PDF uploaded yet" },
      { status: 400 }
    );
  }

  try {
    // curriculumUrl is stored as: /All Curriculums/...
    // This is an ABSOLUTE path from the project root, NOT inside public/

    const relativePath = track.curriculumUrl.startsWith('/')
      ? track.curriculumUrl.substring(1)  // Remove leading slash
      : track.curriculumUrl;

    // Determine the correct base path depending on whether we're in Electron or dev
    let basePath: string;

    if (process.env.IS_ELECTRON === 'true') {
      // In Electron app, PDFs are in app.asar.unpacked at the root level
      // process.cwd() returns something like: /opt/RUNDA TSS Exam System/resources/app.asar.unpacked/.next/standalone
      // We need to go up to: /opt/RUNDA TSS Exam System/resources/app.asar.unpacked
      const cwd = process.cwd();
      if (cwd.includes('.next/standalone')) {
        // Go up from .next/standalone to app root
        basePath = cwd.substring(0, cwd.indexOf('.next/standalone'));
      } else if (cwd.includes('app.asar.unpacked')) {
        // Already at app.asar.unpacked level
        basePath = cwd.substring(0, cwd.indexOf('app.asar.unpacked') + 'app.asar.unpacked'.length);
      } else {
        // Fallback: use cwd
        basePath = cwd;
      }
      console.log(`[extract-pdf] Electron mode - Base path: ${basePath}`);
    } else {
      // In dev mode, use project root
      basePath = process.cwd();
      console.log(`[extract-pdf] Dev mode - Base path: ${basePath}`);
    }

    // Construct absolute path
    const filePath = join(basePath, relativePath);

    console.log(`[extract-pdf] Reading PDF from: ${filePath}`);
    console.log(`[extract-pdf] File exists: ${existsSync(filePath)}`);

    // Check if file exists before reading
    if (!existsSync(filePath)) {
      console.error(`[extract-pdf] File not found at: ${filePath}`);
      console.error(`[extract-pdf] Base path: ${basePath}`);
      console.error(`[extract-pdf] Relative path: ${relativePath}`);
      console.error(`[extract-pdf] process.cwd(): ${process.cwd()}`);
      return NextResponse.json(
        {
          error: "PDF file not found",
          details: `File does not exist at: ${filePath}`,
          debug: {
            basePath,
            relativePath,
            cwd: process.cwd(),
            isElectron: process.env.IS_ELECTRON
          }
        },
        { status: 404 }
      );
    }

    // Read PDF from local filesystem
    const buffer = await readFile(filePath);

    console.log(`[extract-pdf] PDF loaded, size: ${buffer.length} bytes`);

    // Extract text using pdf-parse v1.1.1 
    // Import the lib directly to avoid the debug code in index.js
    // @ts-ignore - pdf-parse doesn't have proper types
    const pdfParse = require("pdf-parse/lib/pdf-parse.js");
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text;
    const numPages = pdfData.numpages;

    console.log(`[extract-pdf] Extracted ${text.length} characters of text from ${numPages} pages`);

    // Extract module code from moduleSlug or track name
    const moduleCode = track.moduleSlug || track.name.split(" ")[0] || "MODULE";

    return NextResponse.json({
      text,
      moduleCode,
      extractedPages: numPages,
      characterCount: text.length,
    });
  } catch (error) {
    console.error("[extract-pdf] Error:", error);
    return NextResponse.json(
      { error: "Failed to extract text from PDF", details: String(error) },
      { status: 500 }
    );
  }
}
