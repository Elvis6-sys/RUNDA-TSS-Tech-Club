/**
 * Database Path Configuration for Electron App
 * 
 * In development: uses ./prisma/dev.db
 * In production (Electron): uses ~/.config/runda-tss-tech-club/app.db
 * 
 * This ensures the database is in a writable location when packaged.
 */

import path from 'path';
import fs from 'fs';
import os from 'os';

export function getDatabasePath(): string {
  // Check if running in Electron
  const isElectron = typeof process !== 'undefined' && process.versions && !!process.versions.electron;
  
  if (isElectron && process.env.NODE_ENV === 'production') {
    // Production Electron: use user's config directory
    const configDir = path.join(os.homedir(), '.config', 'runda-tss-tech-club');
    
    // Ensure directory exists
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    const dbPath = path.join(configDir, 'app.db');
    console.log(`📊 [DB PATH] Using user config: ${dbPath}`);
    return `file:${dbPath}`;
  }
  
  // Development or Next.js server: use project directory
  const devDbPath = path.join(process.cwd(), 'prisma', 'dev.db');
  console.log(`📊 [DB PATH] Using development: ${devDbPath}`);
  return `file:${devDbPath}`;
}

export function getDatabaseDirectory(): string {
  const isElectron = typeof process !== 'undefined' && process.versions && !!process.versions.electron;
  
  if (isElectron && process.env.NODE_ENV === 'production') {
    return path.join(os.homedir(), '.config', 'runda-tss-tech-club');
  }
  
  return path.join(process.cwd(), 'prisma');
}
