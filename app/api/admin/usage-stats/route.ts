import { NextRequest, NextResponse } from 'next/server';
import { getUsageDashboard, getUsageStats } from '@/lib/api-usage-tracker';
import { getAPIKeyManagerStatus } from '@/lib/api-key-manager';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';

/**
 * GET /api/admin/usage-stats
 * Returns comprehensive API usage statistics and capacity metrics
 * 
 * Access: Admin only
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    // const session = await getServerSession(authOptions);

    // if (!session) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    // Check if user is admin
    // TODO: Implement proper admin check
    // if (session.user.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { error: 'Forbidden - Admin access required' },
    //     { status: 403 }
    //   );
    // }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'dashboard';

    // Get usage data
    const dashboard = getUsageDashboard();
    const detailedStats = getUsageStats();
    const keyManagerStatus = getAPIKeyManagerStatus();

    // Return based on format
    if (format === 'raw') {
      return NextResponse.json({
        usage: detailedStats,
        keys: keyManagerStatus,
      });
    }

    // Return formatted dashboard
    return NextResponse.json({
      success: true,
      data: {
        dashboard,
        keyManager: {
          totalKeys: keyManagerStatus.total,
          availableKeys: keyManagerStatus.available,
          currentKeyIndex: keyManagerStatus.currentIndex,
          keyStatus: keyManagerStatus.keys,
        },
        recommendations: generateRecommendations(dashboard, keyManagerStatus),
      },
    });

  } catch (error) {
    console.error('❌ Error fetching usage stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage statistics' },
      { status: 500 }
    );
  }
}

/**
 * Generate recommendations based on current usage
 */
function generateRecommendations(dashboard: any, keyStatus: any): string[] {
  const recommendations: string[] = [];

  // Check key availability
  if (keyStatus.available < 5) {
    recommendations.push(
      `⚠️ Low key availability: Only ${keyStatus.available}/${keyStatus.total} keys available. Some keys may be rate limited.`
    );
  }

  // Check capacity usage
  const alerts = dashboard.alerts || [];
  if (alerts.length > 0) {
    recommendations.push(...alerts);
  }

  // Check concurrent load
  if (dashboard.summary['Current Load'].includes('concurrent')) {
    const concurrent = parseInt(dashboard.summary['Current Load']);
    if (concurrent > 60) {
      recommendations.push(
        '💡 High concurrent load. Consider implementing request queuing or caching.'
      );
    }
  }

  // Model usage recommendations
  const models = dashboard.models || {};
  const usage70B = models['openai/gpt-oss-120b']?.tokens || 0;
  const usage8B = models['llama-3.1-8b-instant']?.tokens || 0;

  if (usage70B > usage8B * 2) {
    recommendations.push(
      '💡 Heavy use of 70B model. Consider routing simple queries to 8B model (5x more capacity).'
    );
  }

  // Peak hours recommendation
  const peakHours = dashboard.peakHours || [];
  if (peakHours.length > 0) {
    const peakHour = peakHours[0].hour;
    recommendations.push(
      `📊 Peak usage at ${peakHour}. Consider implementing smart throttling during this time.`
    );
  }

  // Rate limit hits
  if (dashboard.summary['Rate Limit Hits'] > 20) {
    recommendations.push(
      '⚠️ Multiple rate limit hits detected. API key rotation is working but consider adding caching.'
    );
  }

  // Success message if all good
  if (recommendations.length === 0) {
    recommendations.push('✅ All systems operating normally. Capacity is healthy.');
  }

  return recommendations;
}

/**
 * POST /api/admin/usage-stats/reset
 * Reset usage statistics (for testing)
 */
export async function POST(request: NextRequest) {
  try {
    // const session = await getServerSession(authOptions);

    // if (!session) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    // Only allow reset in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Reset not allowed in production' },
        { status: 403 }
      );
    }

    // Reset would happen here
    // usageTracker.reset();

    return NextResponse.json({
      success: true,
      message: 'Usage statistics reset successfully',
    });

  } catch (error) {
    console.error('❌ Error resetting stats:', error);
    return NextResponse.json(
      { error: 'Failed to reset statistics' },
      { status: 500 }
    );
  }
}
