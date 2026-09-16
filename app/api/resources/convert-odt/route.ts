import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/local-auth";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const execAsync = promisify(exec);

// GET /api/resources/convert-odt?url=... — Convert ODT to PDF for viewing
export async function GET(request: NextRequest) {
  // Local auth
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "URL parameter required" }, { status: 400 });
  }

  try {
    // Check if LibreOffice is installed
    try {
      await execAsync("libreoffice --version");
    } catch (error) {
      console.error("LibreOffice not found");
      return NextResponse.json({ 
        error: "Document conversion not available. Please download the file.",
        fallbackUrl: url 
      }, { status: 503 });
    }

    // Create temp directory
    const tempDir = join(process.cwd(), "temp", "odt-conversions");
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }

    // Download the ODT file
    const odtPath = join(tempDir, `${user.id}_${Date.now()}.odt`);
    
    // Fetch from local path
    const fullPath = join(process.cwd(), "public", url);
    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: "File not found", fallbackUrl: url }, { status: 404 });
    }

    const fileBuffer = await readFile(fullPath);
    await writeFile(odtPath, fileBuffer);

    // Convert ODT to PDF using LibreOffice headless
    const pdfDir = join(tempDir);
    await execAsync(`libreoffice --headless --convert-to pdf --outdir "${pdfDir}" "${odtPath}"`);

    // Read the converted PDF
    const pdfPath = odtPath.replace(".odt", ".pdf");
    const pdfBuffer = await readFile(pdfPath);

    // Clean up temp files
    await unlink(odtPath).catch(() => {});
    await unlink(pdfPath).catch(() => {});

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
      },
    });

  } catch (error) {
    console.error("Conversion error:", error);
    return NextResponse.json({ 
      error: "Failed to convert document",
      fallbackUrl: url 
    }, { status: 500 });
  }
}
