#!/usr/bin/env node
/**
 * server-wrapper.js
 * 
 * Wraps the Next.js standalone server to ensure static files are served correctly
 * in Electron packaged environment.
 * 
 * CRITICAL: Next.js standalone mode requires manual configuration for static file serving.
 * This wrapper ensures /_next/static and /public paths are correctly mapped.
 */

const path = require('path');
const fs = require('fs');

// Detect app root based on whether we're packaged or in development
const isPackaged = process.env.IS_ELECTRON === 'true' && process.env.NODE_ENV === 'production';

let appRoot;
let standaloneDir;

if (isPackaged) {
  // In packaged Electron app
  const resourcesPath = process.env.RESOURCES_PATH || process.resourcesPath;
  appRoot = path.join(resourcesPath, 'app');
  standaloneDir = path.join(appRoot, '.next', 'standalone');
} else {
  // Development mode
  appRoot = path.join(__dirname, '..');
  standaloneDir = path.join(appRoot, '.next', 'standalone');
}

console.log(`[SERVER-WRAPPER] App root: ${appRoot}`);
console.log(`[SERVER-WRAPPER] Standalone dir: ${standaloneDir}`);
console.log(`[SERVER-WRAPPER] CWD: ${process.cwd()}`);

// CRITICAL: Set working directory to standalone
process.chdir(standaloneDir);

// Verify static files exist
const staticDir = path.join(standaloneDir, '.next', 'static');
const publicDir = path.join(standaloneDir, 'public');

console.log(`[SERVER-WRAPPER] Checking static directory: ${staticDir}`);
if (fs.existsSync(staticDir)) {
  console.log(`[SERVER-WRAPPER] ✅ Static directory found`);
  const cssFiles = fs.readdirSync(path.join(staticDir, 'css')).filter(f => f.endsWith('.css'));
  console.log(`[SERVER-WRAPPER] CSS files: ${cssFiles.join(', ')}`);
} else {
  console.error(`[SERVER-WRAPPER] ❌ Static directory NOT found!`);
}

console.log(`[SERVER-WRAPPER] Checking public directory: ${publicDir}`);
if (fs.existsSync(publicDir)) {
  console.log(`[SERVER-WRAPPER] ✅ Public directory found`);
} else {
  console.error(`[SERVER-WRAPPER] ❌ Public directory NOT found!`);
}

// Set environment variables for Next.js
process.env.NODE_ENV = 'production';
process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify({
  env: {},
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  output: 'standalone',
  images: { unoptimized: true },
  assetPrefix: '',
  basePath: '',
  distDir: './.next',
});

console.log(`[SERVER-WRAPPER] Starting Next.js server on port ${process.env.PORT || 3001}...`);

// Start the Next.js standalone server
require(path.join(standaloneDir, 'server.js'));
