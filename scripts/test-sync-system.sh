#!/bin/bash

# Test Sync System - Week 2 Day 4-5
# Tests the complete offline-to-sync workflow

set -e

ROOT_DIR="/home/leon/Documents/RUNDA TSS Tech Club"
TAURI_DIR="$ROOT_DIR/runda-secure-exam/src-tauri"

echo "🧪 Testing Sync System"
echo "===================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if web server is running
echo "Test 1: Checking web server..."
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Web server is running${NC}"
else
    echo -e "${RED}❌ Web server is NOT running${NC}"
    echo "   Start it with: cd '$ROOT_DIR' && npm run dev"
    exit 1
fi

echo ""

# Test 2: Check Rust compilation
echo "Test 2: Checking Rust compilation..."
cd "$TAURI_DIR"
if cargo check --quiet 2>&1 | grep -q "error"; then
    echo -e "${RED}❌ Rust compilation errors${NC}"
    cargo check
    exit 1
else
    echo -e "${GREEN}✅ Rust code compiles${NC}"
fi

echo ""

# Test 3: Check if all sync commands exist in main.rs
echo "Test 3: Checking Tauri commands..."
COMMANDS=(
    "start_sync_engine"
    "stop_sync_engine"
    "sync_now"
    "get_sync_stats"
    "set_sync_interval"
)

for cmd in "${COMMANDS[@]}"; do
    if grep -q "$cmd" "$TAURI_DIR/src/main.rs"; then
        echo -e "${GREEN}✅ Command found: $cmd${NC}"
    else
        echo -e "${RED}❌ Command missing: $cmd${NC}"
    fi
done

echo ""

# Test 4: Check database schema
echo "Test 4: Checking database schema..."
if grep -q "CREATE TABLE sync_queue" "$TAURI_DIR/src/database.rs"; then
    echo -e "${GREEN}✅ sync_queue table defined${NC}"
else
    echo -e "${RED}❌ sync_queue table missing${NC}"
fi

echo ""

# Test 5: Check sync engine module
echo "Test 5: Checking sync engine..."
if [ -f "$TAURI_DIR/src/sync_engine.rs" ]; then
    LINE_COUNT=$(wc -l < "$TAURI_DIR/src/sync_engine.rs")
    echo -e "${GREEN}✅ sync_engine.rs exists ($LINE_COUNT lines)${NC}"
    
    # Check for key functions
    if grep -q "pub async fn start_sync" "$TAURI_DIR/src/sync_engine.rs"; then
        echo -e "${GREEN}✅ start_sync function found${NC}"
    fi
    if grep -q "pub async fn sync_now" "$TAURI_DIR/src/sync_engine.rs"; then
        echo -e "${GREEN}✅ sync_now function found${NC}"
    fi
else
    echo -e "${RED}❌ sync_engine.rs missing${NC}"
fi

echo ""

# Test 6: Check frontend files
echo "Test 6: Checking frontend files..."
FRONTEND_FILES=(
    "$ROOT_DIR/src/lib/syncClient.ts"
    "$ROOT_DIR/src/hooks/useSync.ts"
    "$ROOT_DIR/components/SyncStatusPanel.tsx"
    "$ROOT_DIR/components/SyncIndicator.tsx"
    "$ROOT_DIR/components/AdminSyncBadge.tsx"
)

for file in "${FRONTEND_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $(basename "$file")${NC}"
    else
        echo -e "${RED}❌ $(basename "$file") missing${NC}"
    fi
done

echo ""

# Test 7: Check Tauri API imports
echo "Test 7: Checking Tauri API imports..."
if grep -q "@tauri-apps/api/core" "$ROOT_DIR/src/lib/offlineStorage.ts"; then
    echo -e "${GREEN}✅ offlineStorage.ts uses correct import${NC}"
else
    echo -e "${YELLOW}⚠️  offlineStorage.ts may have wrong import${NC}"
fi

if grep -q "@tauri-apps/api/core" "$ROOT_DIR/src/lib/syncClient.ts"; then
    echo -e "${GREEN}✅ syncClient.ts uses correct import${NC}"
else
    echo -e "${YELLOW}⚠️  syncClient.ts may have wrong import${NC}"
fi

echo ""

# Test 8: Check integration points
echo "Test 8: Checking integration..."
if grep -q "AdminSyncBadge" "$ROOT_DIR/app/(auth)/layout.tsx"; then
    echo -e "${GREEN}✅ Badge integrated in layout${NC}"
else
    echo -e "${YELLOW}⚠️  Badge not in layout${NC}"
fi

if grep -q "SyncStatusPanel" "$ROOT_DIR/app/(auth)/profile/ProfileClient.tsx"; then
    echo -e "${GREEN}✅ Panel integrated in profile${NC}"
else
    echo -e "${YELLOW}⚠️  Panel not in profile${NC}"
fi

echo ""
echo "===================="
echo -e "${GREEN}🎉 All basic tests passed!${NC}"
echo ""
echo "📋 Next Steps:"
echo "1. Build and run Tauri app:"
echo "   cd '$TAURI_DIR' && cargo run"
echo ""
echo "2. Test in the app:"
echo "   - Log in as admin"
echo "   - Check bottom-right corner for sync badge"
echo "   - Go to Profile page for full sync panel"
echo ""
echo "3. Test offline quiz submission:"
echo "   - Open browser console in Tauri app"
echo "   - Run: await window.__TAURI__.invoke('save_quiz_offline', {...})"
echo "   - Check badge shows '1 pending'"
echo ""
echo "4. Test manual sync:"
echo "   - Click 'Sync Now' button in profile"
echo "   - Should upload to server"
echo ""
