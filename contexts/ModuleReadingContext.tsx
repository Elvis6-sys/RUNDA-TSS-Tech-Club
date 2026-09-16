'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface ModuleReadingContext {
  // Module metadata
  moduleCode?: string;
  moduleTitle?: string;
  moduleSlug?: string;

  // Current location in module
  currentOutcome?: {
    index: number;
    title: string;
  };
  currentIndicativeContent?: {
    index: number;
    title: string;
  };
  currentTopic?: {
    index: number;
    title: string;
  };
  currentItem?: {
    index: number;
  };

  // Current content blocks
  currentBlocks?: Array<{
    id: string;
    type: string;
    content?: any;
  }>;

  // Progress
  progressPercent?: number;
  completedBlocks?: number;
  totalBlocks?: number;
}

interface ModuleReadingContextType {
  context: ModuleReadingContext | null;
  setContext: (context: ModuleReadingContext | null) => void;
}

const ModuleReadingCtx = createContext<ModuleReadingContextType | undefined>(undefined);

export function ModuleReadingProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<ModuleReadingContext | null>(null);

  return (
    <ModuleReadingCtx.Provider value={{ context, setContext }}>
      {children}
    </ModuleReadingCtx.Provider>
  );
}

export function useModuleReading() {
  const ctx = useContext(ModuleReadingCtx);
  if (ctx === undefined) {
    throw new Error('useModuleReading must be used within ModuleReadingProvider');
  }
  return ctx;
}
