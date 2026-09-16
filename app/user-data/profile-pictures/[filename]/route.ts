import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { homedir } from "os";

// Serve profile pictures from user's config directory in Electron
export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    // Only serve in Electron mode
    if (process.env.IS_ELECTRON !== 'true') {
      return NextResponse.json({ error: "Not available in dev mode" }, { status: 404 });
    }

    const { filename } = params;
    
    // Security: prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    // Construct path to user's config directory
    const filepath = join(
      homedir(),
      '.config',
      'RUNDA TSS Exam System',
      'uploads',
      'profile-pictures',
      filename
    );

    if (!existsSync(filepath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Read and serve the file
    const buffer = await readFile(filepath);
    
    // Determine content type from extension
    const ext = filename.split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
    };
    
    const contentType = contentTypes[ext || ''] || 'application/octet-stream';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('[user-data] Error serving file:', error);
    return NextResponse.json(
      { error: "Failed to serve file" },
      { status: 500 }
    );
  }
}
