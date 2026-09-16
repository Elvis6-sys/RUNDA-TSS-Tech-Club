#!/usr/bin/env tsx
/**
 * Fix absolute filesystem paths to web-accessible URLs
 * 
 * Copies PDFs from absolute paths to public/uploads/projects/
 * and updates database with correct URLs
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function fixCurriculumPaths() {
  console.log('🔍 Finding tracks with absolute file paths...\n');
  
  const tracks = await prisma.skillTrack.findMany({
    where: {
      curriculumUrl: { startsWith: '/home/leon/' }
    },
    select: { id: true, name: true, curriculumUrl: true }
  });

  console.log(`Found ${tracks.length} tracks to fix\n`);

  const uploadDir = path.join(process.cwd(), 'public/uploads/projects');
  
  // Ensure upload directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (const track of tracks) {
    try {
      const oldPath = track.curriculumUrl!;
      
      // Check if source file exists
      if (!fs.existsSync(oldPath)) {
        console.log(`❌ File not found: ${track.name}`);
        console.log(`   Path: ${oldPath}\n`);
        errorCount++;
        errors.push(`${track.name}: File not found`);
        continue;
      }

      // Generate new filename with UUID prefix
      const originalFilename = path.basename(oldPath);
      const uuid = crypto.randomUUID();
      const timestamp = Date.now();
      const newFilename = `${uuid}_${timestamp}_${originalFilename}`;
      const newPath = path.join(uploadDir, newFilename);

      // Copy file to new location
      fs.copyFileSync(oldPath, newPath);

      // Update database with web-accessible URL
      const newUrl = `/uploads/projects/${newFilename}`;
      await prisma.skillTrack.update({
        where: { id: track.id },
        data: { curriculumUrl: newUrl }
      });

      console.log(`✅ ${track.name}`);
      console.log(`   From: ${oldPath}`);
      console.log(`   To:   ${newUrl}\n`);
      successCount++;

    } catch (err: any) {
      console.log(`❌ Failed: ${track.name}`);
      console.log(`   Error: ${err.message}\n`);
      errorCount++;
      errors.push(`${track.name}: ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Success: ${successCount} files`);
  console.log(`❌ Errors:  ${errorCount} files`);
  console.log('='.repeat(60));

  if (errors.length > 0) {
    console.log('\n📋 Error Summary:');
    errors.forEach(err => console.log(`  - ${err}`));
  }

  await prisma.$disconnect();
}

fixCurriculumPaths().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
