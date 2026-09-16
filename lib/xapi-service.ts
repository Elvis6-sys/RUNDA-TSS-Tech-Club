/**
 * xAPI Service - Offline-first Learning Activity Tracking
 * All statements stored locally in SQLite, sync when online
 */

import { prisma } from '@/lib/prisma';
import { XAPI_VERBS, XAPI_ACTIVITY_TYPES } from './xapi-verbs';

export type XAPIActor = {
  objectType: 'Agent';
  name: string;
  mbox: string; // email
  account?: {
    homePage: string;
    name: string; // user ID
  };
};

export type XAPIVerb = {
  id: string;
  display: { [lang: string]: string };
};

export type XAPIObject = {
  objectType: 'Activity';
  id: string;
  definition: {
    name: { [lang: string]: string };
    description?: { [lang: string]: string };
    type: string;
    extensions?: Record<string, any>;
  };
};

export type XAPIResult = {
  score?: {
    scaled?: number; // 0-1
    raw?: number;
    min?: number;
    max?: number;
  };
  success?: boolean;
  completion?: boolean;
  duration?: string; // ISO 8601 duration
  response?: string;
  extensions?: Record<string, any>;
};

export type XAPIContext = {
  contextActivities?: {
    parent?: XAPIObject[];
    grouping?: XAPIObject[];
    category?: XAPIObject[];
  };
  instructor?: XAPIActor;
  team?: XAPIActor;
  revision?: string;
  platform?: string;
  language?: string;
  statement?: any;
  extensions?: Record<string, any>;
};

export type XAPIStatement = {
  actor: XAPIActor;
  verb: XAPIVerb;
  object: XAPIObject;
  result?: XAPIResult;
  context?: XAPIContext;
  timestamp?: string; // ISO 8601
};

/**
 * Track any learning activity - stores offline, syncs later
 */
export async function trackActivity(params: {
  userId: string;
  userName: string;
  userEmail: string;
  verb: XAPIVerb;
  activityId: string;
  activityName: string;
  activityType: string;
  activityDescription?: string;
  result?: XAPIResult;
  moduleCode?: string;
  context?: XAPIContext;
}) {
  const {
    userId,
    userName,
    userEmail,
    verb,
    activityId,
    activityName,
    activityType,
    activityDescription,
    result,
    moduleCode,
    context
  } = params;

  const timestamp = new Date().toISOString();

  // Build xAPI statement
  const actor: XAPIActor = {
    objectType: 'Agent',
    name: userName,
    mbox: `mailto:${userEmail}`,
    account: {
      homePage: 'https://runda-tss.com',
      name: userId
    }
  };

  const object: XAPIObject = {
    objectType: 'Activity',
    id: activityId,
    definition: {
      name: { 'en-US': activityName },
      description: activityDescription ? { 'en-US': activityDescription } : undefined,
      type: activityType
    }
  };

  const statement: XAPIStatement = {
    actor,
    verb,
    object,
    result,
    context: context || {
      platform: 'RUNDA TSS Tech Club',
      language: 'en-US',
      contextActivities: moduleCode ? {
        parent: [{
          objectType: 'Activity',
          id: `module:${moduleCode}`,
          definition: {
            name: { 'en-US': moduleCode },
            type: XAPI_ACTIVITY_TYPES.MODULE
          }
        }]
      } : undefined
    },
    timestamp
  };

  try {
    // Store in local database
    await prisma.xAPIStatement.create({
      data: {
        userId,
        actor: JSON.stringify(actor),
        verb: JSON.stringify(verb),
        object: JSON.stringify(object),
        result: result ? JSON.stringify(result) : null,
        context: JSON.stringify(statement.context),
        timestamp: new Date(timestamp),
        stored: new Date(),
        moduleCode: moduleCode || null,
        synced: false
      }
    });

    console.log('✅ [xAPI] Activity tracked offline:', verb.display['en-US'], activityName);
    return { success: true, statement };
  } catch (error) {
    console.error('❌ [xAPI] Failed to track activity:', error);
    return { success: false, error };
  }
}

/**
 * Track video viewing
 */
export async function trackVideoView(params: {
  userId: string;
  userName: string;
  userEmail: string;
  videoId: string;
  videoTitle: string;
  moduleCode?: string;
  duration: number; // seconds
  progress: number; // 0-100
  completed: boolean;
}) {
  const { userId, userName, userEmail, videoId, videoTitle, moduleCode, duration, progress, completed } = params;

  return trackActivity({
    userId,
    userName,
    userEmail,
    verb: completed ? XAPI_VERBS.COMPLETED : XAPI_VERBS.WATCHED,
    activityId: `video:${videoId}`,
    activityName: videoTitle,
    activityType: XAPI_ACTIVITY_TYPES.VIDEO,
    moduleCode,
    result: {
      completion: completed,
      duration: `PT${duration}S`, // ISO 8601 duration
      extensions: {
        'http://example.com/progress': progress
      }
    }
  });
}

