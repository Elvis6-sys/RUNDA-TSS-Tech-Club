import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from 'next/server';

// GET current user profile
export async function GET() {
  try {
    // Local auth
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        level: true,
        school: true,
        cohort: true,
        role: true,
        xp: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH update user profile (including department)
export async function PATCH(request: Request) {
  try {
    // Local auth
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { department, name, school, level, cohort } = body;

    // Update profile
    const updated = await prisma.userProfile.update({
      where: { id: user.id },
      data: {
        ...(department !== undefined && { department }),
        ...(name !== undefined && { name }),
        ...(school !== undefined && { school }),
        ...(level !== undefined && { level }),
        ...(cohort !== undefined && { cohort }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        level: true,
        school: true,
        cohort: true,
        role: true,
        xp: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
