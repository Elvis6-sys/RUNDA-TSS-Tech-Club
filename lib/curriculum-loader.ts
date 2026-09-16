/**
 * Curriculum Loader - Loads parsed curriculum data for AI consumption
 * Provides access to all 54 modules from TVET Rwanda curriculum
 */

import curriculumData from './curriculum-data/curriculum-all.json';

export interface CurriculumTopic {
  text?: string;
}

export interface LearningOutcome {
  number: number;
  title: string;
  topics: string[];
}

export interface IndicativeContent {
  number: number;
  text: string;
}

export interface Module {
  code: string;
  title: string;
  moduleType: string;
  learningHours: number | null;
  credits: number | null;
  description: string;
  learningOutcomes: LearningOutcome[] | null;
  indicativeContent: IndicativeContent[] | null;
  rawText: string;
  sourceFile: string;
  pages: number;
  level: string;
}

export interface CurriculumData {
  metadata: {
    generatedAt: string;
    totalModules: number;
    levels: string[];
    source: string;
    includes: string[];
  };
  L3: Module[];
  L4: Module[];
  L5: Module[];
}

// Type-safe curriculum data
const curriculum = curriculumData as CurriculumData;

/**
 * Get a module by code (searches across all levels)
 */
export function getModuleByCode(moduleCode: string): Module | null {
  for (const level of ['L3', 'L4', 'L5'] as const) {
    const module = curriculum[level].find(m => m.code === moduleCode);
    if (module) {
      return module;
    }
  }
  return null;
}

/**
 * Get all modules for a specific level
 */
export function getModulesByLevel(level: 'L3' | 'L4' | 'L5'): Module[] {
  return curriculum[level] || [];
}

/**
 * Get modules by type (CCM, General, Specific)
 */
export function getModulesByType(moduleType: string, level?: 'L3' | 'L4' | 'L5'): Module[] {
  const levels = level ? [level] : ['L3', 'L4', 'L5'] as const;
  const modules: Module[] = [];
  
  for (const lvl of levels) {
    modules.push(...curriculum[lvl].filter(m => m.moduleType === moduleType));
  }
  
  return modules;
}

/**
 * Get a specific learning outcome from a module
 */
export function getLearningOutcome(
  moduleCode: string,
  outcomeNumber: number
): LearningOutcome | null {
  const module = getModuleByCode(moduleCode);
  if (!module || !module.learningOutcomes) {
    return null;
  }
  
  return module.learningOutcomes.find(lo => lo.number === outcomeNumber) || null;
}

/**
 * Search modules by title or description
 */
export function searchModules(query: string): Module[] {
  const lowerQuery = query.toLowerCase();
  const results: Module[] = [];
  
  for (const level of ['L3', 'L4', 'L5'] as const) {
    for (const module of curriculum[level]) {
      if (
        module.title.toLowerCase().includes(lowerQuery) ||
        module.description.toLowerCase().includes(lowerQuery) ||
        module.code.toLowerCase().includes(lowerQuery)
      ) {
        results.push(module);
      }
    }
  }
  
  return results;
}

/**
 * Get all specific modules (Software Development)
 */
export function getAllSpecificModules(): Module[] {
  return getModulesByType('Specific');
}

/**
 * Format module for AI context (comprehensive)
 */
export function formatModuleForAI(module: Module): string {
  let formatted = `
### ${module.code}: ${module.title}

**Module Type:** ${module.moduleType}
**Level:** ${module.level}
${module.learningHours ? `**Learning Hours:** ${module.learningHours}` : ''}
${module.credits ? `**Credits:** ${module.credits}` : ''}

**Description:**
${module.description || 'N/A'}

`;

  if (module.learningOutcomes && module.learningOutcomes.length > 0) {
    formatted += `**Learning Outcomes:**\n\n`;
    
    for (const lo of module.learningOutcomes) {
      formatted += `**LO${lo.number}: ${lo.title}**\n`;
      
      if (lo.topics && lo.topics.length > 0) {
        formatted += `Topics:\n`;
        lo.topics.forEach(topic => {
          formatted += `  - ${topic}\n`;
        });
      }
      formatted += '\n';
    }
  }

  if (module.indicativeContent && module.indicativeContent.length > 0) {
    formatted += `**Indicative Content:**\n`;
    module.indicativeContent.forEach(ic => {
      formatted += `${ic.number}. ${ic.text}\n`;
    });
    formatted += '\n';
  }

  return formatted;
}

