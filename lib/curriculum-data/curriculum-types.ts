/**
 * Auto-generated TypeScript types for curriculum data
 * Generated: 2026-08-15T20:54:57.622Z
 */

export interface CurriculumTopic {
  text: string;
}

export interface LearningOutcome {
  number: number;
  title: string;
  topics: string[];
}

export interface IndicativeContent {
  number: number;
  items: string[];
}

export interface Module {
  code: string;
  title: string;
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
  };
  L3: Module[];
  L4: Module[];
  L5: Module[];
}
