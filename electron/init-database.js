/**
 * Database Initialization for Electron App
 * 
 * On first run:
 * 1. Copies dev.db to ~/.config/runda-tss-tech-club/app.db
 * 2. Runs Prisma db push to ensure schema is up to date
 * 3. Creates init flag to skip on subsequent runs
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function initDatabase(appPath) {
  console.log('📊 [DATABASE] Checking database initialization...');

  const isPackaged = require('electron').app.isPackaged;

  // User config directory
  const configDir = path.join(require('os').homedir(), '.config', 'runda-tss-tech-club');
  const userDbPath = path.join(configDir, 'app.db');
  const dbInitFlag = path.join(configDir, 'db-initialized.flag');

  // Ensure config directory exists
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
    console.log(`📁 [DATABASE] Created config directory: ${configDir}`);
  }

  // Check if already initialized
  if (fs.existsSync(dbInitFlag) && fs.existsSync(userDbPath)) {
    console.log('✅ [DATABASE] Already initialized');
    console.log(`📊 [DATABASE] Location: ${userDbPath}`);
    return true;
  }

  console.log('🔧 [DATABASE] First run - initializing database...');

  try {
    // Copy development database to user config directory
    // With asar: false, files are in 'app' directory
    const sourceDbPath = isPackaged
      ? path.join(process.resourcesPath, 'app', 'prisma', 'dev.db')
      : path.join(appPath, 'prisma', 'dev.db');

    console.log(`📋 [DATABASE] Looking for source: ${sourceDbPath}`);

    // Check alternative path if not found
    if (!fs.existsSync(sourceDbPath) && isPackaged) {
      const altPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'prisma', 'dev.db');
      console.log(`📋 [DATABASE] Trying alternative: ${altPath}`);
      if (fs.existsSync(altPath)) {
        sourceDbPath = altPath;
        console.log(`✅ [DATABASE] Found at alternative path`);
      }
    }

    if (fs.existsSync(sourceDbPath)) {
      console.log(`📋 [DATABASE] Copying from: ${sourceDbPath}`);
      console.log(`📋 [DATABASE] Copying to: ${userDbPath}`);
      fs.copyFileSync(sourceDbPath, userDbPath);
      console.log('✅ [DATABASE] Database copied successfully');
    } else {
      console.warn('⚠️  [DATABASE] Source database not found, creating new one');
      console.warn(`   Checked paths:`);
      console.warn(`   1. ${isPackaged ? path.join(process.resourcesPath, 'app', 'prisma', 'dev.db') : path.join(appPath, 'prisma', 'dev.db')}`);
      console.warn(`   2. ${path.join(process.resourcesPath, 'app.asar.unpacked', 'prisma', 'dev.db')}`);
      // Create empty database file
      fs.writeFileSync(userDbPath, '');
    }

    // Run Prisma db push to ensure schema is up to date
    const appRoot = isPackaged ? path.join(process.resourcesPath, 'app') : appPath;
    const prismaPath = path.join(appRoot, 'node_modules', '.bin', 'prisma');
    const schemaPath = path.join(appRoot, 'prisma', 'schema.prisma');

    // Check alternative paths if not found
    let finalPrismaPath = prismaPath;
    let finalSchemaPath = schemaPath;

    if (!fs.existsSync(prismaPath) && isPackaged) {
      const altPrismaPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', '.bin', 'prisma');
      if (fs.existsSync(altPrismaPath)) {
        finalPrismaPath = altPrismaPath;
      }
    }

    if (!fs.existsSync(schemaPath) && isPackaged) {
      const altSchemaPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'prisma', 'schema.prisma');
      if (fs.existsSync(altSchemaPath)) {
        finalSchemaPath = altSchemaPath;
      }
    }

    if (fs.existsSync(finalPrismaPath)) {
      console.log('📦 [DATABASE] Running Prisma db push...');
      console.log(`   Prisma: ${finalPrismaPath}`);
      console.log(`   Schema: ${finalSchemaPath}`);

      await new Promise((resolve, reject) => {
        const dbPush = spawn(finalPrismaPath, ['db', 'push', '--skip-generate', '--schema', finalSchemaPath], {
          cwd: appRoot,
          env: {
            ...process.env,
            DATABASE_URL: `file:${userDbPath}` // Use user database path
          },
          stdio: ['ignore', 'pipe', 'pipe']
        });

        let output = '';
        dbPush.stdout.on('data', (data) => {
          output += data.toString();
          console.log('[Prisma]', data.toString().trim());
        });

        dbPush.stderr.on('data', (data) => {
          output += data.toString();
          console.log('[Prisma]', data.toString().trim());
        });

        dbPush.on('close', (code) => {
          if (code === 0) {
            console.log('✅ [DATABASE] Schema synced successfully');
            resolve();
          } else {
            console.error('❌ [DATABASE] Failed to sync schema:', output);
            reject(new Error(`Prisma failed with code ${code}`));
          }
        });
      });
    } else {
      console.warn('⚠️  [DATABASE] Prisma not found, skipping migrations');
    }

    // Mark as initialized
    fs.writeFileSync(dbInitFlag, new Date().toISOString());
    console.log('✅ [DATABASE] Initialization complete');
    console.log(`📊 [DATABASE] Location: ${userDbPath}`);
    return true;

  } catch (error) {
    console.error('❌ [DATABASE] Initialization failed:', error.message);
    // Create flag anyway to avoid blocking app
    fs.writeFileSync(dbInitFlag, new Date().toISOString());
    return false;
  }
}

module.exports = { initDatabase };
