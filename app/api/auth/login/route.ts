import { NextRequest, NextResponse } from 'next/server';
import { signIn, createToken, setAuthCookie } from '@/lib/local-auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const { user, error } = await signIn(email, password);

    if (error || !user) {
      return NextResponse.json({ error: error || 'Login failed' }, { status: 401 });
    }

    // Set HTTP-only cookie
    await setAuthCookie(user);

    // Also return token for browser storage
    const token = createToken(user);

    return NextResponse.json({ 
      success: true, 
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
