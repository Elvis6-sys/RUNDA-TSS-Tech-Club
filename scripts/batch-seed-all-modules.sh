#!/bin/bash
# CURRICULUM INTELLIGENCE SYSTEM - PDF-to-Content Pipeline
# Automatically analyzes ANY RTB/TVET curriculum PDF and generates ultra-modern content

echo "════════════════════════════════════════════════════════════════"
echo "🧠 CURRICULUM INTELLIGENCE - PDF-to-Content Pipeline"
echo "════════════════════════════════════════════════════════════════"
echo ""

cd "/home/leon/Documents/RUNDA TSS Tech Club"

# Configuration
PROMPT_FILE="prompts/ultra-modern-content-prompt-v2.md"
LOG_DIR="logs/content-generation"
mkdir -p "$LOG_DIR"

# List of all RQF Level 5 modules to seed
MODULES=(
  # Software Development Modules
  "seed-track-blockchain-fundamentals"           # SWDBF501 - Blockchain
  "seed-track-machine-learning"                  # SWDML501 - Machine Learning (if exists)
  "seed-track-version-control"                   # SWDVC501 - Version Control (if exists)
  # Add more module track IDs here
)

# Track generation stats
TOTAL_MODULES=${#MODULES[@]}
SUCCESS_COUNT=0
FAIL_COUNT=0
START_TIME=$(date +%s)

echo "📚 Modules to seed: $TOTAL_MODULES"
echo "🎨 Using prompt: $PROMPT_FILE"
echo "📝 Logs: $LOG_DIR"
echo ""

# Loop through each module
for i in "${!MODULES[@]}"; do
  MODULE_ID="${MODULES[$i]}"
  MODULE_NUM=$((i + 1))
  LOG_FILE="$LOG_DIR/${MODULE_ID}_$(date +%Y%m%d_%H%M%S).log"
  
  echo "════════════════════════════════════════════════════════════════"
  echo "[$MODULE_NUM/$TOTAL_MODULES] Seeding: $MODULE_ID"
  echo "════════════════════════════════════════════════════════════════"
  echo ""
  
  # Check if track exists
  TRACK_EXISTS=$(npx ts-node --compiler-options '{"module":"CommonJS","esModuleInterop":true}' << EOF
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function check() {
  const track = await prisma.skillTrack.findUnique({ where: { id: '$MODULE_ID' } });
  console.log(track ? 'yes' : 'no');
  await prisma.\$disconnect();
}
check().catch(() => console.log('no'));
EOF
)
  
  if [ "$TRACK_EXISTS" != "yes" ]; then
    echo "⚠️  Track not found: $MODULE_ID - Skipping"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    echo ""
    continue
  fi
  
  echo "✅ Track found"
  echo "🤖 Starting content generation..."
  echo ""
  
  # Generate content for ALL 4 levels
  # Use --lo1-only flag for testing (remove for full generation)
  npm run hierarchical-generate full "$MODULE_ID" 2>&1 | tee "$LOG_FILE"
  
  EXIT_CODE=${PIPESTATUS[0]}
  
  if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Successfully seeded: $MODULE_ID"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    echo "❌ Failed to seed: $MODULE_ID"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
  
  echo ""
  echo "💤 Cooldown (10 seconds)..."
  sleep 10
  echo ""
done

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))
ELAPSED_MIN=$((ELAPSED / 60))

echo "════════════════════════════════════════════════════════════════"
echo "🎉 BATCH SEEDING COMPLETE!"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📊 Summary:"
echo "   • Total modules: $TOTAL_MODULES"
echo "   • Success: $SUCCESS_COUNT"
echo "   • Failed: $FAIL_COUNT"
echo "   • Time: ${ELAPSED_MIN} minutes"
echo ""
echo "📝 Logs saved to: $LOG_DIR"
echo ""
echo "🔗 View modules at: http://localhost:3001/passport/teach"
echo ""
