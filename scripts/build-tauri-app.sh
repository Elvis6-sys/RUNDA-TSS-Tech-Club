#!/bin/bash

# Build Tauri Desktop App
# This script builds the complete installable desktop application

set -e

ROOT_DIR="/home/leon/Documents/RUNDA TSS Tech Club"
TAURI_DIR="$ROOT_DIR/runda-secure-exam/src-tauri"

echo "🏗️  Building RUNDA TSS Desktop App"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Bundle content
echo -e "${BLUE}Step 1/4: Bundling content...${NC}"
cd "$ROOT_DIR"
npm run bundle-and-copy
echo -e "${GREEN}✅ Content bundled${NC}"
echo ""

# Step 2: Build Next.js (production)
echo -e "${BLUE}Step 2/4: Building Next.js production...${NC}"
cd "$ROOT_DIR"
npm run build
echo -e "${GREEN}✅ Next.js built${NC}"
echo ""

# Step 3: Check Tauri dependencies
echo -e "${BLUE}Step 3/4: Checking Tauri dependencies...${NC}"
cd "$TAURI_DIR"

# Check for required system libraries
if ! pkg-config --exists webkit2gtk-4.0; then
    echo -e "${YELLOW}⚠️  webkit2gtk-4.0 not found${NC}"
    echo "   Install: sudo apt-get install libwebkit2gtk-4.0-dev"
    echo ""
fi

echo -e "${GREEN}✅ Dependencies checked${NC}"
echo ""

# Step 4: Build Tauri app
echo -e "${BLUE}Step 4/4: Building Tauri installers...${NC}"
echo "This may take 5-10 minutes..."
echo ""

cd "$TAURI_DIR"
cargo tauri build

echo ""
echo "======================================"
echo -e "${GREEN}🎉 Build Complete!${NC}"
echo ""
echo "📦 Installers created:"
echo ""

# Find and list the created installers
if [ -d "$TAURI_DIR/target/release/bundle" ]; then
    echo "Location: $TAURI_DIR/target/release/bundle/"
    echo ""
    
    # List .deb files
    if ls "$TAURI_DIR/target/release/bundle/deb/"*.deb 1> /dev/null 2>&1; then
        echo -e "${GREEN}Debian Package (.deb):${NC}"
        ls -lh "$TAURI_DIR/target/release/bundle/deb/"*.deb
        echo ""
    fi
    
    # List .AppImage files
    if ls "$TAURI_DIR/target/release/bundle/appimage/"*.AppImage 1> /dev/null 2>&1; then
        echo -e "${GREEN}AppImage (Universal Linux):${NC}"
        ls -lh "$TAURI_DIR/target/release/bundle/appimage/"*.AppImage
        echo ""
    fi
    
    # Calculate total size
    TOTAL_SIZE=$(du -sh "$TAURI_DIR/target/release/bundle" | cut -f1)
    echo "Total bundle size: $TOTAL_SIZE"
else
    echo -e "${YELLOW}⚠️  Bundle directory not found${NC}"
fi

echo ""
echo "======================================"
echo -e "${GREEN}✅ Ready to distribute!${NC}"
echo ""
echo "Install .deb:"
echo "  sudo dpkg -i target/release/bundle/deb/*.deb"
echo ""
echo "Run .AppImage:"
echo "  chmod +x target/release/bundle/appimage/*.AppImage"
echo "  ./target/release/bundle/appimage/*.AppImage"
echo ""
