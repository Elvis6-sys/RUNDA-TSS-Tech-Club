import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/local-auth";

export async function GET(request: NextRequest) {
  // Local auth
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Count project submissions that:
    // 1. Belong to the user
    // 2. Have been graded (grade is not null)
    // 3. Haven't been viewed yet (we'll use updatedAt > lastViewedAt logic)
    
    // For simplicity, we'll count projects graded in the last 7 days that user hasn't visited results page
    // We'll use a simple heuristic: if gradedAt is recent and user hasn't checked, count it
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const unreadCount = await prisma.projectSubmission.count({
      where: {
        userId: user.id,
        grade: { not: null },
        gradedAt: { not: null, gte: sevenDaysAgo },
      },
    });

    return NextResponse.json({ count: unreadCount });
  } catch (error) {
    console.error("Error fetching unread project count:", error);
    return NextResponse.json(
      { error: "Failed to fetch unread count" },
      { status: 500 }
    );
  }
}
