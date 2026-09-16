import { NextRequest, NextResponse } from 'next/server';

const EXAM_EXIT_PASSWORD = process.env.EXAM_EXIT_PASSWORD || 'EXAM2026';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    const isValid = password === EXAM_EXIT_PASSWORD;

    if (isValid) {
      console.log('✅ Admin password verified via API');
    } else {
      console.warn('❌ Invalid admin password attempt via API');
    }

    return NextResponse.json({ valid: isValid });
  } catch (error) {
    console.error('Error verifying password:', error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