/**
 * Track simulation interaction
 */
export async function trackSimulation(params: {
  userId: string;
  userName: string;
  userEmail: string;
  simulationId: string;
  simulationTitle: string;
  simulationType: 'circuit' | 'code' | 'vr' | 'blockchain' | 'other';
  moduleCode?: string;
  duration: number;
  completed: boolean;
  score?: number;
}) {
  const { userId, userName, userEmail, simulationId, simulationTitle, simulationType, moduleCode, duration, completed, score } = params;

  return trackActivity({
    userId,
    userName,
    userEmail,
    verb: XAPI_VERBS.SIMULATED,
    activityId: `simulation:${simulationType}:${simulationId}`,
    activityName: simulationTitle,
    activityType: XAPI_ACTIVITY_TYPES.SIMULATION,
    moduleCode,
    result: {
      completion: completed,
      duration: `PT${duration}S`,
      score: score !== undefined ? {
        raw: score,
        min: 0,
        max: 100,
        scaled: score / 100
      } : undefined
    }
  });
}

/**
 * Track quiz/assessment attempt
 */
export async function trackAssessment(params: {
  userId: string;
  userName: string;
  userEmail: string;
  assessmentId: string;
  assessmentTitle: string;
  moduleCode?: string;
  duration: number;
  score: number;
  maxScore: number;
  passed: boolean;
  completed: boolean;
}) {
  const { userId, userName, userEmail, assessmentId, assessmentTitle, moduleCode, duration, score, maxScore, passed, completed } = params;

  return trackActivity({
    userId,
    userName,
    userEmail,
    verb: passed ? XAPI_VERBS.PASSED : (completed ? XAPI_VERBS.FAILED : XAPI_VERBS.ATTEMPTED),
    activityId: `assessment:${assessmentId}`,
    activityName: assessmentTitle,
    activityType: XAPI_ACTIVITY_TYPES.ASSESSMENT,
    moduleCode,
    result: {
      score: {
        raw: score,
        min: 0,
        max: maxScore,
        scaled: score / maxScore
      },
      success: passed,
      completion: completed,
      duration: `PT${duration}S`
    }
  });
}

/**
 * Track reading/document interaction
 */
export async function trackReading(params: {
  userId: string;
  userName: string;
  userEmail: string;
  documentId: string;
  documentTitle: string;
  moduleCode?: string;
  duration: number;
  progress: number; // 0-100
  completed: boolean;
}) {
  const { userId, userName, userEmail, documentId, documentTitle, moduleCode, duration, progress, completed } = params;

  return trackActivity({
    userId,
    userName,
    userEmail,
    verb: completed ? XAPI_VERBS.COMPLETED : XAPI_VERBS.READ,
    activityId: `document:${documentId}`,
    activityName: documentTitle,
    activityType: XAPI_ACTIVITY_TYPES.DOCUMENT,
    moduleCode,
    result: {
      completion: completed,
      duration: `PT${duration}S`,
      extensions: {
        'http://example.com/progress': progress
      }
    }
  });
}

/**
 * Get user's learning analytics (offline)
 */
export async function getUserAnalytics(userId: string) {
  const statements = await prisma.xAPIStatement.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' }
  });

  const totalActivities = statements.length;
  const completedCount = statements.filter(s => {
    const verb = JSON.parse(s.verb);
    return verb.id === XAPI_VERBS.COMPLETED.id;
  }).length;

  const byModule = statements.reduce((acc, s) => {
    if (s.moduleCode) {
      acc[s.moduleCode] = (acc[s.moduleCode] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const byActivityType = statements.reduce((acc, s) => {
    const obj = JSON.parse(s.object);
    const type = obj.definition.type.split('/').pop();
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalActivities,
    completedCount,
    completionRate: totalActivities > 0 ? (completedCount / totalActivities) * 100 : 0,
    byModule,
    byActivityType,
    recentActivities: statements.slice(0, 10).map(s => ({
      id: s.id,
      verb: JSON.parse(s.verb).display['en-US'],
      activity: JSON.parse(s.object).definition.name['en-US'],
      timestamp: s.timestamp,
      moduleCode: s.moduleCode
    }))
  };
}

/**
 * Sync unsynced statements to remote LRS (when online)
 * For future use when you have a remote xAPI LRS
 */
export async function syncStatements() {
  const unsynced = await prisma.xAPIStatement.findMany({
    where: { synced: false },
    take: 100 // Batch sync
  });

  if (unsynced.length === 0) {
    return { success: true, synced: 0 };
  }

  // TODO: Send to remote LRS when online
  // For now, just mark as synced (offline-first app)
  const ids = unsynced.map(s => s.id);
  
  await prisma.xAPIStatement.updateMany({
    where: { id: { in: ids } },
    data: { synced: true, syncedAt: new Date() }
  });

  console.log(`✅ [xAPI] Synced ${ids.length} statements`);
  return { success: true, synced: ids.length };
}
