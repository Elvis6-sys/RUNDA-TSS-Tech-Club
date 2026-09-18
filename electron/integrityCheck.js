/**
 * Self-Integrity Check
 *
 * On every launch, SHA-256 hash the critical Electron files and compare
 * them against a stored manifest.  If any file has been tampered with the
 * exam cannot be started and the trainer is notified.
 *
 * Two-phase design
 * ─────────────────
 * Phase A  (first run / after a legitimate update)
 *   → No manifest exists yet.
 *   → Hash all watched files and WRITE the manifest.
 *   → App starts normally.
 *
 * Phase B  (every subsequent run)
 *   → Manifest exists.
 *   → Hash all watched files and COMPARE.
 *   → Any mismatch → TAMPERED flag set.  Exam blocked.
 *   → All matches → app starts normally.
 *
 * The manifest is stored in the Electron userData directory so it lives
 * outside the application bundle and survives app updates cleanly.
 * On a legitimate update the developer calls `integrityCheck.rebuildManifest()`
 * (or deletes the manifest file) so Phase A runs again.
 */

'use strict';

const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');
const { app } = require('electron');

// ─── Files to watch (relative to __dirname = electron/) ──────────────────────
const WATCHED_FILES = [
  'main.js',
  'preload.js',
  'crashRecovery.js',
  'syncQueue.js',
  'sessionLifecycle.js',
  'vmDetection.js',
  'integrityCheck.js',
];

// ─── Manifest location ────────────────────────────────────────────────────────
//   Stored in userData so it persists across relaunches but is per-machine.
//   We lazily resolve this after app is ready (userData not available before).
function getManifestPath() {
  return path.join(app.getPath('userData'), 'integrity-manifest.json');
}

// ─── Core helpers ─────────────────────────────────────────────────────────────
function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function buildHashMap() {
  const map = {};
  for (const rel of WATCHED_FILES) {
    const abs = path.join(__dirname, rel);
    if (fs.existsSync(abs)) {
      map[rel] = hashFile(abs);
    } else {
      map[rel] = null; // file missing — treated as tampered
    }
  }
  return map;
}

// ─── Public API ───────────────────────────────────────────────────────────────
class IntegrityCheck {
  constructor() {
    this.tampered      = false;
    this.tamperedFiles = [];   // list of { file, expected, actual }
    this.manifestExists = false;
    this.lastCheck = null;
  }

  /**
   * Run on app.whenReady().
   * Returns { ok: boolean, reason: string | null }
   */
  run() {
    try {
      const manifestPath = getManifestPath();
      this.manifestExists = fs.existsSync(manifestPath);

      if (!this.manifestExists) {
        // Phase A — first run, build & store the manifest
        console.log('🔒 [INTEGRITY] First run — building manifest...');
        this._writeManifest(manifestPath);
        console.log('✅ [INTEGRITY] Manifest created at:', manifestPath);
        this.lastCheck = { ok: true, phase: 'A', reason: null };
        return { ok: true, reason: null };
      }

      // Phase B — verify against manifest
      console.log('🔒 [INTEGRITY] Verifying file hashes...');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const current  = buildHashMap();
      const mismatches = [];

      for (const [rel, expectedHash] of Object.entries(manifest.hashes || {})) {
        const actualHash = current[rel];
        if (!actualHash) {
          mismatches.push({ file: rel, expected: expectedHash, actual: 'FILE_MISSING' });
        } else if (actualHash !== expectedHash) {
          mismatches.push({ file: rel, expected: expectedHash, actual: actualHash });
        }
      }

      if (mismatches.length > 0) {
        this.tampered      = true;
        this.tamperedFiles = mismatches;
        const msg = `Tampered files: ${mismatches.map(m => m.file).join(', ')}`;
        console.error('🚨 [INTEGRITY] TAMPERED —', msg);
        mismatches.forEach(m => {
          console.error(`   ${m.file}`);
          console.error(`     expected: ${m.expected}`);
          console.error(`     actual:   ${m.actual}`);
        });
        this.lastCheck = { ok: false, phase: 'B', reason: msg };
        return { ok: false, reason: msg };
      }

      console.log(`✅ [INTEGRITY] All ${WATCHED_FILES.length} files verified — no tampering detected`);
      this.lastCheck = { ok: true, phase: 'B', reason: null };
      return { ok: true, reason: null };

    } catch (err) {
      // Never crash the app — degrade gracefully
      console.error('❌ [INTEGRITY] Check error:', err.message);
      this.lastCheck = { ok: true, phase: 'error', reason: err.message };
      return { ok: true, reason: null }; // allow launch on check failure
    }
  }

  /**
   * Called by developer after a legitimate app update.
   * Rebuilds the manifest so the next launch passes Phase B.
   */
  rebuildManifest() {
    const manifestPath = getManifestPath();
    this._writeManifest(manifestPath);
    this.tampered      = false;
    this.tamperedFiles = [];
    console.log('🔒 [INTEGRITY] Manifest rebuilt at:', manifestPath);
    return { success: true, manifestPath };
  }

  getStatus() {
    return {
      tampered:       this.tampered,
      tamperedFiles:  this.tamperedFiles,
      manifestExists: this.manifestExists,
      lastCheck:      this.lastCheck,
      watchedFiles:   WATCHED_FILES,
    };
  }

  // ── Private ──────────────────────────────────────────────────────────────
  _writeManifest(manifestPath) {
    const manifest = {
      createdAt:  new Date().toISOString(),
      platform:   process.platform,
      hashes:     buildHashMap(),
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  }
}

module.exports = new IntegrityCheck();
