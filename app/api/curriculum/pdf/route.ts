/**
 * GET /api/curriculum/pdf?path=...
 * 
 * Serves curriculum PDF files for offline access
 * In production (Electron), files are served from app.asar.unpacked
 * In development, files are served from project root
 */

import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const pdfPath = searchParams.get("path");

    if (!pdfPath) {
      return NextResponse.json({ error: "PDF path required" }, { status: 400 });
    }

    // Security: prevent directory traversal attacks
    // BUT allow ".." in filename (not path segments)
    const pathSegments = pdfPath.split('/');
    if (pathSegments.some(segment => segment === '..' || segment === '.')) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    // Determine the correct base directory
    let basePath: string;

    if (process.env.NODE_ENV === "production") {
      // In Electron production, files are in app.asar.unpacked
      // @ts-ignore - resourcesPath is added by Electron at runtime
      if (process.resourcesPath) {
        // @ts-ignore
        basePath = join(process.resourcesPath, "app.asar.unpacked");
      } else {
        basePath = process.cwd();
      }
    } else {
      // In development, files are in project root
      basePath = process.cwd();
    }

    // Remove leading slash from pdfPath
    const relativePath = pdfPath.startsWith("/") ? pdfPath.slice(1) : pdfPath;
    const fullPath = join(basePath, relativePath);

    // Check if file exists
    if (!existsSync(fullPath)) {
      console.error(`[PDF] File not found: ${fullPath}`);
      return NextResponse.json(
        { error: "PDF file not found", path: fullPath },
        { status: 404 }
      );
    }

    // Read and serve the PDF file
    const fileBuffer = await readFile(fullPath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${relativePath.split("/").pop()}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[GET /api/curriculum/pdf] Error:", error);
    return NextResponse.json(
      { error: "Failed to serve PDF", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
