/**
 * xAPI Standard Verbs for Learning Activity Tracking
 * Offline-first, stores in SQLite, syncs when online
 */

export const XAPI_VERBS = {
  // Core Learning Verbs
  COMPLETED: {
    id: 'http://adlnet.gov/expapi/verbs/completed',
    display: { 'en-US': 'completed' }
  },
  ATTEMPTED: {
    id: 'http://adlnet.gov/expapi/verbs/attempted',
    display: { 'en-US': 'attempted' }
  },
  PASSED: {
    id: 'http://adlnet.gov/expapi/verbs/passed',
    display: { 'en-US': 'passed' }
  },
  FAILED: {
    id: 'http://adlnet.gov/expapi/verbs/failed',
    display: { 'en-US': 'failed' }
  },
  
  // Content Interaction Verbs
  WATCHED: {
    id: 'http://activitystrea.ms/schema/1.0/watch',
    display: { 'en-US': 'watched' }
  },
  READ: {
    id: 'http://activitystrea.ms/schema/1.0/read',
    display: { 'en-US': 'read' }
  },
  INTERACTED: {
    id: 'http://adlnet.gov/expapi/verbs/interacted',
    display: { 'en-US': 'interacted' }
  },
  EXPERIENCED: {
    id: 'http://adlnet.gov/expapi/verbs/experienced',
    display: { 'en-US': 'experienced' }
  },
  
  // Simulation & VR Verbs
  SIMULATED: {
    id: 'http://adlnet.gov/expapi/verbs/simulated',
    display: { 'en-US': 'simulated' }
  },
  PRACTICED: {
    id: 'http://adlnet.gov/expapi/verbs/practiced',
    display: { 'en-US': 'practiced' }
  },
  
  // Progress Verbs
  PROGRESSED: {
    id: 'http://adlnet.gov/expapi/verbs/progressed',
    display: { 'en-US': 'progressed' }
  },
  INITIALIZED: {
    id: 'http://adlnet.gov/expapi/verbs/initialized',
    display: { 'en-US': 'initialized' }
  },
  RESUMED: {
    id: 'http://adlnet.gov/expapi/verbs/resumed',
    display: { 'en-US': 'resumed' }
  },
  SUSPENDED: {
    id: 'http://adlnet.gov/expapi/verbs/suspended',
    display: { 'en-US': 'suspended' }
  },
  
  // Assessment Verbs
  ANSWERED: {
    id: 'http://adlnet.gov/expapi/verbs/answered',
    display: { 'en-US': 'answered' }
  },
  SCORED: {
    id: 'http://adlnet.gov/expapi/verbs/scored',
    display: { 'en-US': 'scored' }
  }
} as const;

export const XAPI_ACTIVITY_TYPES = {
  VIDEO: 'http://activitystrea.ms/schema/1.0/video',
  DOCUMENT: 'http://activitystrea.ms/schema/1.0/document',
  SIMULATION: 'http://adlnet.gov/expapi/activities/simulation',
  ASSESSMENT: 'http://adlnet.gov/expapi/activities/assessment',
  QUESTION: 'http://adlnet.gov/expapi/activities/question',
  MODULE: 'http://adlnet.gov/expapi/activities/module',
  LESSON: 'http://adlnet.gov/expapi/activities/lesson',
  COURSE: 'http://adlnet.gov/expapi/activities/course',
  INTERACTION: 'http://adlnet.gov/expapi/activities/interaction',
  VR_EXPERIENCE: 'http://example.com/expapi/activities/vr-experience',
  CODE_SIMULATION: 'http://example.com/expapi/activities/code-simulation',
  CIRCUIT_SIMULATION: 'http://example.com/expapi/activities/circuit-simulation'
} as const;
