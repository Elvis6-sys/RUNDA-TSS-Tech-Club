#!/bin/bash

# Automated migration: Replace all Supabase auth with local auth in API routes

echo "🔧 Migrating ALL API routes to local authentication..."
echo ""

# Find all TypeScript files in app/api
find app/api -name "*.ts" -type f | while read file; do
    # Check if file contains Supabase auth
    if grep -q "createServerSupabase\|createRouteSupabase" "$file"; then
        echo "📝 Migrating: $file"
        
        # Backup original
        cp "$file" "$file.bak"
        
        # Replace imports
        sed -i 's/import { createServerSupabase } from "@\/lib\/supabase-server";/import { getCurrentUser } from "@\/lib\/local-auth";/g' "$file"
        sed -i 's/import { createRouteSupabase } from "@\/lib\/supabase-server";/import { getCurrentUser } from "@\/lib\/local-auth";/g' "$file"
        
        # Replace auth calls - Method 1: getUser()
        sed -i 's/const supabase = createServerSupabase();/\/\/ Local auth/g' "$file"
        sed -i 's/const supabase = createRouteSupabase();/\/\/ Local auth/g' "$file"
        sed -i 's/const { data: { user } } = await supabase\.auth\.getUser();/const user = await getCurrentUser();/g' "$file"
        sed -i 's/const { data: { user } } = await supabase\.auth\.getSession();/const user = await getCurrentUser();/g' "$file"
        
        # Method 2: getSession()
        sed -i 's/const { data: { session } } = await supabase\.auth\.getSession();/const user = await getCurrentUser();/g' "$file"
        sed -i 's/session\.user\.id/user.id/g' "$file"
        sed -i 's/session\.user/user/g' "$file"
        sed -i 's/if (!session)/if (!user)/g' "$file"
        
        echo "   ✅ Migrated"
    fi
done

echo ""
echo "✅ Migration complete!"
echo ""
echo "🔍 Verifying..."
remaining=$(grep -r "createServerSupabase\|createRouteSupabase" app/api --include="*.ts" | wc -l)
echo "   Remaining Supabase calls: $remaining"

if [ "$remaining" -gt 0 ]; then
    echo ""
    echo "⚠️  Some files still have Supabase - manual review needed:"
    grep -r "createServerSupabase\|createRouteSupabase" app/api --include="*.ts" | cut -d: -f1 | sort | uniq
fi
