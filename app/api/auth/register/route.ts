import { NextRequest, NextResponse } from 'next/server';
import { signUp, createToken, setAuthCookie } from '@/lib/local-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      name,
      school,
      cohort,
      department,
      level, // NEW: RQF Level
      graduationYear,
      taskLink,
      portfolioLink,
      rubric
    } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (!department || !level) {
      return NextResponse.json(
        { error: 'Department and level are required for entrance test' },
        { status: 400 }
      );
    }

    // Create user
    const { user, error } = await signUp(email, password, name);

    if (error || !user) {
      return NextResponse.json({ error: error || 'Registration failed' }, { status: 400 });
    }

    // Create application (simplified - just stores extra info)
    await prisma.application.create({
      data: {
        userId: user.id,
        statement: JSON.stringify(rubric || {}),
        rubric: JSON.stringify(rubric || {}),
        department: department || null,
        taskLink: taskLink || null,
        portfolioLink: portfolioLink || null,
        status: 'pending_review',
      },
    });

    // Update user profile with additional details
    await prisma.userProfile.update({
      where: { id: user.id },
      data: {
        school: school || null,
        cohort: cohort || null,
        level: level || null,
        department: department || null,
        graduationYear: graduationYear ? parseInt(graduationYear, 10) : null,
      },
    });

    // ✅ CREATE ENTRANCE TEST FOR THIS USER
    await prisma.entranceTest.create({
      data: {
        userId: user.id,
        trade: department,
        level: level,
        status: 'pending', // User needs to take the test
        totalQuestions: 0, // Will be populated when test is generated
        totalPoints: 0,
        passingScore: level === 'l3' ? 60 : level === 'l4' ? 65 : 70 // Higher levels need higher scores
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Please take the entrance test to complete your application.',
      entranceTestRequired: true,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
