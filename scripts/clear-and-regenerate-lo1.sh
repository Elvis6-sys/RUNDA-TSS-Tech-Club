#!/bin/bash
# Clear existing blockchain content and regenerate LO1 with ultra-modern content

echo "════════════════════════════════════════════════════════════════"
echo "🧹 CLEARING BLOCKCHAIN CONTENT & REGENERATING LO1 (MODERN)"
echo "════════════════════════════════════════════════════════════════"
echo ""

cd "/home/leon/Documents/RUNDA TSS Tech Club"

# Step 1: Stop any running generation
echo "1️⃣  Stopping any running generation..."
pkill -f "hierarchical-generate" || true
sleep 2

# Step 2: Delete existing SkillNodes for blockchain
echo "2️⃣  Clearing existing blockchain content from database..."
npx ts-node --compiler-options '{"module":"CommonJS","esModuleInterop":true}' << 'EOF'
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clear() {
  const result = await prisma.skillNode.deleteMany({
    where: { trackId: 'seed-track-blockchain-fundamentals' }
  });
  
  console.log(`   ✅ Deleted ${result.count} existing nodes`);
  await prisma.$disconnect();
}

clear().catch(console.error);
EOF

echo ""
echo "3️⃣  Preparing ultra-modern content generation..."
echo "   Using: /prompts/ultra-modern-content-prompt.md"
echo ""

# Step 3: Update generator to use ultra-modern prompt
sed -i 's/content-generation-system-prompt-compact.md/ultra-modern-content-prompt.md/g' scripts/premium-content-generator-hierarchical.ts

echo "4️⃣  Extracting LO1 nodes from TOC..."
npx ts-node --compiler-options '{"module":"CommonJS","esModuleInterop":true}' << 'EOF'
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function analyze() {
  const track = await prisma.skillTrack.findUnique({
    where: { id: 'seed-track-blockchain-fundamentals' }
  });
  
  if (!track) return;
  
  const toc = track.tableOfContents as any[];
  const lo1 = toc.find((t: any) => t.type === 'outcome' && t.id === 'lo1');
  const topics = toc.filter((t: any) => t.type === 'topic' && t.parentId === 'lo1');
  const subtopics = toc.filter((t: any) => {
    const topic = topics.find((tp: any) => tp.id === t.parentId);
    return topic && t.type === 'subtopic';
  });
  const items = toc.filter((t: any) => {
    const subtopic = subtopics.find((s: any) => s.id === t.parentId);
    return subtopic && t.type === 'item';
  });
  
  console.log(`   LO1: "${lo1?.title}"`);
  console.log(`   ├─ Topics (Level 2): ${topics.length}`);
  console.log(`   ├─ Subtopics (Level 3): ${subtopics.length}`);
  console.log(`   └─ Items (Level 4): ${items.length}`);
  console.log(`   TOTAL: ${1 + topics.length + subtopics.length + items.length} nodes`);
  
  await prisma.$disconnect();
}

analyze().catch(console.error);
EOF

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ READY TO GENERATE ULTRA-MODERN LO1 CONTENT"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Run these commands in order:"
echo ""
echo "# Level 1 (LO1 Overview) - ~30 seconds"
echo "npm run hierarchical-generate full seed-track-blockchain-fundamentals 1"
echo ""
echo "# Level 2 (Topics under LO1) - ~2 minutes"
echo "# (Will auto-filter to LO1 topics only)"
echo "npm run hierarchical-generate full seed-track-blockchain-fundamentals 2"
echo ""
echo "# Level 3 (Subtopics under LO1) - ~3 minutes"
echo "npm run hierarchical-generate full seed-track-blockchain-fundamentals 3"
echo ""
echo "# Level 4 (Items under LO1) - ~8 minutes"
echo "npm run hierarchical-generate full seed-track-blockchain-fundamentals 4"
echo ""
echo "OR generate all at once (~15 minutes):"
echo "npm run hierarchical-generate full seed-track-blockchain-fundamentals"
echo ""
