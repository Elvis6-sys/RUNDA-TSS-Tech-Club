/**
 * GET /api/uploads/projects/[filename]
 * 
 * Serves uploaded project files from user's app data directory (Electron production)
 * or public folder (development)
 */

import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params;

    // Security: prevent directory traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    // Determine file location based on environment
    let filePath: string;

    if (process.env.NODE_ENV === "production" && process.platform !== "darwin") {
      // Electron production: read from app data directory
      const homeDir = require('os').homedir();
      const appName = "runda-tss-tech-club";
      const appDataDir = process.platform === "win32" 
        ? join(homeDir, "AppData", "Local", appName)
        : join(homeDir, ".config", appName);
      
      filePath = join(appDataDir, "uploads", "projects", filename);
    } else {
      // Development or macOS: read from public folder
      filePath = join(process.cwd(), "public", "uploads", "projects", filename);
    }

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: "File not found", path: filePath },
        { status: 404 }
      );
    }

    // Read and serve the file
    const fileBuffer = await readFile(filePath);

    // Determine content type from filename
    const ext = filename.split(".").pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      svg: "image/svg+xml",
      webp: "image/webp",
      mp4: "video/mp4",
      webm: "video/webm",
      mov: "video/quicktime",
    };

    const contentType = contentTypes[ext || ""] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[GET /api/uploads/projects/[filename]] Error:", error);
    return NextResponse.json(
      { error: "Failed to serve file", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
