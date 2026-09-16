#!/usr/bin/env node

/**
 * Content Bundling Script for RUNDA TSS Offline App
 * 
 * Exports all course content from PostgreSQL to JSON files
 * for offline access in the Tauri desktop app.
 * 
 * Usage:
 *   node scripts/bundle-content.js
 * 
 * Output:
 *   bundled-content/
 *   ├── manifest.json
 *   ├── tracks.json
 *   ├── nodes.json
 *   ├── blocks.json
 *   ├── lessons.json
 *   ├── quizzes.json
 *   ├── resources.json
 *   └── media/
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs-extra');
const path = require('path');

const prisma = new PrismaClient();

// Configuration
const OUTPUT_DIR = path.join(__dirname, '..', 'bundled-content');
const MEDIA_DIR = path.join(OUTPUT_DIR, 'media');

// Statistics
const stats = {
  tracks: 0,
  nodes: 0,
  blocks: 0,
  lessons: 0,
  quizzes: 0,
  resources: 0,
  media: 0,
  startTime: Date.now(),
};

/**
 * Initialize output directories
 */
async function initDirectories() {
  console.log('📁 Creating output directories...');

  await fs.ensureDir(OUTPUT_DIR);
  await fs.ensureDir(MEDIA_DIR);
  await fs.ensureDir(path.join(MEDIA_DIR, 'thumbnails'));
  await fs.ensureDir(path.join(MEDIA_DIR, 'pdfs'));
  await fs.ensureDir(path.join(MEDIA_DIR, 'images'));

  console.log('✅ Directories created');
}

/**
 * Export Skill Tracks
 */
async function exportTracks() {
  console.log('\n📚 Exporting skill tracks...');

  const tracks = await prisma.skillTrack.findMany({
    include: {
      trainer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      nodes: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          order: true,
        },
      },
    },
    orderBy: { order: 'asc' },
  });

  stats.tracks = tracks.length;

  const outputPath = path.join(OUTPUT_DIR, 'tracks.json');
  await fs.writeJSON(outputPath, tracks, { spaces: 2 });

  console.log(`✅ Exported ${tracks.length} tracks`);
  return tracks;
}

/**
 * Export Skill Nodes
 */
