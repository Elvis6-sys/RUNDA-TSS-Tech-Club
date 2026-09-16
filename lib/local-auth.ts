import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'runda-tss-tech-club-super-secret-2024'
);
const COOKIE_NAME = 'auth-token';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sign up a new user
 */
export async function signUp(email: string, password: string, name: string) {
  // Check if user exists
  const existing = await prisma.userProfile.findUnique({ where: { email } });
  if (existing) {
    return { error: 'Email already registered', user: null };
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await prisma.userProfile.create({
    data: {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      email,
      password: hashedPassword,
      name,
      role: 'pending',
      status: 'pending_review',
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status
    },
    error: null
  };
}

/**
 * Sign in an existing user
 */
export async function signIn(email: string, password: string) {
  // Find user
  const user = await prisma.userProfile.findUnique({ where: { email } });
  if (!user) {
    return { error: 'Invalid credentials', user: null };
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return { error: 'Invalid credentials', user: null };
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status
    },
    error: null
  };
}

/**
 * Create JWT token for a user using jose (Edge Runtime compatible)
 */
export async function createToken(user: AuthUser): Promise<string> {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify and decode JWT token using jose
 */
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string | null,
      role: payload.role as string,
      status: payload.status as string,
    };
  } catch {
    return null;
  }
}

/**
 * Set auth cookie (server-side)
 */
export async function setAuthCookie(user: AuthUser) {
  const token = await createToken(user);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    // In Electron, the server runs on http://127.0.0.1 (not HTTPS).
    // Secure cookies are never sent over HTTP, which would break all auth.
    // IS_ELECTRON=true is injected by main.js in the server spawn env.
    secure: process.env.NODE_ENV === 'production' && process.env.IS_ELECTRON !== 'true',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

/**
 * Get current user from cookie (server-side)
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Clear auth cookie (sign out)
 */
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Browser-side: Store token in localStorage
 */
export const browserAuth = {
  setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth-token', token);
    }
  },

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth-token');
  },

  clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token');
    }
  },

  async getUser(): Promise<AuthUser | null> {
    const token = this.getToken();
    if (!token) return null;
    return verifyToken(token);
  },
};
