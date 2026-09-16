/**
 * Quiz Security Utilities
 * 
 * - Rate limiting
 * - Session fingerprinting
 * - Time-based validation
 * - Suspicious activity detection
 */

import { headers } from "next/headers";
import crypto from "crypto";

// ─── Rate Limiting ────────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

// In-memory store (consider Redis for production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const CLEANUP_AGE = 15 * 60 * 1000; // 15 minutes
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.lastAttempt > CLEANUP_AGE) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  maxAttempts: number;    // Maximum attempts
  windowMs: number;        // Time window in milliseconds
  penaltyMs?: number;      // Penalty duration after exceeding limit
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  penaltyUntil?: number;
}

/**
 * Check rate limit for a given key (user ID + action)
 */
export function checkRateLimit(
  userId: string,
  action: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `${userId}:${action}`;
  const now = Date.now();
  
  let entry = rateLimitStore.get(key);
  
  if (!entry) {
    // First attempt
    entry = { count: 1, firstAttempt: now, lastAttempt: now };
    rateLimitStore.set(key, entry);
    
    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetAt: now + config.windowMs,
    };
  }
  
  // Check if window has expired
  if (now - entry.firstAttempt > config.windowMs) {
    // Reset window
    entry.count = 1;
    entry.firstAttempt = now;
    entry.lastAttempt = now;
    rateLimitStore.set(key, entry);
    
    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetAt: now + config.windowMs,
    };
  }
  
  // Within window - increment count
  entry.count++;
  entry.lastAttempt = now;
  rateLimitStore.set(key, entry);
  
  if (entry.count > config.maxAttempts) {
    const penaltyUntil = config.penaltyMs ? now + config.penaltyMs : undefined;
    
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.firstAttempt + config.windowMs,
      penaltyUntil,
    };
  }
  
  return {
    allowed: true,
    remaining: config.maxAttempts - entry.count,
    resetAt: entry.firstAttempt + config.windowMs,
  };
}

// ─── Session Fingerprinting ───────────────────────────────────────────────────

export interface DeviceFingerprint {
  hash: string;
  userAgent: string;
  ip: string;
  acceptLanguage: string;
  acceptEncoding: string;
  timestamp: number;
}

/**
 * Generate device fingerprint from request headers
 */
export async function generateFingerprint(): Promise<DeviceFingerprint> {
  const headersList = headers();
  
  const userAgent = headersList.get("user-agent") || "unknown";
  const ip = headersList.get("x-forwarded-for")?.split(",")[0].trim() 
    || headersList.get("x-real-ip") 
    || "unknown";
  const acceptLanguage = headersList.get("accept-language") || "unknown";
  const acceptEncoding = headersList.get("accept-encoding") || "unknown";
  
  // Create fingerprint hash
  const fingerprintData = `${userAgent}|${ip}|${acceptLanguage}|${acceptEncoding}`;
  const hash = crypto.createHash("sha256").update(fingerprintData).digest("hex");
  
  return {
    hash,
    userAgent,
    ip,
    acceptLanguage,
    acceptEncoding,
    timestamp: Date.now(),
  };
}

/**
 * Compare two fingerprints for significant differences
 * Returns true if fingerprints match (allowing minor variations)
 */
export function compareFingerprints(
  fp1: DeviceFingerprint,
  fp2: DeviceFingerprint
): { match: boolean; score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  
  // Exact hash match
  if (fp1.hash === fp2.hash) {
    return { match: true, score: 100, reasons: [] };
  }
  
  // Check IP address
  if (fp1.ip === fp2.ip) {
    score += 40;
  } else {
    reasons.push("IP address changed");
  }
  
  // Check user agent (browser/OS)
  if (fp1.userAgent === fp2.userAgent) {
    score += 40;
  } else {
    // Allow minor UA variations (version updates)
    const ua1Base = fp1.userAgent.split("/")[0];
    const ua2Base = fp2.userAgent.split("/")[0];
    if (ua1Base === ua2Base) {
      score += 20;
      reasons.push("Browser version changed");
    } else {
      reasons.push("Different browser detected");
    }
  }
  
  // Check language
  if (fp1.acceptLanguage === fp2.acceptLanguage) {
    score += 10;
  } else {
    reasons.push("Language settings changed");
  }
  
  // Check encoding
  if (fp1.acceptEncoding === fp2.acceptEncoding) {
    score += 10;
  }
  
  // Match if score >= 70%
  const match = score >= 70;
  
  return { match, score, reasons };
}

// ─── Time-based Validation ────────────────────────────────────────────────────

interface QuestionTimingEntry {
  questionId: string;
  viewedAt: number;
  answeredAt?: number;
  timeSpentMs?: number;
}

// Store per user-quiz session
const timingStore = new Map<string, QuestionTimingEntry[]>();

/**
 * Record when a student views a question
 */
export function recordQuestionView(
  userId: string,
  quizId: string,
  questionId: string
): void {
  const key = `${userId}:${quizId}`;
  const entries = timingStore.get(key) || [];
  
  entries.push({
    questionId,
    viewedAt: Date.now(),
  });
  
  timingStore.set(key, entries);
}

/**
 * Record when a student answers a question
 */
