/**
 * POST /api/quiz/upload-answer
 *
 * Uploads a file submitted as a quiz answer and returns a permanent URL.
 * Stores files under public/uploads/quiz-answers/{userId}/{nodeId}/{blockId}/
 * so the teacher can later preview/play/download them from the grading UI.
 *
 * Form fields:
 *   file     — the File blob
 *   userId   — student's user ID (verified against session)
 *   nodeId   — skill node ID
 *   blockId  — quiz block ID
 *   questionIdx — question index (0-based)
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/local-auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// 50 MB max for video answers
const MAX_SIZE = 50 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // Local auth
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const nodeId  = (formData.get("nodeId")  as string) ?? "unknown";
    const blockId = (formData.get("blockId") as string) ?? "unknown";
    const questionIdx = (formData.get("questionIdx") as string) ?? "0";

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `File too large (max ${MAX_SIZE / 1024 / 1024} MB)` }, { status: 400 });
    }

    // Sanitise and build a unique filename
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const timestamp = Date.now();
    const fileName = `q${questionIdx}_${timestamp}_${safeName}`;

    // Store under public/uploads/quiz-answers/{userId}/{nodeId}/
    const dir = join(process.cwd(), "public", "uploads", "quiz-answers", user.id, nodeId);
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });

    const filePath = join(dir, fileName);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const fileUrl = `/uploads/quiz-answers/${user.id}/${nodeId}/${fileName}`;

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("[quiz/upload-answer]", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
