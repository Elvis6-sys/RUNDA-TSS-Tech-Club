/**
 * API Usage Tracker
 * Monitors token usage, request counts, and provides capacity insights
 */

interface UsageMetrics {
  date: string;
  totalTokensUsed: number;
  totalRequests: number;
  uniqueUsers: Set<string>;
  peakConcurrent: number;
  keyRotations: number;
  rateLimitHits: number;
  modelBreakdown: {
    [model: string]: {
      tokens: number;
      requests: number;
    };
  };
  hourlyBreakdown: {
    [hour: string]: number; // tokens used per hour
  };
}

class APIUsageTracker {
  private metrics: UsageMetrics = {
    date: new Date().toISOString().split('T')[0],
    totalTokensUsed: 0,
    totalRequests: 0,
    uniqueUsers: new Set<string>(),
    peakConcurrent: 0,
    keyRotations: 0,
    rateLimitHits: 0,
    modelBreakdown: {},
    hourlyBreakdown: {},
  };
  private currentConcurrent: number = 0;
  private readonly DAILY_LIMIT_70B = 1_400_000; // 14 accounts × 100k
  private readonly DAILY_LIMIT_8B = 7_000_000; // 14 accounts × 500k

  constructor() {
    this.resetDailyMetrics();
  }

  private resetDailyMetrics() {
    this.metrics = {
      date: new Date().toISOString().split('T')[0],
      totalTokensUsed: 0,
      totalRequests: 0,
      uniqueUsers: new Set(),
      peakConcurrent: 0,
      keyRotations: 0,
      rateLimitHits: 0,
      modelBreakdown: {},
      hourlyBreakdown: {},
    };
  }

  /**
   * Track a new API request
   */
  trackRequest(params: {
    userId: string;
    model: string;
    tokensUsed: number;
    duration: number;
  }) {
    // Check if new day
    const today = new Date().toISOString().split('T')[0];
    if (this.metrics.date !== today) {
      this.archiveAndReset();
    }

    // Update metrics
    this.metrics.totalTokensUsed += params.tokensUsed;
    this.metrics.totalRequests++;
    this.metrics.uniqueUsers.add(params.userId);

    // Model breakdown
    if (!this.metrics.modelBreakdown[params.model]) {
      this.metrics.modelBreakdown[params.model] = { tokens: 0, requests: 0 };
    }
    this.metrics.modelBreakdown[params.model].tokens += params.tokensUsed;
    this.metrics.modelBreakdown[params.model].requests++;

    // Hourly breakdown
    const hour = new Date().getHours().toString().padStart(2, '0');
    this.metrics.hourlyBreakdown[hour] = (this.metrics.hourlyBreakdown[hour] || 0) + params.tokensUsed;

    // Track concurrent users
    this.currentConcurrent++;
    this.metrics.peakConcurrent = Math.max(this.metrics.peakConcurrent, this.currentConcurrent);

    // Decrement after estimated response time
    setTimeout(() => {
      this.currentConcurrent = Math.max(0, this.currentConcurrent - 1);
    }, params.duration);
  }

  /**
   * Track key rotation
   */
  trackKeyRotation() {
    this.metrics.keyRotations++;
  }

  /**
   * Track rate limit hit
   */
  trackRateLimitHit() {
    this.metrics.rateLimitHits++;
  }

  /**
   * Get current usage statistics
   */
  getStats() {
    const stats = {
      ...this.metrics,
      uniqueUsers: this.metrics.uniqueUsers.size,
      currentConcurrent: this.currentConcurrent,
      capacityUsed: {
        llama70B: {
          percentage: ((this.metrics.modelBreakdown['openai/gpt-oss-120b']?.tokens || 0) / this.DAILY_LIMIT_70B) * 100,
          tokensRemaining: this.DAILY_LIMIT_70B - (this.metrics.modelBreakdown['openai/gpt-oss-120b']?.tokens || 0),
        },
        llama8B: {
          percentage: ((this.metrics.modelBreakdown['llama-3.1-8b-instant']?.tokens || 0) / this.DAILY_LIMIT_8B) * 100,
          tokensRemaining: this.DAILY_LIMIT_8B - (this.metrics.modelBreakdown['llama-3.1-8b-instant']?.tokens || 0),
        },
      },
      alerts: this.getAlerts(),
    };

    return stats;
  }

