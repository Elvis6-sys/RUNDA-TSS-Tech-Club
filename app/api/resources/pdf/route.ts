/**
 * GET /api/resources/pdf?path=...
 * 
 * Serves resource PDF files for offline access in Electron
 * Handles both uploaded files and curriculum PDFs
 */

import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const filePath = searchParams.get("path");

    if (!filePath) {
      return NextResponse.json({ error: "File path required" }, { status: 400 });
    }

    // Security: prevent directory traversal attacks
    const pathSegments = filePath.split('/');
    if (pathSegments.some(segment => segment === '..' || segment === '.')) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    // Determine the correct base directory
    let fullPath: string;

    // FIRST: Check if it's an absolute filesystem path
    if (filePath.startsWith('/home') || filePath.startsWith('/opt') || filePath.startsWith('/Users')) {
      // Absolute filesystem path - use directly
      fullPath = filePath;
      console.log(`[PDF] Using absolute path: ${fullPath}`);
    }
    // If path starts with /uploads, it's a user-uploaded file
    else if (filePath.startsWith('/uploads')) {
      const relativePath = filePath.startsWith("/") ? filePath.slice(1) : filePath;

      if (process.env.NODE_ENV === "production" && process.platform !== "darwin") {
        // In Electron production (Linux/Windows), check app data directory
        const homeDir = require('os').homedir();
        const appName = "runda-tss-tech-club";
        const appDataDir = process.platform === "win32"
          ? join(homeDir, "AppData", "Local", appName)
          : join(homeDir, ".config", appName);

        const appDataPath = join(appDataDir, relativePath);
        if (existsSync(appDataPath)) {
          fullPath = appDataPath;
        } else {
          // Fallback to public folder
          fullPath = join(process.cwd(), "public", relativePath);
        }
      } else {
        // Development or macOS - use public folder
        fullPath = join(process.cwd(), "public", relativePath);
      }
    }
    // If path starts with /All Curriculums, it's a curriculum PDF
    else if (filePath.includes('/All Curriculums')) {
      const relativePath = filePath.startsWith("/") ? filePath.slice(1) : filePath;

      if (process.env.NODE_ENV === "production") {
        // @ts-ignore - resourcesPath is added by Electron at runtime
        if (process.resourcesPath) {
          // @ts-ignore
          fullPath = join(process.resourcesPath, "app.asar.unpacked", relativePath);
        } else {
          fullPath = join(process.cwd(), relativePath);
        }
      } else {
        fullPath = join(process.cwd(), relativePath);
      }
    }
    // Default: handle both absolute and relative paths
    else {
      // If it's an absolute path (starts with /), use it directly
      if (filePath.startsWith('/') && !filePath.startsWith('/.')) {
        fullPath = filePath;
      } else {
        // Relative path - join with project root
        const relativePath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
        fullPath = join(process.cwd(), relativePath);
      }
    }

    console.log(`[PDF] Attempting to serve: ${fullPath}`);

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
        "Content-Disposition": `inline; filename="${filePath.split("/").pop()}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
        // CORS headers for Electron
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("[GET /api/resources/pdf] Error:", error);
    return NextResponse.json(
      { error: "Failed to serve PDF", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
