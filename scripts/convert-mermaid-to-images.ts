#!/usr/bin/env ts-node
/**
 * MERMAID TO IMAGE CONVERTER
 * 
 * Finds all text blocks containing mermaid code and converts them to image blocks
 * using Mermaid.ink (free public service) or placeholder images
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ══════════════════════════════════════════════════════════════════════
// 🎨 MERMAID CONVERSION UTILITIES
// ══════════════════════════════════════════════════════════════════════

/**
 * Extract mermaid code from text content
 */
function extractMermaidCode(content: string): string | null {
  // Match ```mermaid ... ``` blocks
  const mermaidMatch = content.match(/```mermaid\n([\s\S]*?)```/);
  if (mermaidMatch) {
    return mermaidMatch[1].trim();
  }
  return null;
}

/**
 * Generate mermaid image URL using mermaid.ink
 * This is a free public service that converts mermaid code to images
 */
function mermaidToImageUrl(mermaidCode: string): string {
  try {
    // Encode mermaid code to base64
    const base64Code = Buffer.from(mermaidCode).toString('base64');
    
    // Use mermaid.ink API
    return `https://mermaid.ink/img/${base64Code}`;
  } catch (error) {
    console.log('   ⚠️  Failed to encode mermaid code, using placeholder');
    return 'https://via.placeholder.com/900x500/1e293b/38bdf8?text=Diagram';
  }
}

/**
 * Extract diagram title/description from text content
 */
function extractDiagramTitle(content: string): string {
  // Look for heading before mermaid block
  const lines = content.split('\n');
  let title = 'Visual Diagram';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('###')) {
      title = line.replace(/^###\s*/, '').replace(/📊|🎨|📈|📉/g, '').trim();
      break;
    } else if (line.startsWith('##')) {
      title = line.replace(/^##\s*/, '').replace(/📊|🎨|📈|📉/g, '').trim();
      break;
    }
  }
  
  return title;
}

/**
 * Create ASCII art alternative for simple diagrams
 */
function createAsciiAlternative(mermaidCode: string): string {
  // Simple ASCII art for common diagram types
  if (mermaidCode.includes('graph') || mermaidCode.includes('flowchart')) {
    return `\`\`\`
┌─────────────┐
│   Start     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Process    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    End      │
└─────────────┘
\`\`\``;
  }
  
  // Default simple diagram
  return `\`\`\`
╔════════════════╗
║   Component 1  ║
╚═══════╤════════╝
        │
        ▼
╔════════════════╗
║   Component 2  ║
╚════════════════╝
\`\`\``;
}

/**
 * Convert a text block with mermaid to an image block
 */
function convertMermaidBlock(block: any): any[] {
  const mermaidCode = extractMermaidCode(block.content);
  
  if (!mermaidCode) {
    return [block]; // No mermaid code, return original
  }
  
  const title = extractDiagramTitle(block.content);
  const imageUrl = mermaidToImageUrl(mermaidCode);
  const asciiArt = createAsciiAlternative(mermaidCode);
  
  console.log(`   🎨 Converting mermaid diagram: "${title}"`);
  
  // Return 2 blocks: ASCII text version + Image version
  return [
    {
      id: `${block.id}-ascii`,
      type: 'text',
      content: `### 📊 ${title}\n\n${asciiArt}\n\n*Visual representation shown below*`
    },
    {
      id: `${block.id}-image`,
      type: 'image',
      url: imageUrl,
      alt: `${title} diagram`,
      caption: `🎨 ${title} - Interactive visualization`
    }
  ];
}

// ══════════════════════════════════════════════════════════════════════
// 🚀 MAIN CONVERSION LOGIC
// ══════════════════════════════════════════════════════════════════════

async function main() {
  const trackId = 'seed-track-blockchain-fundamentals';
  
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('🎨 MERMAID TO IMAGE CONVERTER');
  console.log('   Converting mermaid code blocks to visual diagrams');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  try {
    // Find the node with content
    const node = await prisma.skillNode.findUnique({
      where: { id: trackId },
      select: { id: true, blocks: true }
    });

    if (!node || !node.blocks) {
      console.log('❌ No content found');
      process.exit(1);
    }

    const blocks = node.blocks as Record<string, any[]>;
    const itemKeys = Object.keys(blocks);
    
    console.log(`📦 Found ${itemKeys.length} items with content\n`);
    
    let convertedCount = 0;
    let totalMermaid = 0;
    
    // Process each item's blocks
    for (const itemKey of itemKeys) {
      const itemBlocks = blocks[itemKey];
      
      if (!Array.isArray(itemBlocks)) continue;
      
      // Find text blocks with mermaid code
      const hasMermaid = itemBlocks.some((block: any) => 
        block.type === 'text' && 
        block.content?.includes('```mermaid')
      );
      
      if (!hasMermaid) continue;
      
      console.log(`\n🔍 Processing: ${itemKey}`);
      
      // Convert mermaid blocks to image blocks
      const newBlocks: any[] = [];
      
      for (const block of itemBlocks) {
        if (block.type === 'text' && block.content?.includes('```mermaid')) {
          totalMermaid++;
          const converted = convertMermaidBlock(block);
          newBlocks.push(...converted);
        } else {
          newBlocks.push(block);
        }
      }
      
      // Update the item's blocks
      blocks[itemKey] = newBlocks;
      convertedCount++;
      
      console.log(`   ✅ Converted ${newBlocks.length - itemBlocks.length} mermaid blocks`);
    }
    
    // Save updated blocks to database
    if (convertedCount > 0) {
      console.log(`\n💾 Saving ${convertedCount} updated items...`);
      
      await prisma.skillNode.update({
        where: { id: trackId },
        data: { blocks: blocks as any }
      });
      
      console.log('✅ Saved successfully!\n');
    }
    
    console.log('══════════════════════════════════════════════════════════════════════');
    console.log('✅ CONVERSION COMPLETE');
    console.log(`   Items processed: ${itemKeys.length}`);
    console.log(`   Items with mermaid: ${convertedCount}`);
    console.log(`   Mermaid blocks converted: ${totalMermaid}`);
    console.log(`   New diagram images created: ${totalMermaid}`);
    console.log('\n🎨 Refresh your browser to see the visual diagrams!');
    console.log('   Teacher: http://localhost:3001/passport/teach/seed-track-blockchain-fundamentals');
    console.log('   Student: http://localhost:3001/learn/l5-specific-modules-swdbf501-blockchains-fundamentals');
    console.log('══════════════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
