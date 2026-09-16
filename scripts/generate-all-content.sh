#!/bin/bash
################################################################################
# MASTER CONTENT GENERATION SCRIPT
# 
# Generates and seeds ALL 600+ learning outcomes across all 4 departments
# 
# Usage:
#   ./scripts/generate-all-content.sh [--module MODULE_CODE] [--dry-run]
# 
# Examples:
#   ./scripts/generate-all-content.sh                    # Generate ALL modules
#   ./scripts/generate-all-content.sh --module SWDML501  # Single module
#   ./scripts/generate-all-content.sh --dry-run          # Preview only
################################################################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CURRICULUM_FILE="$ROOT_DIR/lib/curriculum-data/curriculum-all.json"
GENERATED_DIR="$ROOT_DIR/generated-content"
LOG_FILE="$ROOT_DIR/generation.log"

# Parse arguments
MODULE_CODE=""
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --module)
      MODULE_CODE="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Banner
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🤖 AUTOMATED CONTENT GENERATION SYSTEM${NC}"
echo -e "${BLUE}   AI-Powered Curriculum Content at Scale${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"

if [ ! -f "$CURRICULUM_FILE" ]; then
  echo -e "${RED}❌ Curriculum file not found: $CURRICULUM_FILE${NC}"
  exit 1
fi

if [ -z "$OPENAI_API_KEY" ]; then
  echo -e "${RED}❌ OPENAI_API_KEY not set in environment${NC}"
  echo -e "${YELLOW}💡 Add API keys to .env file (comma-separated for rotation)${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Prerequisites OK${NC}"
echo ""

# Load module list
if [ -n "$MODULE_CODE" ]; then
  MODULES=($MODULE_CODE)
  echo -e "${YELLOW}📚 Target: Single module ($MODULE_CODE)${NC}"
else
  # Extract all module codes from curriculum
  MODULES=($(jq -r 'keys[]' "$CURRICULUM_FILE"))
  echo -e "${YELLOW}📚 Target: ALL ${#MODULES[@]} modules${NC}"
fi

echo -e "${BLUE}Modules to process:${NC}"
for mod in "${MODULES[@]}"; do
  LO_COUNT=$(jq -r ".\"$mod\".learningOutcomes | length" "$CURRICULUM_FILE")
  TITLE=$(jq -r ".\"$mod\".title" "$CURRICULUM_FILE")
  echo -e "   • $mod: $TITLE ($LO_COUNT LOs)"
done
echo ""

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}🏁 DRY RUN MODE - No actual generation${NC}"
  exit 0
fi

# Confirm
echo -e "${YELLOW}⚠️  This will generate content for ${#MODULES[@]} modules${NC}"
echo -e "${YELLOW}   Estimated time: ~2-5 minutes per learning outcome${NC}"
echo -e "${YELLOW}   Total cost: ~\$0.05-0.15 per learning outcome (GPT-4)${NC}"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}❌ Cancelled by user${NC}"
  exit 0
fi

# Create output directory
mkdir -p "$GENERATED_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# Start generation
echo -e "${GREEN}🚀 Starting content generation...${NC}"
echo "" | tee "$LOG_FILE"

TOTAL_MODULES=${#MODULES[@]}
CURRENT=0
FAILED_MODULES=()

for MODULE in "${MODULES[@]}"; do
  ((CURRENT++))
  echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}[$CURRENT/$TOTAL_MODULES] Processing: $MODULE${NC}"
  echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
  
  # Step 1: Generate content with AI
  echo -e "${YELLOW}📝 Step 1: AI Content Generation${NC}"
  if npx ts-node --compiler-options '{"module":"CommonJS","esModuleInterop":true}' \
      "$SCRIPT_DIR/ai-content-generator.ts" "$MODULE" 2>&1 | tee -a "$LOG_FILE"; then
    echo -e "${GREEN}✅ Content generated successfully${NC}"
  else
    echo -e "${RED}❌ Failed to generate content for $MODULE${NC}"
    FAILED_MODULES+=("$MODULE")
    continue
  fi
  
  # Step 2: Seed to database
  echo -e "${YELLOW}💾 Step 2: Database Seeding${NC}"
  if npx ts-node --compiler-options '{"module":"CommonJS","esModuleInterop":true}' \
      "$SCRIPT_DIR/batch-content-seeder.ts" "$MODULE" 2>&1 | tee -a "$LOG_FILE"; then
    echo -e "${GREEN}✅ Content seeded to database${NC}"
  else
    echo -e "${RED}❌ Failed to seed content for $MODULE${NC}"
    FAILED_MODULES+=("$MODULE")
  fi
  
  echo ""
  
  # Rate limiting: pause between modules
  if [ $CURRENT -lt $TOTAL_MODULES ]; then
    echo -e "${YELLOW}⏳ Pausing 5 seconds before next module...${NC}"
    sleep 5
  fi
done

# Final summary
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 BATCH GENERATION COMPLETE${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}📊 Summary:${NC}"
echo -e "   • Modules Processed: $TOTAL_MODULES"
echo -e "   • Successful: $((TOTAL_MODULES - ${#FAILED_MODULES[@]}))"
echo -e "   • Failed: ${#FAILED_MODULES[@]}"

if [ ${#FAILED_MODULES[@]} -gt 0 ]; then
  echo -e "${RED}   Failed modules: ${FAILED_MODULES[*]}${NC}"
fi

echo ""
echo -e "${GREEN}📁 Generated content location: $GENERATED_DIR${NC}"
echo -e "${GREEN}📋 Full log: $LOG_FILE${NC}"
echo ""
echo -e "${GREEN}✨ Content is now available in the teacher interface!${NC}"
echo -e "${BLUE}   Access at: http://localhost:3001/passport/teach${NC}"
echo ""
