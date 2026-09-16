import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { homedir } from "os";

// Helper function to get user-writable upload directory
function getUploadDir(): string {
  if (process.env.IS_ELECTRON === 'true') {
    // In Electron, use user's config directory (writable)
    return join(homedir(), '.config', 'RUNDA TSS Exam System', 'uploads', 'profile-pictures');
  } else {
    // In dev mode, use public folder
    return join(process.cwd(), "public", "uploads", "profile-pictures");
  }
}

// Helper to get the file path from a URL
function getFilePathFromUrl(imageUrl: string): string | null {
  if (!imageUrl) return null;

  if (process.env.IS_ELECTRON === 'true' && imageUrl.startsWith('/user-data/')) {
    // Electron user data path
    const filename = imageUrl.replace('/user-data/profile-pictures/', '');
    return join(homedir(), '.config', 'RUNDA TSS Exam System', 'uploads', 'profile-pictures', filename);
  } else if (imageUrl.startsWith("/uploads/")) {
    // Dev mode public folder path
    return join(process.cwd(), "public", imageUrl);
  }

  return null;
}

// GET — return the current user's profileImage URL
export async function GET() {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { profileImage: true, name: true },
  });

  return NextResponse.json({ profileImage: profile?.profileImage ?? null, name: profile?.name ?? null });
}

// POST — upload a new profile picture (FormData with key "file")
export async function POST(req: NextRequest) {
  try {
    // Local auth
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("file") as File | null;
    if (!file || !file.size) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate type
    const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WebP or GIF images are allowed." },
        { status: 400 }
      );
    }

    // Validate size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be 5 MB or less." }, { status: 400 });
    }

    // Delete previous file if it's a locally-stored one
    const current = await prisma.userProfile.findUnique({
      where: { id: user.id },
      select: { profileImage: true },
    });

    if (current?.profileImage) {
      const oldPath = getFilePathFromUrl(current.profileImage);
      if (oldPath && existsSync(oldPath)) {
        await unlink(oldPath).catch(() => { });
      }
    }

    // Ensure upload directory exists
    const uploadDir = getUploadDir();
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save new file
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filename = `${user.id}-${Date.now()}.${ext}`;
    const dest = join(uploadDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(dest, buffer);

    // Generate URL based on environment
    const imageUrl = process.env.IS_ELECTRON === 'true'
      ? `/user-data/profile-pictures/${filename}`
      : `/uploads/profile-pictures/${filename}`;

    await prisma.userProfile.update({
      where: { id: user.id },
      data: { profileImage: imageUrl },
    });

    return NextResponse.json({ success: true, profileImage: imageUrl });
  } catch (error) {
    console.error('[profile-picture] POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}

// DELETE — remove profile picture
export async function DELETE() {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { profileImage: true },
  });

  if (!profile?.profileImage) {
    return NextResponse.json({ error: "No profile picture set." }, { status: 404 });
  }

  // Remove file if locally stored
  const filepath = getFilePathFromUrl(profile.profileImage);
  if (filepath && existsSync(filepath)) {
    await unlink(filepath).catch(() => { });
  }

  await prisma.userProfile.update({
    where: { id: user.id },
    data: { profileImage: null },
  });

  return NextResponse.json({ success: true });
}
