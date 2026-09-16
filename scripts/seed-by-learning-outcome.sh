#!/bin/bash
# SEED MODULES LEARNING OUTCOME BY LEARNING OUTCOME
# This is the RECOMMENDED approach: Generate & review LO1, then LO2, then LO3, etc.
# Allows teachers to review/edit after each LO before proceeding

echo "════════════════════════════════════════════════════════════════"
echo "🎯 LEARNING OUTCOME SEEDING - Incremental Approach"
echo "════════════════════════════════════════════════════════════════"
echo ""

cd "/home/leon/Documents/RUNDA TSS Tech Club"

# Configuration
MODULE_ID="$1"
LO_ID="$2"  # e.g., lo1, lo2, lo3, lo4

if [ -z "$MODULE_ID" ] || [ -z "$LO_ID" ]; then
  echo "Usage: ./seed-by-learning-outcome.sh <MODULE_ID> <LO_ID>"
  echo ""
  echo "Examples:"
  echo "  ./seed-by-learning-outcome.sh seed-track-blockchain-fundamentals lo1"
  echo "  ./seed-by-learning-outcome.sh seed-track-blockchain-fundamentals lo2"
  echo ""
  echo "💡 Recommended workflow:"
  echo "  1. Generate LO1: ./seed-by-learning-outcome.sh <module> lo1"
  echo "  2. Review content at: http://localhost:3001/passport/teach/<module>"
  echo "  3. Teachers edit/approve content"
  echo "  4. Generate LO2: ./seed-by-learning-outcome.sh <module> lo2"
  echo "  5. Repeat for all LOs"
  exit 1
fi

echo "📚 Module: $MODULE_ID"
echo "🎯 Learning Outcome: $LO_ID"
echo ""

# Check if LO content already exists
EXISTING_COUNT=$(npx ts-node --compiler-options '{"module":"CommonJS","esModuleInterop":true}' << EOF
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function count() {
  const nodes = await prisma.skillNode.findMany({
    where: { 
      trackId: '$MODULE_ID',
      tocNodeId: { startsWith: '$LO_ID' }
    }
  });
  console.log(nodes.length);
  await prisma.\$disconnect();
}
count().catch(() => console.log('0'));
EOF
)

if [ "$EXISTING_COUNT" -gt 0 ]; then
  echo "⚠️  Warning: Found $EXISTING_COUNT existing nodes for $LO_ID"
  echo ""
  read -p "   Clear and regenerate? (y/N): " CONFIRM
  if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "   Cancelled."
    exit 0
  fi
  
  echo "   🗑️  Clearing existing $LO_ID content..."
  npx ts-node --compiler-options '{"module":"CommonJS","esModuleInterop":true}' << EOF
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function clear() {
  await prisma.skillNode.deleteMany({
    where: { 
      trackId: '$MODULE_ID',
      tocNodeId: { startsWith: '$LO_ID' }
    }
  });
  await prisma.\$disconnect();
}
clear().catch(console.error);
EOF
  echo "   ✅ Cleared"
  echo ""
fi

# Count nodes to be generated
NODE_COUNT=$(npx ts-node --compiler-options '{"module":"CommonJS","esModuleInterop":true}' << EOF
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function count() {
  const track = await prisma.skillTrack.findUnique({ where: { id: '$MODULE_ID' } });
  if (!track) {
    console.log('0');
    return;
  }
  const toc = track.tableOfContents as any[];
  const lo = toc.find((t: any) => t.id === '$LO_ID');
  if (!lo) {
    console.log('0');
    return;
  }
  
  // Count all descendants
  let total = 1; // The LO itself
  const topics = toc.filter((t: any) => t.parentId === '$LO_ID');
  total += topics.length;
  
  topics.forEach((topic: any) => {
    const subtopics = toc.filter((t: any) => t.parentId === topic.id);
    total += subtopics.length;
    
    subtopics.forEach((sub: any) => {
      const items = toc.filter((t: any) => t.parentId === sub.id);
      total += items.length;
    });
  });
  
  console.log(total);
  await prisma.\$disconnect();
}
count().catch(() => console.log('0'));
EOF
)

if [ "$NODE_COUNT" -eq 0 ]; then
  echo "❌ Error: Learning Outcome '$LO_ID' not found in module"
  exit 1
fi

echo "📊 Nodes to generate: $NODE_COUNT"
echo "⏱️  Estimated time: ~$((NODE_COUNT * 15 / 60)) minutes"
echo ""
echo "🚀 Starting generation..."
echo ""

# Generate content
npm run hierarchical-generate full "$MODULE_ID" null "$LO_ID"

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
  echo "════════════════════════════════════════════════════════════════"
  echo "✅ $LO_ID SEEDING COMPLETE!"
  echo "════════════════════════════════════════════════════════════════"
  echo ""
  echo "🔗 Review at: http://localhost:3001/passport/teach/$MODULE_ID"
  echo ""
  echo "📝 Next steps:"
  echo "  1. Review generated content in the web UI"
  echo "  2. Teachers can edit/enhance content as needed"
  echo "  3. Once satisfied, run next LO:"
  echo "     ./seed-by-learning-outcome.sh $MODULE_ID lo$((${LO_ID:2} + 1))"
  echo ""
else
  echo "════════════════════════════════════════════════════════════════"
  echo "❌ SEEDING FAILED"
  echo "════════════════════════════════════════════════════════════════"
  echo ""
  echo "Check logs above for errors"
  echo ""
fi