export function recordQuestionAnswer(
  userId: string,
  quizId: string,
  questionId: string
): { timeSpentMs: number; suspicious: boolean; reason?: string } {
  const key = `${userId}:${quizId}`;
  const entries = timingStore.get(key) || [];
  
  const now = Date.now();
  const entry = entries.find(e => e.questionId === questionId && !e.answeredAt);
  
  if (!entry) {
    // No view record - VERY suspicious
    return {
      timeSpentMs: 0,
      suspicious: true,
      reason: "Answered without viewing question",
    };
  }
  
  const timeSpentMs = now - entry.viewedAt;
  entry.answeredAt = now;
  entry.timeSpentMs = timeSpentMs;
  
  timingStore.set(key, entries);
  
  // Suspicious if answered too quickly (< 3 seconds for text, < 1 second for MCQ)
  const MIN_TIME_TEXT = 3000; // 3 seconds
  const MIN_TIME_MCQ = 1000;  // 1 second
  
  if (timeSpentMs < MIN_TIME_MCQ) {
    return {
      timeSpentMs,
      suspicious: true,
      reason: `Answered too quickly (${timeSpentMs}ms)`,
    };
  }
  
  return { timeSpentMs, suspicious: false };
}

/**
 * Get timing statistics for a quiz session
 */
export function getTimingStats(userId: string, quizId: string): {
  totalQuestions: number;
  answeredQuestions: number;
  avgTimeMs: number;
  suspiciousCount: number;
  fastestMs: number;
  slowestMs: number;
} {
  const key = `${userId}:${quizId}`;
  const entries = timingStore.get(key) || [];
  
  const answered = entries.filter(e => e.answeredAt);
  const times = answered.map(e => e.timeSpentMs || 0);
  
  const suspiciousCount = times.filter(t => t < 1000).length;
  const avgTimeMs = times.length > 0
    ? times.reduce((sum, t) => sum + t, 0) / times.length
    : 0;
  
  return {
    totalQuestions: entries.length,
    answeredQuestions: answered.length,
    avgTimeMs,
    suspiciousCount,
    fastestMs: times.length > 0 ? Math.min(...times) : 0,
    slowestMs: times.length > 0 ? Math.max(...times) : 0,
  };
}

/**
 * Clear timing data for a quiz session
 */
export function clearQuizTiming(userId: string, quizId: string): void {
  const key = `${userId}:${quizId}`;
  timingStore.delete(key);
}

// ─── Suspicious Pattern Detection ─────────────────────────────────────────────

export interface SuspiciousActivity {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Analyze quiz submission for suspicious patterns
 */
export function detectSuspiciousPatterns(
  userId: string,
  quizId: string,
  answers: any[],
  timeStats: ReturnType<typeof getTimingStats>
): SuspiciousActivity[] {
  const activities: SuspiciousActivity[] = [];
  
  // Pattern 1: Too fast completion
  if (timeStats.avgTimeMs < 5000 && timeStats.answeredQuestions > 5) {
    activities.push({
      type: "fast_completion",
      severity: "critical",
      description: `Completed ${timeStats.answeredQuestions} questions in avg ${Math.round(timeStats.avgTimeMs / 1000)}s per question`,
      timestamp: Date.now(),
      metadata: { avgTimeMs: timeStats.avgTimeMs, questionCount: timeStats.answeredQuestions },
    });
  }
  
  // Pattern 2: Too many fast answers
  if (timeStats.suspiciousCount > 3) {
    activities.push({
      type: "rapid_answers",
      severity: "high",
      description: `${timeStats.suspiciousCount} questions answered in < 1 second`,
      timestamp: Date.now(),
      metadata: { suspiciousCount: timeStats.suspiciousCount },
    });
  }
  
  // Pattern 3: Unrealistic answer distribution (all correct or all wrong suddenly)
  const correctCount = answers.filter(a => a.isCorrect).length;
  const totalCount = answers.length;
  
  if (totalCount > 5) {
    if (correctCount === totalCount) {
      activities.push({
        type: "perfect_score",
        severity: "medium",
        description: "All answers correct (may indicate external help)",
        timestamp: Date.now(),
        metadata: { correctCount, totalCount },
      });
    } else if (correctCount === 0) {
      activities.push({
        type: "zero_score",
        severity: "low",
        description: "All answers wrong (may indicate random clicking)",
        timestamp: Date.now(),
        metadata: { correctCount, totalCount },
      });
    }
  }
  
  // Pattern 4: Identical time patterns (potential bot)
  const times = answers.map(a => a.timeSpentMs || 0);
  const uniqueTimes = new Set(times);
  
  if (times.length > 5 && uniqueTimes.size < 3) {
    activities.push({
      type: "identical_timing",
      severity: "high",
      description: "Suspiciously identical answer timing (potential automation)",
      timestamp: Date.now(),
      metadata: { uniqueTimings: uniqueTimes.size, totalQuestions: times.length },
    });
  }
  
  return activities;
}

// ─── IP Geolocation Helpers ──────────────────────────────────────────────────

/**
 * Check if IP is from expected region/campus
 * (Requires IP geolocation service integration)
 */
export async function validateIPLocation(
  ip: string,
  expectedCountry?: string,
  expectedRegion?: string
): Promise<{ valid: boolean; location?: any; reason?: string }> {
  // TODO: Integrate with IP geolocation service (e.g., MaxMind, IPStack)
  // For now, just log and return valid
  
  console.log(`📍 IP validation: ${ip} (expected: ${expectedCountry}/${expectedRegion})`);
  
  // Placeholder - implement actual geolocation check
  return { valid: true };
}
