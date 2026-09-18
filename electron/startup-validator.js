/**
 * Startup Validator - Checks all requirements before app starts
 * Prevents 500 errors by validating everything upfront
 * Version: 1.1 - Database optional
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function validateStartup(isPackaged, resourcesPath) {
  console.log('🔍 [VALIDATOR] Running startup checks...');

  const errors = [];
  const warnings = [];

  // 1. Check database directory
  const configDir = path.join(os.homedir(), '.config', 'runda-tss-tech-club');
  const dbPath = path.join(configDir, 'app.db');

  if (!fs.existsSync(configDir)) {
    warnings.push('Config directory does not exist (will be created)');
  }

  // 2. Check standalone server
  if (isPackaged) {
    // Try multiple possible locations (electron-builder packaging variations)
    const possibleLocations = [
      path.join(resourcesPath, 'app', '.next', 'standalone'),           // asar: false
      path.join(resourcesPath, 'app.asar.unpacked', '.next', 'standalone')  // asar: true with unpacked
    ];

    let serverJs = null;
    for (const loc of possibleLocations) {
      const testPath = path.join(loc, 'server.js');
      if (fs.existsSync(testPath)) {
        serverJs = testPath;
        console.log(`✅ [VALIDATOR] Server found: ${serverJs}`);
        break;
      }
    }

    if (!serverJs) {
      errors.push(`Standalone server not found in any location:\n${possibleLocations.map(l => `  - ${path.join(l, 'server.js')}`).join('\n')}`);
    }

    // Check for bundled database in multiple locations
    const possibleDbLocations = [
      path.join(resourcesPath, 'app', 'prisma', 'dev.db'),
      path.join(resourcesPath, 'app.asar.unpacked', 'prisma', 'dev.db')
    ];

    let bundledDb = null;
    for (const loc of possibleDbLocations) {
      if (fs.existsSync(loc)) {
        bundledDb = loc;
        const dbSize = fs.statSync(bundledDb).size;
        console.log(`✅ [VALIDATOR] Bundled DB: ${(dbSize / 1024).toFixed(2)}KB at ${bundledDb}`);
        break;
      }
    }

    if (!bundledDb) {
      // Database is optional - init-database will create one if needed
      warnings.push(`Bundled database not found (will be created on first run):\n${possibleDbLocations.map(l => `  - ${l}`).join('\n')}`);
      console.warn('⚠️  [VALIDATOR] Bundled database not found - will create empty database');
    }
  }

  // 3. Check Node.js availability
  try {
    const nodeVersion = process.version;
    console.log(`✅ [VALIDATOR] Node.js: ${nodeVersion}`);
  } catch (err) {
    errors.push('Node.js not available');
  }

  // 4. Report results
  if (errors.length > 0) {
    console.error('❌ [VALIDATOR] CRITICAL ERRORS:');
    errors.forEach(err => console.error(`   - ${err}`));
    return { valid: false, errors, warnings };
  }

  if (warnings.length > 0) {
    console.warn('⚠️  [VALIDATOR] Warnings:');
    warnings.forEach(warn => console.warn(`   - ${warn}`));
  }

  console.log('✅ [VALIDATOR] All checks passed!');
  return { valid: true, errors: [], warnings };
}

module.exports = { validateStartup };
