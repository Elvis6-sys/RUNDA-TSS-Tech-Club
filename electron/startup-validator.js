/**
 * Startup Validator - Checks all requirements before app starts
 * Prevents 500 errors by validating everything upfront
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
    const standaloneDir = path.join(resourcesPath, 'app.asar.unpacked', '.next', 'standalone');
    const serverJs = path.join(standaloneDir, 'server.js');
    
    if (!fs.existsSync(serverJs)) {
      errors.push(`Standalone server not found: ${serverJs}`);
    } else {
      console.log(`✅ [VALIDATOR] Server found: ${serverJs}`);
    }
    
    // Check for bundled database
    const bundledDb = path.join(resourcesPath, 'app.asar.unpacked', 'prisma', 'dev.db');
    if (!fs.existsSync(bundledDb)) {
      errors.push(`Bundled database not found: ${bundledDb}`);
    } else {
      const dbSize = fs.statSync(bundledDb).size;
      console.log(`✅ [VALIDATOR] Bundled DB: ${(dbSize / 1024).toFixed(2)}KB`);
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
