#!/usr/bin/env node
/**
 * copy-standalone-assets.js
 *
 * Runs after `next build` to prepare the standalone output for Electron packaging.
 *
 * What it does:
 *  1. Copies .next/static  →  .next/standalone/.next/static
 *  2. Copies public/       →  .next/standalone/public/
 *  3. Copies @prisma/client + .prisma/client (with native .node engine) into
 *     .next/standalone/node_modules/ so the server can run database queries.
 *  4. Copies prisma/schema.prisma → .next/standalone/prisma/schema.prisma
 *     (Prisma needs the schema at runtime for db push / migrations)
 *
 * Without step 3 the packaged app starts but every API route that touches
 * the database returns a 500 because the Prisma query engine binary is missing.
 */

const fs = require('fs-extra');
const path = require('path');

const rootDir   = path.join(__dirname, '..');
const nextDir   = path.join(rootDir, '.next');
const standalone = path.join(nextDir, 'standalone');

// ── helpers ──────────────────────────────────────────────────────────────────

function copy(src, dest, label) {
  if (!fs.existsSync(src)) {
    console.warn(`  ⚠️  ${label} not found: ${src}`);
    return false;
  }
  console.log(`  → Copying ${label}...`);
  fs.copySync(src, dest, { overwrite: true });
  console.log(`  ✅ Copied ${label}`);
  return true;
}

// ── main ─────────────────────────────────────────────────────────────────────

console.log('📦 Preparing standalone build for Electron...\n');

// 1. Static assets
copy(
  path.join(nextDir, 'static'),
  path.join(standalone, '.next', 'static'),
  '.next/static'
);

// 2. Public folder (excluding uploads/videos — too large for installer)
console.log('  → Copying public/ (excluding uploads/videos)...');
fs.copySync(
  path.join(rootDir, 'public'),
  path.join(standalone, 'public'),
  {
    overwrite: true,
    filter: (src) => {
      // Always allow directories through
      if (fs.statSync(src).isDirectory()) return true;
      // Skip video files in uploads
      const videoExts = ['.mp4', '.webm', '.avi', '.mov', '.mkv'];
      const ext = path.extname(src).toLowerCase();
      if (videoExts.includes(ext)) {
        console.log(`    ⏭  Skipping video: ${path.basename(src)}`);
        return false;
      }
      return true;
    }
  }
);
console.log('  ✅ Copied public/ (videos excluded)');

// 3. Prisma — the critical piece that was missing
//    Next.js standalone tracing does NOT reliably pick up native .node binaries.
//    We copy the three Prisma pieces manually:
//      - node_modules/@prisma/client    (JS runtime + type definitions)
//      - node_modules/.prisma/client    (generated client + native query engine .node file)
//      - node_modules/@prisma/engines   (schema-engine, used by db push / migrate)

const prismaPackages = [
  {
    src:  path.join(rootDir, 'node_modules', '@prisma', 'client'),
    dest: path.join(standalone, 'node_modules', '@prisma', 'client'),
    label: '@prisma/client',
  },
  {
    src:  path.join(rootDir, 'node_modules', '.prisma', 'client'),
    dest: path.join(standalone, 'node_modules', '.prisma', 'client'),
    label: '.prisma/client (generated + native engine)',
  },
  {
    src:  path.join(rootDir, 'node_modules', '@prisma', 'engines'),
    dest: path.join(standalone, 'node_modules', '@prisma', 'engines'),
    label: '@prisma/engines',
  },
];

console.log('\n🔧 Copying Prisma engine binaries...');
for (const pkg of prismaPackages) {
  copy(pkg.src, pkg.dest, pkg.label);
}

// 4. Prisma schema (needed by Prisma at runtime to resolve models)
copy(
  path.join(rootDir, 'prisma', 'schema.prisma'),
  path.join(standalone, 'prisma', 'schema.prisma'),
  'prisma/schema.prisma'
);

// 5. Rewrite the .env inside standalone so the relative DATABASE_URL doesn't
//    accidentally win if anything reads the file directly. The correct absolute
//    path is always injected by main.js via the spawn env — this just prevents
//    a stale relative path from being loaded as a fallback.
const standaloneEnv = path.join(standalone, '.env');
if (fs.existsSync(standaloneEnv)) {
  try {
    // Remove read-only flag if set (Next.js sometimes writes it as read-only)
    fs.chmodSync(standaloneEnv, 0o666);
    let envContent = fs.readFileSync(standaloneEnv, 'utf8');
    // Replace any relative file: DATABASE_URL with a clearly invalid placeholder.
    // main.js always overrides this with the real absolute path at spawn time.
    envContent = envContent.replace(
      /^DATABASE_URL=.*/m,
      '# DATABASE_URL is set by Electron main process at runtime'
    );
    fs.writeFileSync(standaloneEnv, envContent);
    console.log('  ✅ Sanitized DATABASE_URL in standalone/.env');
  } catch (e) {
    // Non-fatal — main.js spawn env always wins over this file anyway
    console.warn(`  ⚠️  Could not sanitize standalone/.env (${e.code}) — skipping (safe to ignore)`);
  }
}

// ── summary ──────────────────────────────────────────────────────────────────

console.log('\n✅ Standalone build prepared successfully!');
console.log('   Next step: run electron-builder to package the app.');
