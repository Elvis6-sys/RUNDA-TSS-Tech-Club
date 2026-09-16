/**
 * ENHANCED CURRICULUM SEMANTIC SEARCH (With Full PDF Content)
 * 
 * Searches across all 249 curriculum PDFs using TF-IDF and semantic matching
 * Provides relevant content for RAG (Retrieval-Augmented Generation)
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
    pageNumber?: number;
  };
  source: string;
}

// Department mapping
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
 * Tokenize and clean text
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
}

/**
 * Calculate TF-IDF score
 */
function calculateTFIDF(term: string, document: string[], allDocuments: string[][]): number {
  const termCount = document.filter(word => word === term).length;
  const tf = termCount / (document.length || 1);
  
  const docsWithTerm = allDocuments.filter(doc => doc.includes(term)).length;
  const idf = Math.log((allDocuments.length + 1) / (docsWithTerm + 1));
  
  return tf * idf;
}

/**
 * Calculate relevance score
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
 * Extract best excerpt based on query
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
  
  if (bestSentence.length > maxLength) {
    bestSentence = bestSentence.substring(0, maxLength) + '...';
  }
  
  return bestSentence;
}

/**
 * Search with FULL PDF content (all 249 PDFs, 454K words!)
 */
export function searchCurriculumWithPDFs(
  query: string,
  options: {
    department?: string;
    level?: string;
    moduleCode?: string;
    topK?: number;
  } = {}
): SearchResult[] {
  const { department, level, moduleCode, topK = 10 } = options;
  
  const queryTokens = tokenize(query);
  
  if (queryTokens.length === 0) {
    return [];
  }
  
  console.log(`🔍 RAG: Searching 249 PDFs (454K words) for: "${query.substring(0, 50)}..."`);
  
  // Get all PDF modules
  let pdfModules = (curriculumContentIndex as any).modules || [];
  
  // Filter
  if (moduleCode) {
    pdfModules = pdfModules.filter((m: any) => m.moduleCode === moduleCode);
  }
  if (level) {
    pdfModules = pdfModules.filter((m: any) => m.level === level);
  }
  if (department) {
    pdfModules = pdfModules.filter((m: any) => 
      m.department && m.department.includes(department)
    );
  }
  
  // Prepare documents
  const allDocs = pdfModules.map((m: any) => tokenize(m.fullText || ''));
  
  // Calculate relevance
  const results: SearchResult[] = [];
  
  for (let i = 0; i < pdfModules.length; i++) {
    const module = pdfModules[i];
    const docTokens = allDocs[i];
    
    const relevanceScore = calculateRelevance(queryTokens, docTokens, allDocs);
    
    if (relevanceScore > 0) {
      const excerpt = extractExcerpt(module.fullText || '', queryTokens);
      
      // Find which page has the best match
      let bestPageNum = 1;
      let bestPageScore = 0;
      
      if (module.pages) {
        for (const page of module.pages) {
          const pageTokens = tokenize(page.text);
          const pageMatches = queryTokens.filter(qt => pageTokens.includes(qt)).length;
          
          if (pageMatches > bestPageScore) {
            bestPageScore = pageMatches;
            bestPageNum = page.pageNumber;
          }
        }
      }
      
      results.push({
        moduleCode: module.moduleCode,
        moduleTitle: module.title,
        department: module.department || getDepartment(module.moduleCode),
        level: module.level,
        relevanceScore,
        excerpt,
        context: {
          description: excerpt,
          topics: module.topics || [],
          pageNumber: bestPageNum
        },
        source: `${module.moduleCode} - Page ${bestPageNum}`
      });
    }
  }
  
  // Sort and return top K
  const sorted = results.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, topK);
  
  console.log(`   ✓ Found ${sorted.length} relevant matches`);
  
  return sorted;
}

/**
 * Get comprehensive curriculum context with PDF content
 */
export function getCurriculumContextWithPDFs(
  query: string,
  moduleCode?: string,
  maxResults: number = 5
): string {
  const results = searchCurriculumWithPDFs(query, { moduleCode, topK: maxResults });
  
  if (results.length === 0) {
    return '';
  }
  
  let context = '**📚 Relevant Curriculum Content (From PDFs):**\n\n';
  
  for (const result of results) {
    context += `**[${result.source}] ${result.moduleTitle}** (${result.level} - ${result.department})\n`;
    context += `${result.excerpt}\n\n`;
    
    if (result.context.topics && result.context.topics.length > 0) {
      context += `*Topics covered:* ${result.context.topics.slice(0, 3).join(', ')}\n\n`;
    }
    
    context += `---\n\n`;
  }
  
  return context;
}

// Export original search for backward compatibility
export { searchCurriculumWithPDFs as searchCurriculum };
export { getCurriculumContextWithPDFs as getCurriculumContext };
