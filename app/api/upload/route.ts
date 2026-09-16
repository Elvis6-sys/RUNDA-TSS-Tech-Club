import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/local-auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // File size limits per type
    const sizeRules: { test: (t: string) => boolean; limit: number; label: string }[] = [
      { test: (t) => t.startsWith("video/"), limit: 100 * 1024 * 1024, label: "100 MB" },
      { test: (t) => t.startsWith("image/"), limit: 10 * 1024 * 1024, label: "10 MB" },
      { test: (t) => t.startsWith("audio/"), limit: 25 * 1024 * 1024, label: "25 MB" },
      { test: (t) => t.includes("pdf"), limit: 50 * 1024 * 1024, label: "50 MB" },
      { test: () => true, limit: 25 * 1024 * 1024, label: "25 MB" },
    ];
    const rule = sizeRules.find((r) => r.test(file.type))!;
    if (file.size > rule.limit) {
      return NextResponse.json(
        { error: `File too large. The limit for this file type is ${rule.label}.` },
        { status: 413 }
      );
    }

    // Determine uploads directory based on environment
    let uploadsDir: string;
    let publicPath: string;

    if (process.env.NODE_ENV === "production" && process.platform !== "darwin") {
      // In Electron production (Linux/Windows), save to user's home/.config directory
      const homeDir = require('os').homedir();
      const appName = "runda-tss-tech-club";
      const appDataDir = process.platform === "win32"
        ? join(homeDir, "AppData", "Local", appName)
        : join(homeDir, ".config", appName);

      uploadsDir = join(appDataDir, "uploads", "projects");
      publicPath = `/uploads/projects`; // Will be served by a special route

      console.log("[Upload] Using app data directory:", uploadsDir);
    } else {
      // In development or macOS, use public folder
      uploadsDir = join(process.cwd(), "public", "uploads", "projects");
      publicPath = `/uploads/projects`;
    }

    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${user.id}_${timestamp}_${sanitizedFileName}`;
    const filePath = join(uploadsDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return the public URL
    const fileUrl = `${publicPath}/${fileName}`;

    console.log("[Upload] File saved successfully:", {
      originalName: file.name,
      savedAs: fileName,
      size: file.size,
      url: fileUrl
    });

    return NextResponse.json({
      success: true,
      url: fileUrl,
      name: file.name,
      type: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