/**
 * Format learning outcome for AI context
 */
export function formatLearningOutcomeForAI(
  moduleCode: string,
  outcomeNumber: number
): string | null {
  const module = getModuleByCode(moduleCode);
  if (!module) return null;
  
  const lo = getLearningOutcome(moduleCode, outcomeNumber);
  if (!lo) return null;
  
  let formatted = `
### ${module.code} - Learning Outcome ${lo.number}

**Module:** ${module.title}
**Learning Outcome:** ${lo.title}

`;

  if (lo.topics && lo.topics.length > 0) {
    formatted += `**Topics Covered:**\n`;
    lo.topics.forEach(topic => {
      formatted += `- ${topic}\n`;
    });
  }

  return formatted;
}

/**
 * Get curriculum statistics
 */
export function getCurriculumStats() {
  return {
    totalModules: curriculum.metadata.totalModules,
    levels: curriculum.metadata.levels,
    byLevel: {
      L3: curriculum.L3.length,
      L4: curriculum.L4.length,
      L5: curriculum.L5.length,
    },
    byType: {
      CCM: getModulesByType('CCM').length,
      General: getModulesByType('General').length,
      Specific: getModulesByType('Specific').length,
    },
  };
}

/**
 * Get all module codes
 */
export function getAllModuleCodes(): string[] {
  const codes: string[] = [];
  
  for (const level of ['L3', 'L4', 'L5'] as const) {
    codes.push(...curriculum[level].map(m => m.code));
  }
  
  return codes;
}

/**
 * Parse user query to extract module code and learning outcome number
 */
export function parseQuizQuery(query: string): {
  moduleCode: string | null;
  learningOutcome: number | null;
  indicativeContent: number | null;
  topic: number | null;
} {
  const lowerQuery = query.toLowerCase();
  
  // Extract learning outcome number
  const loMatch = lowerQuery.match(/(?:learning outcome|lo|outcome)\s+(\d+)/);
  const learningOutcome = loMatch ? parseInt(loMatch[1]) : null;
  
  // Extract indicative content number
  const icMatch = lowerQuery.match(/(?:indicative content|ic|content)\s+(\d+)/);
  const indicativeContent = icMatch ? parseInt(icMatch[1]) : null;
  
  // Extract topic number
  const topicMatch = lowerQuery.match(/(?:topic)\s+(\d+)/);
  const topic = topicMatch ? parseInt(topicMatch[1]) : null;
  
  // Try to find module code in query
  const allCodes = getAllModuleCodes();
  let moduleCode: string | null = null;
  
  for (const code of allCodes) {
    if (lowerQuery.includes(code.toLowerCase())) {
      moduleCode = code;
      break;
    }
  }
  
  return {
    moduleCode,
    learningOutcome,
    indicativeContent,
    topic,
  };
}

/**
 * Build quiz context from parsed query
 */
export function buildQuizContext(query: string, currentModuleCode?: string): {
  contextText: string;
  quizTitle: string;
} | null {
  const parsed = parseQuizQuery(query);
  const moduleCode = parsed.moduleCode || currentModuleCode;
  
  if (!moduleCode) {
    return null;
  }
  
  const module = getModuleByCode(moduleCode);
  if (!module) {
    return null;
  }
  
  // If learning outcome specified
  if (parsed.learningOutcome) {
    const lo = getLearningOutcome(moduleCode, parsed.learningOutcome);
    if (lo) {
      const contextText = formatLearningOutcomeForAI(moduleCode, parsed.learningOutcome) || '';
      return {
        contextText,
        quizTitle: `${module.code} - LO${lo.number}: ${lo.title}`,
      };
    }
  }
  
  // Default: entire module context
  return {
    contextText: formatModuleForAI(module),
    quizTitle: `${module.code}: ${module.title}`,
  };
}

export default curriculum;
