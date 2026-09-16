import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/local-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({
        role: 'student',
        name: null,
        level: null,
        track: null,
        profileImage: null
      }, { status: 200 });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { id: user.id },
      select: {
        role: true,
        name: true,
        level: true,
        cohort: true,
        profileImage: true,
      },
    });
    // Get student's active track from their most recent progress
    let trackName = profile?.cohort || null;
    let level = profile?.level || null;

    // Try to get more specific track info from skill progress
    if (profile?.role && ['l3', 'l4', 'l5'].includes(profile.role.toLowerCase())) {
      const recentProgress = await prisma.skillProgress.findFirst({
        where: { userId: user.id },
        include: {
          node: {
            include: {
              track: {
                select: {
                  name: true,
                  tier: true,
                }
              }
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      if (recentProgress?.node?.track) {
        trackName = recentProgress.node.track.name;
        // Try to extract level from tier (e.g., "L4", "L5")
        if (recentProgress.node.track.tier && !level) {
          const tierMatch = recentProgress.node.track.tier.match(/L(\d)/i);
          if (tierMatch) {
            level = tierMatch[1];
          }
        }
      }
    }

    // Map the role from the database to our AI role types
    let aiRole: 'student' | 'teacher' | 'admin' = 'student';

    if (profile?.role === 'admin') {
      aiRole = 'admin';
    } else if (profile?.role === 'trainer') {
      aiRole = 'teacher';
    }

    return NextResponse.json({
      role: aiRole,
      name: profile?.name || user.email?.split('@')[0] || null,
      level,
      track: trackName,
      profileImage: profile?.profileImage || null
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user role:', error);
    return NextResponse.json({
      role: 'student',
      name: null,
      level: null,
      track: null,
      profileImage: null
    }, { status: 200 });
  }
}
