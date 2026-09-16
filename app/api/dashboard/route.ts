import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const profile = await prisma.userProfile.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        role: true,
        xp: true,
        status: true,
        email: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check if account is pending review or rejected
    if (profile.status === "pending" || profile.status === "pending_review") {
      return NextResponse.json({
        status: "pending_review",
        profile: {
          name: profile.name,
          email: profile.email,
        },
      });
    }

    if (profile.status === "rejected") {
      return NextResponse.json({
        status: "rejected",
        profile: {
          name: profile.name,
          email: profile.email,
        },
      });
    }

    // 🎓 ENTRANCE TEST GATE - Students must complete test before browsing
    let entranceTest = null; // Declare outside the if block
    if (["l3", "l4", "l5"].includes(profile.role)) {
      entranceTest = await prisma.entranceTest.findUnique({
        where: { userId: user.id },
        select: {
          id: true,
          status: true,
          finalStatus: true,
          marksReleasedAt: true,
        },
      });

      // No test record = must take test
      if (!entranceTest) {
        return NextResponse.json({
          status: "entrance_test_required",
          profile: {
            id: profile.id,
            name: profile.name,
            role: profile.role,
            email: profile.email,
          },
        });
      }

      // Test in progress = continue test
      if (entranceTest.status === "in_progress" || entranceTest.status === "pending") {
        return NextResponse.json({
          status: "entrance_test_in_progress",
          profile: {
            id: profile.id,
            name: profile.name,
            role: profile.role,
            email: profile.email,
          },
        });
      }

      // ✅ Check if marks are released (approved OR rejected)
      if (entranceTest.marksReleasedAt && entranceTest.finalStatus) {
        // Marks released! Student can see results and access dashboard
        // Continue to full dashboard below
      }
      // Test rejected before marks released = cannot access
      else if (entranceTest.finalStatus === "rejected") {
        return NextResponse.json({
          status: "entrance_test_rejected",
          profile: {
            id: profile.id,
            name: profile.name,
            role: profile.role,
            email: profile.email,
          },
        });
      }
      // Test approved but marks not released yet = waiting
      else if (entranceTest.finalStatus === "approved" && !entranceTest.marksReleasedAt) {
        return NextResponse.json({
          status: "awaiting_marks_release",
          profile: {
            id: profile.id,
            name: profile.name,
            role: profile.role,
            email: profile.email,
          },
        });
      }
      // Test submitted/under review = waiting for teacher
      else if (
        entranceTest.status === "submitted" ||
        entranceTest.status === "under_review"
      ) {
        return NextResponse.json({
          status: "entrance_test_under_review",
          profile: {
            id: profile.id,
            name: profile.name,
            role: profile.role,
            email: profile.email,
          },
        });
      }
      // Fallback: something is incomplete
      else {
        return NextResponse.json({
          status: "entrance_test_incomplete",
          profile: {
            id: profile.id,
            name: profile.name,
            role: profile.role,
            email: profile.email,
          },
        });
      }

      // ✅ Student has passed entrance test and marks are released
      // Allow full access to app below
    }

    // Get last lesson (if any)
    const lastLesson = await prisma.lessonProgress.findFirst({
      where: { studentId: user.id },
      orderBy: { lastReadAt: "desc" },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            subject: true,
          },
        },
      },
    });

    // Get subject summary (if any lessons exist)
    let subjectSummary = null;
    if (lastLesson) {
      const subject = lastLesson.lesson.subject;
      const [total, completed] = await Promise.all([
        prisma.lesson.count({ where: { subject } }),
        prisma.lessonProgress.count({
          where: {
            studentId: user.id,
            lesson: { subject },
            completedAt: { not: null },
          },
        }),
      ]);

      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      subjectSummary = {
        subject,
        total,
        completed,
        pct,
        remaining: total - completed,
      };
    }

    // Get streak
    const streak = await prisma.studentStreak.findUnique({
      where: { studentId: user.id },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastActivityDate: true,
      },
    });

    // Get upcoming events
    const upcomingEvents = await prisma.event.findMany({
      where: {
        date: { gte: new Date() },
      },
      orderBy: { date: "asc" },
      take: 5,
      select: {
        id: true,
        title: true,
        date: true,
        type: true,
      },
    });

    // Admin stats (if admin)
    let adminStats = null;
    if (profile.role === "admin") {
      const [totalMembers, pendingCount, lessonsCompleted, pendingApplications] =
        await Promise.all([
          prisma.userProfile.count(),
          prisma.userProfile.count({ where: { status: { in: ["pending", "pending_review"] } } }),
          prisma.lessonProgress.count({ where: { completedAt: { not: null } } }),
          prisma.userProfile.findMany({
            where: { status: { in: ["pending", "pending_review"] } },
            take: 5,
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              school: true,
            },
          }),
        ]);

      adminStats = {
        totalMembers,
        pendingCount,
        lessonsCompleted,
        pendingApplications: pendingApplications.map((u) => ({ user: u })),
      };
    }

    return NextResponse.json({
      profile: {
        id: profile.id,
        name: profile.name,
        role: profile.role,
        xp: profile.xp,
      },
      entranceTestCompleted: entranceTest?.marksReleasedAt ? true : false, // Flag for showing results button
      lastLesson: lastLesson
        ? {
          lessonId: lastLesson.lesson.id,
          title: lastLesson.lesson.title,
          subject: lastLesson.lesson.subject,
          completedAt: lastLesson.completedAt,
          lastReadAt: lastLesson.lastReadAt,
        }
        : null,
      subjectSummary,
      streak: {
        current: streak?.currentStreak ?? 0,
        longest: streak?.longestStreak ?? 0,
        lastActivityDate: streak?.lastActivityDate ?? null,
      },
      upcomingEvents: upcomingEvents.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date.toISOString(),
        type: e.type,
      })),
      adminStats,
    });
  } catch (error) {
    console.error("[Dashboard API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
