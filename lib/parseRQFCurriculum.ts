/**
 * Universal Intelligent RQF Curriculum Parser
 * 
 * Handles ALL RQF curriculum formats including:
 * - Technical modules (Building, Software, etc.) with ➢, ü markers
 * - General/CCM modules (English, Entrepreneurship, etc.) with ✓ markers
 * - Different indentation and spacing patterns
 * - Various bullet styles and hierarchy levels
 * 
 * 4-Level Hierarchy:
 * 1. Learning Outcomes ("Learning outcome N:")
 * 2. Topics (● char 9679, • char 8226)
 * 3. Subtopics (➢ char 10146, ü char 252, ✓ char 10003, ✔ char 10004)
 * 4. Items (plain text, indented or following subtopics)
 */

export type TOCItem = {
  id: string;
  type: "outcome" | "topic" | "subtopic";
  title: string;
  hours?: number;
  description?: string;
  performanceCriteria?: string[];
  items?: string[];
  parentId?: string;
};

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

// Enhanced marker detection
function isTopicMarker(line: string): boolean {
  if (!line) return false;
  const firstChar = line.charCodeAt(0);
  // • (8226), ● (9679), ▪ (9642), l (108 - lowercase L used in some curricula)
  return firstChar === 8226 || firstChar === 9679 || firstChar === 9642 || firstChar === 108 || /^[•●▪l]/.test(line);
}

function isSubtopicMarker(line: string): boolean {
  if (!line) return false;
  const firstChar = line.charCodeAt(0);
  // ➢ (10146), ü (252), ✓ (10003), ✔ (10004)
  return firstChar === 10146 || firstChar === 252 || firstChar === 10003 || firstChar === 10004 ||
    /^[➢ü✓✔]/.test(line);
}

function isSectionBoundary(line: string): boolean {
  return /^(Resources\s+required|Facilitation\s+techniques|Formative\s+assessment|Summative|Assessment\s+methods?|Learning\s+outcome\s+\d)/i.test(line);
}

function isPageNumber(line: string): boolean {
  return /^\d+\s*\|\s*P\s*a\s*g\s*e/i.test(line) || /^Page\s+\d+/i.test(line);
}

function isEquipmentMaterialsLine(line: string): boolean {
  return /^(Equipment|Materials|Tools)[\s:§]/i.test(line);
}

function looksLikeItem(line: string): boolean {
  // Items are typically:
  // - Short-ish (< 150 chars)
  // - Not all caps
  // - Not section headers
  // - Not page numbers
  // - Start with capital letter or lowercase
  if (!line || line.length > 150 || line.length < 2) return false;
  if (isPageNumber(line)) return false;
  if (isEquipmentMaterialsLine(line)) return false;
  if (isSectionBoundary(line)) return false;
  if (/^[A-Z\s]+$/.test(line) && line.length > 20) return false; // All caps headers
  return true;
}

