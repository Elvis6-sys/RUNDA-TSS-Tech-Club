/**
 * Content Loader Service
 * Loads module content manifests and tracks xAPI activities
 */

export type ContentManifest = {
  moduleCode: string;
  moduleName: string;
  department: string;
  level: string;
  category: string;
  credits: number;
  estimatedHours: number;
  description: string;
  prerequisites: string[];
  learningOutcomes: string[];
  content: {
    units: ContentUnit[];
    assessments: Assessment[];
  };
  resources: Resource[];
};

export type ContentUnit = {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
};

export type Lesson = {
  id: string;
  title: string;
  type: 'video' | 'reading' | 'simulation' | 'vr' | 'interactive';
  duration?: number;
  file: string;
  xapiActivity: string;
  estimatedMinutes: number;
  requiresVR?: boolean;
};

export type Assessment = {
  id: string;
  title: string;
  type: 'quiz' | 'project';
  file?: string;
  description?: string;
  passingScore?: number;
  estimatedMinutes: number;
};

export type Resource = {
  id: string;
  title: string;
  type: 'pdf' | 'external' | 'link';
  file?: string;
  url?: string;
};

/**
 * Load module manifest from public/content
 */
export async function loadModuleManifest(moduleCode: string): Promise<ContentManifest | null> {
  try {
    const response = await fetch(`/content/${moduleCode}/manifest.json`);
    if (!response.ok) {
      console.error(`Failed to load manifest for ${moduleCode}`);
      return null;
    }
    const manifest: ContentManifest = await response.json();
    return manifest;
  } catch (error) {
    console.error(`Error loading manifest for ${moduleCode}:`, error);
    return null;
  }
}

/**
 * Get content URL for a lesson
 */
export function getContentUrl(moduleCode: string, filePath: string): string {
  return `/content/${moduleCode}/${filePath}`;
}

/**
 * Check if content file exists
 */
export async function checkContentExists(moduleCode: string, filePath: string): Promise<boolean> {
  try {
    const url = getContentUrl(moduleCode, filePath);
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get all available modules
 */
export const PILOT_MODULES = [
  'SWDBF501', // Blockchain Fundamentals
  'SWDPR301', // Project Requirements Analysis
  'SWDWS401', // Windows Server Administration
  'GENDE401', // Digital Electronics
  'GENCP401', // C Programming
  'GENWS501'  // Apply Windows Server
];

/**
 * Load all pilot module manifests
 */
export async function loadAllPilotModules(): Promise<ContentManifest[]> {
  const manifests = await Promise.all(
    PILOT_MODULES.map(code => loadModuleManifest(code))
  );
  return manifests.filter((m): m is ContentManifest => m !== null);
}

/**
 * Calculate total estimated time for a module
 */
export function calculateModuleDuration(manifest: ContentManifest): number {
  let totalMinutes = 0;
  
  manifest.content.units.forEach(unit => {
    unit.lessons.forEach(lesson => {
      totalMinutes += lesson.estimatedMinutes;
    });
  });
  
  manifest.content.assessments.forEach(assessment => {
    totalMinutes += assessment.estimatedMinutes;
  });
  
  return totalMinutes;
}

/**
 * Get lesson by ID
 */
export function getLessonById(manifest: ContentManifest, lessonId: string): Lesson | null {
  for (const unit of manifest.content.units) {
    const lesson = unit.lessons.find(l => l.id === lessonId);
    if (lesson) return lesson;
  }
  return null;
}

/**
 * Get unit progress percentage
 */
export function calculateUnitProgress(completedLessons: string[], unit: ContentUnit): number {
  if (unit.lessons.length === 0) return 0;
  const completed = unit.lessons.filter(l => completedLessons.includes(l.id)).length;
  return (completed / unit.lessons.length) * 100;
}

/**
 * Get module progress percentage
 */
export function calculateModuleProgress(completedLessons: string[], manifest: ContentManifest): number {
  const totalLessons = manifest.content.units.reduce((sum, unit) => sum + unit.lessons.length, 0);
  if (totalLessons === 0) return 0;
  
  const completedCount = manifest.content.units.reduce((sum, unit) => {
    return sum + unit.lessons.filter(l => completedLessons.includes(l.id)).length;
  }, 0);
  
  return (completedCount / totalLessons) * 100;
}