async function exportNodes() {
  console.log('\n🔷 Exporting skill nodes...');

  const nodes = await prisma.skillNode.findMany({
    include: {
      track: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { order: 'asc' },
  });

  // Process nodes to extract block summaries
  const processedNodes = nodes.map(node => ({
    ...node,
    blockCount: node.blocks ? (Array.isArray(node.blocks) ? node.blocks.length : 0) : 0,
  }));

  stats.nodes = nodes.length;

  const outputPath = path.join(OUTPUT_DIR, 'nodes.json');
  await fs.writeJSON(outputPath, processedNodes, { spaces: 2 });

  console.log(`✅ Exported ${nodes.length} nodes`);
  return nodes;
}

/**
 * Export Content Blocks (lessons, quizzes, resources, etc.)
 */
async function exportBlocks() {
  console.log('\n📦 Exporting content blocks...');

  // Note: Based on your schema, blocks are embedded in nodes
  // This function will export a flat list of all blocks for easier access

  const nodes = await prisma.skillNode.findMany({
    select: {
      id: true,
      title: true,
      blocks: true, // JSON field containing blocks
    },
  });

  const allBlocks = [];

  for (const node of nodes) {
    if (node.blocks && Array.isArray(node.blocks)) {
      node.blocks.forEach(block => {
        allBlocks.push({
          ...block,
          nodeId: node.id,
          nodeTitle: node.title,
        });
      });
    }
  }

  stats.blocks = allBlocks.length;

  const outputPath = path.join(OUTPUT_DIR, 'blocks.json');
  await fs.writeJSON(outputPath, allBlocks, { spaces: 2 });

  console.log(`✅ Exported ${allBlocks.length} blocks`);
  return allBlocks;
}

/**
 * Export Lessons
 */
async function exportLessons() {
  console.log('\n📝 Exporting lessons...');

  const lessons = await prisma.lesson.findMany({
    include: {
      trainer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  stats.lessons = lessons.length;

  const outputPath = path.join(OUTPUT_DIR, 'lessons.json');
  await fs.writeJSON(outputPath, lessons, { spaces: 2 });

  console.log(`✅ Exported ${lessons.length} lessons`);
  return lessons;
}

/**
 * Export Quiz Data
 */
async function exportQuizzes() {
  console.log('\n❓ Exporting quiz questions...');

  // Quizzes are embedded in blocks, so we'll extract them
  const nodes = await prisma.skillNode.findMany({
    select: {
      id: true,
      title: true,
      blocks: true,
    },
  });

  const quizzes = [];

  for (const node of nodes) {
    if (node.blocks && Array.isArray(node.blocks)) {
      node.blocks.forEach(block => {
        if (block.type === 'quiz' && block.questions) {
          quizzes.push({
            blockId: block.id,
            nodeId: node.id,
            title: block.title || 'Untitled Quiz',
            description: block.description,
            questions: block.questions,
            passingScore: block.passingScore || 70,
            timeLimit: block.timeLimit,
            attempts: block.attempts,
          });
        }
      });
    }
  }

  stats.quizzes = quizzes.length;

  const outputPath = path.join(OUTPUT_DIR, 'quizzes.json');
  await fs.writeJSON(outputPath, quizzes, { spaces: 2 });

  console.log(`✅ Exported ${quizzes.length} quizzes`);
  return quizzes;
}

/**
 * Export Resources
 */
async function exportResources() {
  console.log('\n📎 Exporting resources...');

  const resources = await prisma.resource.findMany({
    include: {
      trainer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  stats.resources = resources.length;

  const outputPath = path.join(OUTPUT_DIR, 'resources.json');
  await fs.writeJSON(outputPath, resources, { spaces: 2 });

  console.log(`✅ Exported ${resources.length} resources`);
  return resources;
}

/**
 * Copy media files (thumbnails, PDFs, images)
 * Note: This is a placeholder - implement based on your media storage
 */
async function copyMediaFiles(tracks, nodes, resources) {
  console.log('\n🖼️  Copying media files...');

  let mediaCount = 0;

  // Example: Copy track thumbnails
  for (const track of tracks) {
    if (track.thumbnail && track.thumbnail.startsWith('/')) {
      // Local file path
      const sourcePath = path.join(__dirname, '..', 'public', track.thumbnail);
      if (await fs.pathExists(sourcePath)) {
        const destPath = path.join(MEDIA_DIR, 'thumbnails', path.basename(track.thumbnail));
        await fs.copy(sourcePath, destPath);
        mediaCount++;
      }
    }
  }

  // Example: Copy resource PDFs
  for (const resource of resources) {
    if (resource.fileUrl && resource.fileUrl.endsWith('.pdf')) {
      // Handle PDF files
      const sourcePath = path.join(__dirname, '..', 'public', resource.fileUrl);
      if (await fs.pathExists(sourcePath)) {
        const destPath = path.join(MEDIA_DIR, 'pdfs', path.basename(resource.fileUrl));
        await fs.copy(sourcePath, destPath);
        mediaCount++;
      }
    }
  }

  stats.media = mediaCount;
  console.log(`✅ Copied ${mediaCount} media files`);

  // If no local files found, note this
  if (mediaCount === 0) {
    console.log('ℹ️  No local media files found. Media may be hosted externally.');
  }
}

/**
 * Generate manifest file
 */
async function generateManifest() {
  console.log('\n📋 Generating manifest...');

  const manifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    generatedBy: 'bundle-content.js',
    stats: {
      tracks: stats.tracks,
      nodes: stats.nodes,
      blocks: stats.blocks,
      lessons: stats.lessons,
      quizzes: stats.quizzes,
      resources: stats.resources,
      mediaFiles: stats.media,
    },
    files: {
      tracks: 'tracks.json',
      nodes: 'nodes.json',
      blocks: 'blocks.json',
      lessons: 'lessons.json',
      quizzes: 'quizzes.json',
      resources: 'resources.json',
    },
    media: {
      thumbnails: 'media/thumbnails/',
      pdfs: 'media/pdfs/',
      images: 'media/images/',
    },
    checksum: null, // TODO: Add SHA-256 checksum
  };

  const outputPath = path.join(OUTPUT_DIR, 'manifest.json');
  await fs.writeJSON(outputPath, manifest, { spaces: 2 });

  console.log('✅ Manifest generated');
  return manifest;
}

/**
 * Calculate bundle size
 */
async function calculateBundleSize() {
  console.log('\n📊 Calculating bundle size...');

  const getDirectorySize = async (dirPath) => {
    let size = 0;

    if (!await fs.pathExists(dirPath)) return 0;

    const files = await fs.readdir(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) {
        size += await getDirectorySize(filePath);
      } else {
        size += stat.size;
      }
    }

    return size;
  };

  const totalSize = await getDirectorySize(OUTPUT_DIR);
  const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);

  console.log(`📦 Total bundle size: ${sizeMB} MB`);
  return totalSize;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 RUNDA TSS Content Bundling Started\n');
  console.log('='.repeat(50));

  try {
    // Initialize
    await initDirectories();

    // Export data
    const tracks = await exportTracks();
    const nodes = await exportNodes();
    const blocks = await exportBlocks();
    const lessons = await exportLessons();
    const quizzes = await exportQuizzes();
    const resources = await exportResources();

    // Copy media
    await copyMediaFiles(tracks, nodes, resources);

    // Generate manifest
    await generateManifest();

    // Calculate size
    await calculateBundleSize();

    // Summary
    const duration = ((Date.now() - stats.startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(50));
    console.log('✅ Content Bundling Complete!\n');
    console.log('📊 Summary:');
    console.log(`   - Tracks: ${stats.tracks}`);
    console.log(`   - Nodes: ${stats.nodes}`);
    console.log(`   - Blocks: ${stats.blocks}`);
    console.log(`   - Lessons: ${stats.lessons}`);
    console.log(`   - Quizzes: ${stats.quizzes}`);
    console.log(`   - Resources: ${stats.resources}`);
    console.log(`   - Media files: ${stats.media}`);
    console.log(`   - Duration: ${duration}s`);
    console.log(`\n📁 Output: ${OUTPUT_DIR}`);
    console.log('\n🎯 Next: Copy bundled-content/ to runda-secure-exam/src-tauri/');

  } catch (error) {
    console.error('\n❌ Error during bundling:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