export function parseRQFCurriculum(curriculumText: string, trackName: string): TOCItem[] | null {
  console.log(`[parseRQFCurriculum] Starting universal parse for "${trackName}", text length: ${curriculumText.length}`);

  const toc: TOCItem[] = [];
  const lines = curriculumText.split('\n');

  console.log(`[parseRQFCurriculum] Split into ${lines.length} lines`);

  let currentLO: TOCItem | null = null;
  let currentTopic: TOCItem | null = null;
  let currentSubtopic: TOCItem | null = null;
  let inIndicativeContent = false;
  let processedLines = 0;

  for (let i = 0; i < lines.length; i++) {
    processedLines++;
    if (processedLines % 200 === 0) {
      console.log(`[parseRQFCurriculum] Processed ${processedLines}/${lines.length} lines, ${toc.length} items so far`);
    }

    const line = lines[i].trim();
    if (!line) continue;

    // ═══ LEVEL 1: Learning Outcome Detection ═══
    // Handle both "Learning outcome 1:" and "1. Learning outcome 1:" and "Unit 1:" formats
    const loMatch = line.match(/(?:^|\b)(\d+)\.\s*Learning\s+[Oo]utcome\s+\1[:：]?\s*(.*)/i) ||
      line.match(/^Learning\s+[Oo]utcome\s+(\d+)[:：]?\s*(.*)/i) ||
      line.match(/^Unit\s+(\d+)[:：]?\s*(.*)/i) ||
      line.match(/^UNIT\s+(\d+)[:：]?\s*(.*)/i);

    if (loMatch) {
      const loNumber = parseInt(loMatch[1]);
      let loTitle = loMatch[2]?.trim() || '';

      // Collect multi-line title
      let titleOffset = 1;
      while (i + titleOffset < lines.length && titleOffset < 5) {
        const nextLine = lines[i + titleOffset].trim();
        if (/^Learning hours?:/i.test(nextLine) || /^Indicative/i.test(nextLine) || /^Intended/i.test(nextLine)) {
          break;
        }
        if (nextLine && nextLine.length > 0 && !isTopicMarker(nextLine) && !isSubtopicMarker(nextLine)) {
          loTitle += ' ' + nextLine;
          titleOffset++;
        } else {
          break;
        }
      }

      loTitle = cleanText(loTitle);

      // Find learning hours
      let hours = 30;
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        const hoursMatch = lines[j].match(/Learning hours?[:：]?\s*(\d+)/i);
        if (hoursMatch) {
          hours = parseInt(hoursMatch[1]);
          break;
        }
      }

      // Find performance criteria
      const performanceCriteria: string[] = [];
      for (let j = Math.max(0, i - 200); j < i; j++) {
        if (/Performance\s+criteria/i.test(lines[j]) || /Elements\s+of\s+competency/i.test(lines[j])) {
          for (let k = j + 1; k < i && k < j + 50; k++) {
            const criteriaLine = lines[k].trim();
            const criteriaMatch = criteriaLine.match(new RegExp(`^${loNumber}\\.\\d+\\.?\\s+(.*)`));
            if (criteriaMatch) {
              let criterion = criteriaMatch[1].trim();
              let m = k + 1;
              while (m < i && m < k + 3) {
                const nextCritLine = lines[m].trim();
                if (/^\d+\.\d+/.test(nextCritLine) || !nextCritLine) break;
                criterion += ' ' + nextCritLine;
                m++;
              }
              performanceCriteria.push(cleanText(criterion));
            }
          }
          if (performanceCriteria.length > 0) break;
        }
      }

      currentLO = {
        id: `lo${loNumber}`,
        type: "outcome",
        title: loTitle || `Learning Outcome ${loNumber}`,
        hours,
        performanceCriteria: performanceCriteria.length > 0 ? performanceCriteria : undefined,
      };
      toc.push(currentLO);
      currentTopic = null;
      currentSubtopic = null;
      inIndicativeContent = false;

      console.log(`[parseRQFCurriculum] Found LO${loNumber}: "${loTitle.substring(0, 50)}..." (${hours}h, ${performanceCriteria.length} criteria)`);
      continue;
    }

    // ═══ Detect Indicative Content Section ═══
    if (/^Indicative\s+[Cc]ontent/i.test(line) || /^Intended\s+Knowledge/i.test(line) || /^Content/i.test(line)) {
      inIndicativeContent = true;
      continue;
    }

    // ═══ Auto-enable indicative content after Learning Outcome if we see topics ═══
    if (currentLO && !inIndicativeContent && (isTopicMarker(line) || isSubtopicMarker(line))) {
      inIndicativeContent = true;
      console.log(`[parseRQFCurriculum] Auto-enabled indicative content parsing for ${currentLO.id}`);
    }

    // ═══ Stop at Section Boundaries ═══
    if (isSectionBoundary(line)) {
      inIndicativeContent = false;
      currentTopic = null;
      currentSubtopic = null;
      continue;
    }

    // ═══ Parse Indicative Content Hierarchy ═══
    if (inIndicativeContent && currentLO) {

      // ─── LEVEL 2: Topics (• or ●) ───
      if (isTopicMarker(line)) {
        let topicTitle = line.substring(1).trim();

        // Collect multi-line topic title
        let titleOffset = 1;
        while (i + titleOffset < lines.length && titleOffset < 3) {
          const nextLine = lines[i + titleOffset].trim();
          if (!nextLine || isTopicMarker(nextLine) || isSubtopicMarker(nextLine) ||
            isSectionBoundary(nextLine)) {
            break;
          }
          // Only add if it doesn't look like a colon-separated header
          if (!nextLine.match(/^[A-Z][a-z]+\s*:/)) {
            topicTitle += ' ' + nextLine;
            titleOffset++;
          } else {
            break;
          }
        }

        topicTitle = cleanText(topicTitle);

        if (topicTitle.length > 2) {
          const topicId = `${currentLO.id}-${slug(topicTitle)}`;
          currentTopic = {
            id: topicId,
            type: "topic",
            title: topicTitle,
            parentId: currentLO.id,
          };
          toc.push(currentTopic);
          currentSubtopic = null;
          console.log(`[parseRQFCurriculum]   Topic: "${topicTitle.substring(0, 50)}..."`);
        }
        continue;
      }

      // ─── LEVEL 3: Subtopics (➢, ü, ✓, ✔) ───
      if (isSubtopicMarker(line) && currentTopic) {
        const subtopicTitle = cleanText(line.substring(1));

        if (subtopicTitle.length > 2) {
          const subtopicId = `${currentTopic.id}-${slug(subtopicTitle)}`;

          // ENHANCED: Collect items with more intelligence
          const items: string[] = [];
          const maxLookAhead = Math.min(50, lines.length - i - 1);

          for (let j = i + 1; j <= i + maxLookAhead; j++) {
            if (j >= lines.length) break;

            const nextLine = lines[j];
            const nextTrimmed = nextLine.trim();

            // Stop at next topic, subtopic, or section
            if (!nextTrimmed || isTopicMarker(nextTrimmed) || isSubtopicMarker(nextTrimmed) ||
              isSectionBoundary(nextTrimmed)) {
              break;
            }

            // Collect items - be more permissive for CCM modules
            if (looksLikeItem(nextTrimmed)) {
              const cleanedItem = cleanText(nextTrimmed.replace(/^[§◦○▪▫\-•]\s*/, ''));
              if (cleanedItem.length > 0) {
                items.push(cleanedItem);
              }
            }
          }

          currentSubtopic = {
            id: subtopicId,
            type: "subtopic",
            title: subtopicTitle,
            parentId: currentTopic.id,
          };

          // Add items (4th level)
          if (items.length > 0) {
            // Remove duplicates and clean up
            const uniqueItems = [...new Set(items)].filter(item => {
              // Filter out noise
              return !isPageNumber(item) &&
                !isEquipmentMaterialsLine(item) &&
                item.length > 1 &&
                item.length < 150;
            });

            if (uniqueItems.length > 0) {
              currentSubtopic.items = uniqueItems;
            }
          }

          toc.push(currentSubtopic);
        }
        continue;
      }
    }
  }

  // ═══ Validation and Quality Check ═══
  const outcomes = toc.filter(t => t.type === "outcome");
  if (outcomes.length === 0) {
    console.log("[parseRQFCurriculum] ❌ No learning outcomes found");
    return null;
  }

  const topics = toc.filter(t => t.type === "topic");
  const subtopics = toc.filter(t => t.type === "subtopic");

  // Count items
  const totalItems = subtopics.reduce((sum, sub) => sum + (sub.items?.length || 0), 0);

  console.log(`[parseRQFCurriculum] ✅ Successfully parsed: ${outcomes.length} outcomes, ${topics.length} topics, ${subtopics.length} subtopics, ${totalItems} items (${toc.length} total nodes)`);

  // Log summary per outcome
  outcomes.forEach(lo => {
    const loTopics = topics.filter(t => t.parentId === lo.id);
    const loSubtopics = subtopics.filter(s => {
      const parentTopic = topics.find(t => t.id === s.parentId);
      return parentTopic?.parentId === lo.id;
    });
    const loItems = loSubtopics.reduce((sum, sub) => sum + (sub.items?.length || 0), 0);
    console.log(`[parseRQFCurriculum]   ${lo.id}: ${loTopics.length} topics, ${loSubtopics.length} subtopics, ${loItems} items`);
  });

  return toc;
}
