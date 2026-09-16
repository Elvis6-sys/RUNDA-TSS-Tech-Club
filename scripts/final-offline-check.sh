#!/bin/bash

echo "🔍 FINAL OFFLINE READINESS CHECK"
echo "================================="
echo ""

# 1. Check for any external API calls
echo "1️⃣  Checking for external API calls..."
ext_apis=$(grep -r "fetch\(.*http://" app components --include="*.ts" --include="*.tsx" | grep -v "localhost" | grep -v "127.0.0.1" | wc -l)
if [ "$ext_apis" -gt 0 ]; then
    echo "   ❌ Found $ext_apis external API calls:"
    grep -r "fetch\(.*http://" app components --include="*.ts" --include="*.tsx" | grep -v "localhost" | grep -v "127.0.0.1" | head -5
else
    echo "   ✅ No external API calls found"
fi

# 2. Check for Supabase dependencies
echo ""
echo "2️⃣  Checking for Supabase dependencies..."
supabase_count=$(grep -r "createServerSupabase\|createRouteSupabase\|createClientComponentClient\|createBrowserClient\|supabase\.storage\|supabase\.auth\|supabase\.from" app components --include="*.ts" --include="*.tsx" | wc -l)
if [ "$supabase_count" -gt 0 ]; then
    echo "   ❌ Found $supabase_count Supabase references:"
    grep -r "createServerSupabase\|createRouteSupabase\|createClientComponentClient\|createBrowserClient" app components --include="*.ts" --include="*.tsx" | head -5
else
    echo "   ✅ No Supabase dependencies"
fi

# 3. Check for cloud storage references
echo ""
echo "3️⃣  Checking for cloud storage (S3, Azure, etc.)..."
cloud_storage=$(grep -r "s3\.|azure\.|cloudinary\|uploadcare\|imgix" app components --include="*.ts" --include="*.tsx" | wc -l)
if [ "$cloud_storage" -gt 0 ]; then
    echo "   ❌ Found cloud storage references"
else
    echo "   ✅ No cloud storage dependencies"
fi

# 4. Check for WebSocket/Pusher
echo ""
echo "4️⃣  Checking for WebSocket/Realtime services..."
websocket=$(grep -r "WebSocket\|pusher\|socket\.io\|ably\|firebase" app components --include="*.ts" --include="*.tsx" | wc -l)
if [ "$websocket" -gt 0 ]; then
    echo "   ⚠️  Found $websocket WebSocket references (may need review)"
else
    echo "   ✅ No WebSocket dependencies"
fi

# 5. Check database configuration
echo ""
echo "5️⃣  Checking database configuration..."
if grep -q "sqlite" .env; then
    echo "   ✅ SQLite configured in .env"
else
    echo "   ❌ SQLite not found in .env"
fi

# 6. Check for environment variables needing internet
echo ""
echo "6️⃣  Checking for API keys/tokens that need internet..."
api_keys=$(grep -E "OPENAI|ANTHROPIC|GOOGLE_API|STRIPE|PAYPAL|TWILIO|SENDGRID" .env | wc -l)
if [ "$api_keys" -gt 0 ]; then
    echo "   ⚠️  Found $api_keys API keys - features may need internet"
else
    echo "   ✅ No external API keys"
fi

# 7. Test build output exists
echo ""
echo "7️⃣  Checking build output..."
if [ -f ".next/standalone/server.js" ]; then
    echo "   ✅ Build output exists"
else
    echo "   ❌ Build output missing - run npm run build"
fi

# 8. Check SQLite database exists
echo ""
echo "8️⃣  Checking SQLite database..."
if [ -f "prisma/dev.db" ]; then
    db_size=$(du -h prisma/dev.db | cut -f1)
    echo "   ✅ Database exists ($db_size)"
    
    # Check table count
    table_count=$(sqlite3 prisma/dev.db "SELECT COUNT(*) FROM sqlite_master WHERE type='table';" 2>/dev/null)
    echo "   ✅ Tables: $table_count"
else
    echo "   ❌ Database not found"
fi

# 9. Check for curriculum PDFs
echo ""
echo "9️⃣  Checking curriculum PDFs..."
pdf_count=$(find "7 Curriculum" -name "*.pdf" 2>/dev/null | wc -l)
if [ "$pdf_count" -gt 0 ]; then
    echo "   ✅ Found $pdf_count PDF files"
else
    echo "   ⚠️  No PDFs found"
fi

# 10. Check Electron main process
echo ""
echo "🔟  Checking Electron configuration..."
if [ -f "electron/main.js" ]; then
    echo "   ✅ Electron main.js exists"
    if grep -q "getCurrentUser" electron/main.js; then
        echo "   ✅ Uses local auth"
    fi
else
    echo "   ❌ Electron main.js missing"
fi

# 11. Check for Next.js config
echo ""
echo "1️⃣1️⃣  Checking Next.js configuration..."
if grep -q "output.*standalone" next.config.mjs; then
    echo "   ✅ Standalone mode enabled"
else
    echo "   ❌ Standalone mode not configured"
fi

# 12. Final compilation test
echo ""
echo "1️⃣2️⃣  Running TypeScript compilation check..."
npx tsc --noEmit --skipLibCheck 2>&1 | head -20

echo ""
echo "================================="
echo "📊 FINAL SUMMARY"
echo "================================="
echo ""
echo "✅ = Ready for offline"
echo "⚠️  = Review needed"
echo "❌ = Must fix"
echo ""
