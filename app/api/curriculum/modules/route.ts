/**
 * GET /api/curriculum/modules
 * 
 * Fetches curriculum modules filtered by department and level
 * Organized by category (General, Core, CCM)
 * 
 * Query params:
 *  - department: software-development, computer-systems-architecture, etc.
 *  - level: l3, l4, l5
 * 
 * Returns modules grouped by category for OFFLINE access
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/local-auth";

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = request.nextUrl;
    const department = searchParams.get("department");
    const level = searchParams.get("level");

    if (!department || !level) {
      return NextResponse.json(
        { error: "Department and level are required" },
        { status: 400 }
      );
    }

    // Fetch modules from database (local SQLite - 100% offline)
    const modules = await prisma.curriculumModule.findMany({
      where: {
        department,
        level,
        isActive: true,
      },
      orderBy: [
        { category: "asc" },
        { code: "asc" },
      ],
      select: {
        id: true,
        code: true,
        name: true,
        department: true,
        level: true,
        category: true,
        description: true,
        pdfPath: true,
        pdfFileName: true,
        fileSize: true,
        credits: true,
        hours: true,
      },
    });

    // Group by category
    const grouped = {
      general: modules.filter((m) => m.category === "general"),
      core: modules.filter((m) => m.category === "core"),
      ccm: modules.filter((m) => m.category === "ccm"),
    };

    return NextResponse.json({
      success: true,
      department,
      level,
      totalModules: modules.length,
      modules: grouped,
    });
  } catch (error) {
    console.error("[GET /api/curriculum/modules] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch modules" },
      { status: 500 }
    );
  }
}