  /**
   * Get capacity alerts
   */
  private getAlerts(): string[] {
    const alerts: string[] = [];

    const usage70B = this.metrics.modelBreakdown['llama-3.1-70b-versatile']?.tokens || 0;
    const usage8B = this.metrics.modelBreakdown['llama-3.1-8b-instant']?.tokens || 0;

    // 70B model alerts
    const percent70B = (usage70B / this.DAILY_LIMIT_70B) * 100;
    if (percent70B >= 90) {
      alerts.push(`🚨 CRITICAL: Llama 3.3 70B at ${percent70B.toFixed(1)}% capacity!`);
    } else if (percent70B >= 70) {
      alerts.push(`⚠️ WARNING: Llama 3.3 70B at ${percent70B.toFixed(1)}% capacity`);
    }

    // 8B model alerts
    const percent8B = (usage8B / this.DAILY_LIMIT_8B) * 100;
    if (percent8B >= 90) {
      alerts.push(`🚨 CRITICAL: Llama 3.1 8B at ${percent8B.toFixed(1)}% capacity!`);
    } else if (percent8B >= 70) {
      alerts.push(`⚠️ WARNING: Llama 3.1 8B at ${percent8B.toFixed(1)}% capacity`);
    }

    // Rate limit hits alert
    if (this.metrics.rateLimitHits > 50) {
      alerts.push(`⚠️ High rate limit hits: ${this.metrics.rateLimitHits} today`);
    }

    // Concurrent users alert
    if (this.currentConcurrent > 80) {
      alerts.push(`⚠️ High concurrent load: ${this.currentConcurrent} users`);
    }

    return alerts;
  }

  /**
   * Get dashboard summary
   */
  getDashboard() {
    const stats = this.getStats();

    return {
      title: '📊 API Usage Dashboard',
      date: this.metrics.date,
      summary: {
        'Total Requests': this.metrics.totalRequests.toLocaleString(),
        'Total Tokens': this.metrics.totalTokensUsed.toLocaleString(),
        'Unique Users': stats.uniqueUsers,
        'Peak Concurrent': this.metrics.peakConcurrent,
        'Key Rotations': this.metrics.keyRotations,
        'Rate Limit Hits': this.metrics.rateLimitHits,
        'Current Load': `${this.currentConcurrent} concurrent`,
      },
      capacity: {
        'Llama 3.3 70B': `${stats.capacityUsed.llama70B.percentage.toFixed(1)}% (${stats.capacityUsed.llama70B.tokensRemaining.toLocaleString()} remaining)`,
        'Llama 3.1 8B': `${stats.capacityUsed.llama8B.percentage.toFixed(1)}% (${stats.capacityUsed.llama8B.tokensRemaining.toLocaleString()} remaining)`,
      },
      models: this.metrics.modelBreakdown,
      peakHours: this.getPeakHours(),
      alerts: stats.alerts,
    };
  }

  /**
   * Get peak usage hours
   */
  private getPeakHours() {
    const sorted = Object.entries(this.metrics.hourlyBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return sorted.map(([hour, tokens]) => ({
      hour: `${hour}:00`,
      tokens: tokens.toLocaleString(),
    }));
  }

  /**
   * Archive current metrics and reset
   */
  private archiveAndReset() {
    // In production, save to database
    console.log('📦 Archiving daily metrics:', this.getDashboard());
    this.resetDailyMetrics();
  }

  /**
   * Estimate remaining capacity
   */
  estimateRemainingUsers(tokensPerUser: number = 7600) {
    const used70B = this.metrics.modelBreakdown['openai/gpt-oss-120b']?.tokens || 0;
    const remaining70B = this.DAILY_LIMIT_70B - used70B;

    return {
      remainingTokens: remaining70B,
      remainingUsers: Math.floor(remaining70B / tokensPerUser),
      estimatedTokensPerUser: tokensPerUser,
    };
  }

  /**
   * Should we switch to lighter model?
   */
  shouldUseLighterModel(): boolean {
    const used70B = this.metrics.modelBreakdown['openai/gpt-oss-120b']?.tokens || 0;
    const percent70B = (used70B / this.DAILY_LIMIT_70B) * 100;

    // Switch to 8B model if 70B is at 80%+ capacity
    return percent70B >= 80;
  }
}

// Create singleton instance
export const usageTracker = new APIUsageTracker();

// Helper functions
export function trackAPIRequest(params: {
  userId: string;
  model: string;
  tokensUsed: number;
  duration: number;
}) {
  usageTracker.trackRequest(params);
}

export function getUsageStats() {
  return usageTracker.getStats();
}

export function getUsageDashboard() {
  return usageTracker.getDashboard();
}

export function shouldUseLighterModel() {
  return usageTracker.shouldUseLighterModel();
}

export default usageTracker;
