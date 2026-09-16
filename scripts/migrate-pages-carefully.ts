/**
 * Carefully migrate pages from Supabase to local auth
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);
  files.forEach((file) => {
    const filePath = join(dir, file);
    if (statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

function migratePage(filePath: string): boolean {
  let content = readFileSync(filePath, 'utf-8');
  
  // Check if already migrated
  if (!content.includes('createServerSupabase') && !content.includes('createRouteSupabase')) {
    return false;
  }
  
  console.log(`📝 Migrating: ${filePath}`);
  
  // Replace imports
  content = content.replace(
    /import\s+{\s*createServerSupabase\s*}\s+from\s+["']@\/lib\/supabase-server["'];?/g,
    'import { getCurrentUser } from "@/lib/local-auth";'
  );
  
  // Replace Supabase init + getSession pattern
  content = content.replace(
    /const supabase = createServerSupabase\(\);\s*const\s*{\s*data:\s*{\s*session\s*}\s*}\s*=\s*await supabase\.auth\.getSession\(\);/g,
    'const user = await getCurrentUser();'
  );
  
  // Replace Supabase init + getUser pattern
  content = content.replace(
    /const supabase = createServerSupabase\(\);\s*const\s*{\s*data:\s*{\s*user\s*}\s*}\s*=\s*await supabase\.auth\.getUser\(\);/g,
    'const user = await getCurrentUser();'
  );
  
  // Replace session checks
  content = content.replace(/if\s*\(\s*!session\s*\)/g, 'if (!user)');
  content = content.replace(/session\.user\.id/g, 'user.id');
  content = content.replace(/session\.user/g, 'user');
  
  writeFileSync(filePath, content, 'utf-8');
  return true;
}

// Migrate all pages in app directory
const appDir = join(process.cwd(), 'app');
const allFiles = getAllFiles(appDir);

let migratedCount = 0;
allFiles.forEach((file) => {
  if (migratePage(file)) {
    migratedCount++;
  }
});

console.log(`\n✅ Migrated ${migratedCount} pages`);
