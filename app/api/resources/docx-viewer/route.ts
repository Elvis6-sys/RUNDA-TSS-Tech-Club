import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/local-auth";

// GET /api/resources/docx-viewer?url=... — Generate a public URL for DOCX viewing
// In offline mode, files are stored locally, so we just return the URL as-is
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "URL parameter required" }, { status: 400 });
  }

  // In offline mode, files are stored locally in the public/ directory
  // or in the app's resources, so we just return the URL as-is
  return NextResponse.json({ publicUrl: url });
}
