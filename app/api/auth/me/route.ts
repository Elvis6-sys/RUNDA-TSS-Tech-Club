/**
 * API Route: Get Current User
 * GET /api/auth/me
 * Returns the current authenticated user's basic info
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/local-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Get user profile for full details
    const profile = await prisma.userProfile.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true
      }
    });

    if (!profile) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        status: profile.status
      }
    });

  } catch (error) {
    console.error('[Auth Me API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
