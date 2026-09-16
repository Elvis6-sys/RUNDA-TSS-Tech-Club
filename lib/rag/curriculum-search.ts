/**
 * CURRICULUM SEMANTIC SEARCH
 * 
 * Searches across all curriculum modules using TF-IDF and semantic matching
 * Provides relevant content for RAG (Retrieval-Augmented Generation)
 * 
 * Now includes FULL PDF text content from all 249 curriculum PDFs!
 */

import curriculumData from '../curriculum-data/curriculum-all.json';
import curriculumContentIndex from '../curriculum-data/curriculum-content-index.json';

export interface SearchResult {
  moduleCode: string;
  moduleTitle: string;
  department: string;
  level: string;
  relevanceScore: number;
  excerpt: string;
  context: {
    learningOutcome?: string;
    topics?: string[];
    description?: string;
  };
  source: string;
}

interface Module {
  code: string;
  title: string;
  level: string;
  description: string;
  learningOutcomes?: Array<{
    number: number;
    title: string;
    topics: string[];
  }>;
  rawText: string;
}

// Department mapping (inferred from module codes)
const DEPARTMENT_MAP: Record<string, string> = {
  'SWD': 'Software Development',
  'CSA': 'Computer System & Architecture',
  'LSV': 'Land Surveying',
  'BLD': 'Building Construction',
  'GEN': 'General',
  'CCM': 'Cross-Cutting'
};

function getDepartment(moduleCode: string): string {
  const prefix = moduleCode.substring(0, 3);
  return DEPARTMENT_MAP[prefix] || 'General';
}

/**
 * Tokenize and clean text for searching
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2); // Remove very short words
}

/**
 * Calculate TF-IDF score for a term in a document
 */
function calculateTFIDF(term: string, document: string[], allDocuments: string[][]): number {
  // Term Frequency
  const termCount = document.filter(word => word === term).length;
  const tf = termCount / document.length;

  // Inverse Document Frequency
  const docsWithTerm = allDocuments.filter(doc => doc.includes(term)).length;
  const idf = Math.log(allDocuments.length / (docsWithTerm + 1));

  return tf * idf;
}

/**
 * Calculate relevance score between query and document
 */
function calculateRelevance(queryTokens: string[], docTokens: string[], allDocs: string[][]): number {
  let score = 0;

  for (const term of queryTokens) {
    const tfidf = calculateTFIDF(term, docTokens, allDocs);
    score += tfidf;
  }

  return score;
}

/**
 * Extract relevant excerpt from text based on query
 */
function extractExcerpt(text: string, queryTokens: string[], maxLength: number = 300): string {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  let bestSentence = sentences[0] || text.substring(0, maxLength);
  let bestScore = 0;

  for (const sentence of sentences) {
    const sentenceTokens = tokenize(sentence);
    const matches = queryTokens.filter(qt => sentenceTokens.includes(qt)).length;

    if (matches > bestScore) {
      bestScore = matches;
      bestSentence = sentence.trim();
    }
  }

  // Truncate if too long
  if (bestSentence.length > maxLength) {
    bestSentence = bestSentence.substring(0, maxLength) + '...';
  }

  return bestSentence;
}

/**
 * Search curriculum modules
 */
export function searchCurriculum(
  query: string,
  options: {
    department?: string;
    level?: string;
    moduleCode?: string;
    topK?: number;
  } = {}
): SearchResult[] {
  const {
    department,
    level,
    moduleCode,
    topK = 10
  } = options;

  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) {
    return [];
  }

  // Collect all modules
  const allModules: Module[] = [
    ...(curriculumData as any).L3,
    ...(curriculumData as any).L4,
    ...(curriculumData as any).L5
  ];

  // Filter by options
  let filtered = allModules;

  if (moduleCode) {
    filtered = filtered.filter(m => m.code === moduleCode);
  }
  if (level) {
    filtered = filtered.filter(m => m.level === level);
  }
  if (department) {
    filtered = filtered.filter(m => getDepartment(m.code) === department);
  }

  // Prepare all documents for TF-IDF
  const allDocs = filtered.map(m => {
    const text = [
      m.title,
      m.description,
      m.rawText,
      ...(m.learningOutcomes?.map(lo => lo.title) || []),
      ...(m.learningOutcomes?.flatMap(lo => lo.topics) || [])
    ].join(' ');

    return tokenize(text);
  });

  // Calculate relevance for each module
  const results: SearchResult[] = [];

  for (let i = 0; i < filtered.length; i++) {
    const module = filtered[i];
    const docTokens = allDocs[i];

    const relevanceScore = calculateRelevance(queryTokens, docTokens, allDocs);

    if (relevanceScore > 0) {
      // Extract best excerpt
      const fullText = [
        module.description,
        ...(module.learningOutcomes?.map(lo =>
          `${lo.title}: ${lo.topics.join(', ')}`
        ) || [])
      ].join('. ');

      const excerpt = extractExcerpt(fullText, queryTokens);

      results.push({
        moduleCode: module.code,
        moduleTitle: module.title,
        department: getDepartment(module.code),
        level: module.level,
        relevanceScore,
        excerpt,
        context: {
          description: module.description,
          learningOutcome: module.learningOutcomes?.[0]?.title,
          topics: module.learningOutcomes?.flatMap(lo => lo.topics).slice(0, 5)
        },
        source: `${module.code} - ${module.title}`
      });
    }
  }

  // Sort by relevance and return top K
  return results
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, topK);
}

/**
 * Get comprehensive curriculum context for a query
 */
export function getCurriculumContext(
  query: string,
  moduleCode?: string,
  maxResults: number = 5
): string {
  const results = searchCurriculum(query, { moduleCode, topK: maxResults });

  if (results.length === 0) {
    return '';
  }

  let context = '**📚 Relevant Curriculum Content:**\n\n';

  for (const result of results) {
    context += `**[${result.moduleCode}] ${result.moduleTitle}** (${result.level} - ${result.department})\n`;
    context += `${result.excerpt}\n\n`;

    if (result.context.topics && result.context.topics.length > 0) {
      context += `*Key Topics:* ${result.context.topics.slice(0, 3).join(', ')}\n\n`;
    }

    context += `---\n\n`;
  }

  return context;
}

/**
 * Search specific module content
 */
export function searchModuleContent(
  moduleCode: string,
  query: string
): SearchResult | null {
  const results = searchCurriculum(query, { moduleCode, topK: 1 });
  return results.length > 0 ? results[0] : null;
}
