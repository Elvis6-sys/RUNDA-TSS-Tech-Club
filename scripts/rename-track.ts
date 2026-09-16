#!/usr/bin/env ts-node
/**
 * Rename seed-track-swdml501 to seed-track-machine-learning-application
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const OLD_ID = 'seed-track-swdml501';
  const NEW_ID = 'seed-track-machine-learning-application';

  console.log(`🔄 Renaming track from ${OLD_ID} to ${NEW_ID}...`);

  // Check if old track exists
  const oldTrack = await prisma.skillTrack.findUnique({
    where: { id: OLD_ID },
    include: { nodes: true }
  });

  if (!oldTrack) {
    console.log(`❌ Track ${OLD_ID} not found`);
    process.exit(1);
  }

  // Check if new track already exists
  const existingNew = await prisma.skillTrack.findUnique({
    where: { id: NEW_ID }
  });

  if (existingNew) {
    console.log(`❌ Track ${NEW_ID} already exists. Delete it first.`);
    process.exit(1);
  }

  // Create new track with same data but new ID
  const newTrack = await prisma.skillTrack.create({
    data: {
      id: NEW_ID,
      name: oldTrack.name,
      description: oldTrack.description,
      tier: oldTrack.tier,
      icon: oldTrack.icon,
      order: oldTrack.order,
      tableOfContents: oldTrack.tableOfContents as any,
      curriculumUrl: oldTrack.curriculumUrl,
      curriculumType: oldTrack.curriculumType,
    }
  });

  console.log(`✅ Created new track: ${newTrack.id}`);

  // Update all nodes to point to new track
  for (const node of oldTrack.nodes) {
    const newNodeId = node.id.replace(OLD_ID, NEW_ID);

    await prisma.skillNode.create({
      data: {
        id: newNodeId,
        trackId: NEW_ID,
        title: node.title,
        description: node.description,
        order: node.order,
        blocks: node.blocks as any,
        estimatedMinutes: node.estimatedMinutes,
        videoUrl: node.videoUrl,
      }
    });

    console.log(`✅ Migrated node: ${newNodeId}`);
  }

  // Delete old track (cascade will delete old nodes)
  await prisma.skillTrack.delete({
    where: { id: OLD_ID }
  });

  console.log(`✅ Deleted old track: ${OLD_ID}`);

  console.log(`\n🎉 MIGRATION COMPLETE!`);
  console.log(`\n🔗 New URL: http://localhost:3001/passport/teach/${NEW_ID}`);
}

main()
  .catch((e) => {
    console.error('❌ ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
