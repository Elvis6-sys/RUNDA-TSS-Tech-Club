/**
 * Helper functions for safely parsing JSON strings from database
 * SQLite stores JSON as text, so we need to parse it before using
 */

/**
 * Safely parse tableOfContents from JSON string to array
 */
export function parseTableOfContents(toc: string | null | undefined | any[]): any[] {
  if (!toc) return [];
  
  // Already an array
  if (Array.isArray(toc)) return toc;
  
  // Parse from JSON string
  if (typeof toc === 'string') {
    try {
      const parsed = JSON.parse(toc);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse tableOfContents:', e);
      return [];
    }
  }
  
  // Unknown type
  console.warn('tableOfContents has unexpected type:', typeof toc);
  return [];
}

/**
 * Safely parse blocks from JSON string to Record
 */
export function parseBlocks(blocks: string | null | undefined | Record<string, any>): Record<string, any> {
  if (!blocks) return {};
  
  // Already an object
  if (typeof blocks === 'object' && !Array.isArray(blocks)) {
    return blocks as Record<string, any>;
  }
  
  // Parse from JSON string
  if (typeof blocks === 'string') {
    try {
      const parsed = JSON.parse(blocks);
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
      return {};
    } catch (e) {
      console.error('Failed to parse blocks:', e);
      return {};
    }
  }
  
  // Unknown type
  console.warn('blocks has unexpected type:', typeof blocks);
  return {};
}

/**
 * Safely ensure value is an array
 */
export function ensureArray<T = any>(value: any): T[] {
  if (Array.isArray(value)) return value;
  return [];
}
