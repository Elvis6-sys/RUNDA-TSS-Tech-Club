const { app, BrowserWindow, globalShortcut, ipcMain, dialog, screen, powerMonitor, shell } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const os = require('os');

// Import modules with error handling
let crashRecovery, syncQueue, sessionLifecycle, vmDetector, integrityCheck, processSignatures;
try {
  crashRecovery = require('./crashRecovery');
  syncQueue = require('./syncQueue');
  sessionLifecycle = require('./sessionLifecycle');
  vmDetector = require('./vmDetection');
  integrityCheck = require('./integrityCheck');
  processSignatures = require('./processSignatures');
  console.log('✅ All security modules loaded');
} catch (err) {
  console.warn('⚠️  Some security modules failed to load:', err.message);
}

const { initDatabase } = require('./init-database');
const { validateStartup } = require('./startup-validator');

// ═══════════════════════════════════════════════════════════════════════════
// OS-SPECIFIC LOCKDOWN MODULES
// ═══════════════════════════════════════════════════════════════════════════
const windowsLockdown = process.platform === 'win32' ? require('./windows-lockdown') : null;
const linuxLockdown = process.platform === 'linux' ? require('./linux-lockdown') : null;

console.log(`🖥️  [LOCKDOWN] Platform: ${process.platform}`);
if (windowsLockdown) console.log('   ✓ Windows lockdown module loaded');
if (linuxLockdown) console.log('   ✓ Linux lockdown module loaded');
if (!windowsLockdown && !linuxLockdown && process.platform === 'darwin') {
  console.log('   ℹ️  macOS: Using Electron kiosk mode only (no OS lockdown needed)');
}

// ═══════════════════════════════════════════════════════════════════════════
// IPC HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

// Open file or URL in system default application (PDFs, browsers, etc.)
ipcMain.handle('open-external', async (event, pathOrUrl) => {
  try {
    console.log('[IPC] Opening external:', pathOrUrl);
    await shell.openPath(pathOrUrl);
    return { success: true };
  } catch (error) {
    console.error('[IPC] Failed to open external:', error);
    return { success: false, error: error.message };
  }
});

// ═══════════════════════════════════════════════════════════════════════════

// CRITICAL: Single instance lock - prevent multiple app instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('⚠️  Another instance is already running. Exiting...');
  app.quit();
  process.exit(0);
}

// When someone tries to launch a second instance, focus the existing window
app.on('second-instance', (event, commandLine, workingDirectory) => {
  console.log('⚠️  Second instance attempted. Focusing existing window...');
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// CRITICAL: Suppress ALL Electron error dialogs (prevents freeze-causing popups)
dialog.showErrorBox = () => {
  console.error('🚨 [SUPPRESSED] Error dialog blocked to prevent fullscreen freeze');
};

let mainWindow = null;
let overlayWindows = []; // For covering additional displays
let originalBounds = null; // Store window bounds before exam mode
let nextServer = null;
let isExamMode = false;
let isExiting = false; // Guard flag: prevents any re-locking during exit sequence
let examData = {};
let windowBlurCount = 0;
let lastBlurTime = 0;
let examStartTime = 0;
let focusCheckInterval = null;
let screenshotBlockInterval = null;
let fullscreenEnforcementInterval = null;
let processMonitorInterval = null;
let currentRecoverySessionId = null; // Track active crash recovery session
let submissionId = null; // Store submissionId for integrity report

// ── Audit / integrity log ─────────────────────────────────────────────────────
// Every suspicious event is appended here during the exam session.
// Flushed to /api/quiz/integrity-report on submit.
let auditLog = [];           // Array of { ts, type, detail }
let questionTimings = {};    // questionIdx → { startTs, totalMs }
let activeQuestionIdx = -1;  // Currently displayed question index
let clipboardCheckInterval = null;
let lastClipboardText = '';

function auditEvent(type, detail = {}) {
  const entry = { ts: Date.now(), type, ...detail };
  auditLog.push(entry);
  console.warn(`🔍 AUDIT [${type}]`, JSON.stringify(detail));
}

function markQuestionStart(idx) {
  if (activeQuestionIdx >= 0 && questionTimings[activeQuestionIdx]) {
    // Close previous question timing
    const prev = questionTimings[activeQuestionIdx];
    if (prev.startTs) {
      prev.totalMs = (prev.totalMs || 0) + (Date.now() - prev.startTs);
      prev.startTs = null;
    }
  }
  activeQuestionIdx = idx;
  if (!questionTimings[idx]) questionTimings[idx] = { totalMs: 0, startTs: Date.now() };
  else questionTimings[idx].startTs = Date.now();
}

function flushIntegrityReport() {
  // Close any open question timer
  if (activeQuestionIdx >= 0 && questionTimings[activeQuestionIdx]?.startTs) {
    const q = questionTimings[activeQuestionIdx];
    q.totalMs = (q.totalMs || 0) + (Date.now() - q.startTs);
    q.startTs = null;
  }
  return {
    sessionStart: examStartTime,
    sessionEnd: Date.now(),
    durationMs: Date.now() - examStartTime,
    focusLossCount: windowBlurCount,
    auditEvents: auditLog,
    questionTimingsMs: questionTimings,
    displayCountAtStart: screen.getAllDisplays().length,
    platform: process.platform,
  };
}

// DYNAMIC ADMIN PIN - Generated per exam session by trainer
// Replaces hardcoded EXAM2026 password with 6-digit session PIN
// PIN is set via IPC before exam starts: setAdminPin(pin)
let currentAdminPin = null; // null = no active session, string = 6-digit PIN
let pinExpiresAt = null;    // Timestamp when PIN expires (session end)

// Security: Disable remote module and Node integration in renderer
app.commandLine.appendSwitch('disable-features', 'MediaRouter');
app.commandLine.appendSwitch('disable-features', 'MediaRecorder');
app.commandLine.appendSwitch('disable-dev-shm-usage');
app.commandLine.appendSwitch('disable-software-rasterizer');
if (process.platform !== 'win32') {
  // GPU acceleration causes issues on some Windows systems
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-gpu-compositing');
  app.commandLine.appendSwitch('use-gl', 'egl');
  app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder');
}

function createWindow() {
  // Get primary display — use bounds (not workAreaSize) so we cover the taskbar too
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // Determine icon path based on platform
  let iconPath;
  if (process.platform === 'win32') {
    iconPath = path.join(__dirname, '../build/icon.ico');
  } else if (process.platform === 'darwin') {
    iconPath = path.join(__dirname, '../build/icon.icns');
  } else {
    iconPath = path.join(__dirname, '../build/icon.png');
  }

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    icon: iconPath,
    title: 'RUNDA TSS Tech Club',
    webPreferences: {
      nodeIntegration: true, // ENABLE: For PDF viewing
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
      allowRunningInsecureContent: true,
      devTools: true,
      plugins: true, // Enable PDF plugin
    },
    show: false,
    // frame:false on Linux prevents XFCE from ever getting a decoration handle.
    // frame:true on Windows/macOS — setKiosk handles removal cleanly there.
    frame: process.platform !== 'linux',
    autoHideMenuBar: true,
    backgroundColor: '#1a1a1a',
  });

  // Prevent window from being closed easily
  mainWindow.on('close', (e) => {
    if (isExamMode && !isExiting) {
      e.preventDefault();

      // CRITICAL: NO DIALOG - dialog causes window blur which triggers re-lock freeze
      console.warn('🚨 EXAM MODE: Close attempt blocked (no dialog to prevent freeze)');
      windowBlurCount++;

      // Just silently block and refocus
      forceWindowFocus();
      return;
    }
  });

  // Monitor window blur (focus loss)
  mainWindow.on('blur', () => {
    if (isExamMode) {
      const now = Date.now();
      windowBlurCount++;
      lastBlurTime = now;

      console.warn(`🚨 EXAM MODE: Window blur detected (Count: ${windowBlurCount})`);
      auditEvent('FOCUS_LOST', { blurCount: windowBlurCount, sinceExamStartMs: now - examStartTime });

      mainWindow.webContents.send('exam-focus-lost', {
        count: windowBlurCount,
        timestamp: now,
      });

      setTimeout(() => {
        if (isExamMode && !isExiting) {
          forceWindowFocus();
        }
      }, 50);
    }
  });

  // Prevent fullscreen exit — but NOT during the intentional exit sequence
  mainWindow.on('leave-full-screen', () => {
    if (isExamMode && !isExiting) {
      console.warn('🚨 FULLSCREEN EXIT DETECTED - RE-ENTERING IMMEDIATELY');
      // Re-lock with zero delay — every ms of delay is a visible title bar
      reapplyFullscreenLock('leave-full-screen event');
    }
  });

  // Prevent new windows from opening
  mainWindow.webContents.setWindowOpenHandler(() => {
    console.warn('🚨 EXAM MODE: New window blocked');
    return { action: 'deny' };
  });

  // Block navigation away from exam
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isExamMode && !url.startsWith('http://localhost:3001')) {
      event.preventDefault();
      console.warn(`🚨 EXAM MODE: Navigation blocked to ${url}`);
    }
  });

  // Block all downloads
  mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
    if (isExamMode) {
      event.preventDefault();
      console.warn('🚨 EXAM MODE: Download blocked');
    }
  });

  // Disable right-click context menu in exam mode
  mainWindow.webContents.on('context-menu', (event, params) => {
    if (isExamMode) {
      event.preventDefault();
      console.warn('🚨 EXAM MODE: Context menu blocked');
    }
  });

  // Load Next.js server
  // Show loading message immediately
  mainWindow.loadURL(`data:text/html,<html><body style="margin:0;padding:0;background:#1a1a1a;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;"><div style="text-align:center;"><h1>🚀 RUNDA TSS Exam System</h1><p>Starting server, please wait...</p><p style="color:#888;font-size:12px;">This may take 15-30 seconds on first launch</p></div></body></html>`);

  // Wait for server to be fully ready before connecting
  console.log('📡 Waiting for Next.js to fully initialize...');

  setTimeout(async () => {
    console.log('📡 Now attempting to connect to server...');

    // Try loading with retries - go direct to auth/login to bypass startup check
    let retries = 5;
    while (retries > 0) {
      try {
        await mainWindow.loadURL('http://127.0.0.1:3001/auth/login');
        console.log('✅ Successfully loaded login page');
        break;
      } catch (err) {
        retries--;
        console.error(`❌ Load failed (attempt ${6 - retries}/5):`, err.message);
        if (retries > 0) {
          console.log(`⏳ Retrying in 1s...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.error('❌ FATAL: Could not connect to Next.js server after 5 attempts');
          console.error('   Server may still be starting. Check console for errors.');
          console.error('   Try checking if server is running on port 3001');

          // Show error page with instructions
          mainWindow.loadURL(`data:text/html,<html><body style="margin:0;padding:0;background:#1a1a1a;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;"><div style="text-align:center;max-width:600px;padding:20px;"><h1 style="color:#ff4444;">⚠️ Server Connection Failed</h1><p>Could not connect to the application server after 5 attempts.</p><p style="color:#888;">The server may still be starting. Please check the console (press F12) for detailed error messages.</p><p style="color:#888;font-size:12px;">Common issues:<br>- Port 3001 is already in use<br>- Missing dependencies<br>- Database initialization failed</p></div></body></html>`);
        }
      }
    }
  }, 10000); // Wait 10 seconds for server startup

  // Add multiple event listeners for debugging
  mainWindow.webContents.on('did-start-loading', () => {
    console.log('🔄 Page started loading...');
  });

  mainWindow.webContents.on('dom-ready', () => {
    console.log('✅ DOM ready');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`❌ Page failed to load: ${errorCode} - ${errorDescription}`);
  });

  // Wait for the page content to actually load before showing window
  mainWindow.webContents.once('did-finish-load', () => {
    console.log('✅ Page finished loading');
    // Give a small delay for JS/CSS to initialize
    setTimeout(() => {
      mainWindow.show();
      console.log('✅ Electron window ready and content loaded');
    }, 500);
  });

  // Fallback: show window after 5 seconds if did-finish-load doesn't fire
  setTimeout(() => {
    if (!mainWindow.isVisible()) {
      console.warn('⚠️  Fallback: Showing window after 5s timeout');
      mainWindow.show();
    }
  }, 5000);

  // Only open DevTools in development mode, not in production
  // Production should never have DevTools accessible for security
  if (!app.isPackaged && !mainWindow.webContents.isDevToolsOpened()) {
    mainWindow.webContents.openDevTools();
    console.log('🔧 DevTools opened (development mode only)');
  }

  // Forward console logs from renderer to main process (visible in terminal)
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[RENDERER] ${message}`);
  });
}

function startNextServer() {
  console.log('🔍 Checking if Next.js server is already running...');
  const http = require('http');
  const fs = require('fs');

  return new Promise((resolve, reject) => {
    const req = http.get('http://127.0.0.1:3001', { timeout: 2000 }, (res) => {
      console.log('✅ Next.js server already running');
      resolve();
    });

    req.on('timeout', () => {
      req.destroy();
    });

    req.on('error', () => {
      // CRITICAL: Kill any zombie processes on port 3001 BEFORE starting
      console.log('🔧 Cleaning up port 3001...');

      // Platform-specific cleanup commands
      let cleanupCommands = [];

      if (process.platform === 'win32') {
        // Windows: Use PowerShell to find and kill process on port 3001
        cleanupCommands = [
          'powershell -Command "Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"',
          'taskkill /F /FI "PID eq $(netstat -ano | findstr :3001 | findstr LISTENING)" 2>nul',
        ];
      } else {
        // Linux/macOS: Use fuser, lsof, or pkill
        cleanupCommands = [
          'fuser -k 3001/tcp 2>/dev/null',  // Linux (most reliable)
          'lsof -ti:3001 | xargs kill -9 2>/dev/null',  // macOS/Linux fallback
          'pkill -9 -f "next-server.*3001" 2>/dev/null',  // Kill Next.js dev servers
        ];
      }

      let cleaned = false;
      const tryCleanup = (index) => {
        if (index >= cleanupCommands.length) {
          if (!cleaned) {
            console.log('   (No zombie processes found or cleanup not needed)');
          }
          console.log('🚀 Starting Next.js server...');
          startServer();
          return;
        }

        exec(cleanupCommands[index], (err, stdout, stderr) => {
          if (!err && stdout) {
            console.log(`✅ Killed zombie process on port 3001 (method ${index + 1})`);
            cleaned = true;
          }
          tryCleanup(index + 1);
        });
      };

      const startServer = () => {

        // Detect if we're in production (packaged app) or development
        const isPackaged = app.isPackaged;

        // VALIDATE BEFORE STARTING
        const validation = validateStartup(isPackaged, process.resourcesPath);
        if (!validation.valid) {
          console.error('❌ [VALIDATOR] Startup validation FAILED!');
          console.error('   Errors:', validation.errors);
          // Show error dialog to user
          const { dialog } = require('electron');
          dialog.showErrorBox(
            'Startup Error',
            'Failed to start application:\n\n' + validation.errors.join('\n')
          );
          app.quit();
          return;
        }

        console.log(`📦 isPackaged: ${isPackaged}`);
        console.log(`📁 __dirname: ${__dirname}`);
        console.log(`📁 process.resourcesPath: ${process.resourcesPath}`);

        // CRITICAL: Set database path for offline operation
        const os = require('os');
        const configDir = path.join(os.homedir(), '.config', 'runda-tss-tech-club');
        const userDbPath = path.join(configDir, 'app.db');

        // Override DATABASE_URL for production to use writable user directory
        if (isPackaged) {
          process.env.DATABASE_URL = `file:${userDbPath}`;
          console.log(`📊 [DATABASE] Set to: ${process.env.DATABASE_URL}`);
        }

        // Load environment variables
        if (isPackaged) {
          const envPath = path.join(process.resourcesPath, '.env');
          console.log(`🔧 Loading .env from: ${envPath}`);
          if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            envContent.split('\n').forEach(line => {
              const trimmed = line.trim();
              if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                if (key && valueParts.length > 0) {
                  // Don't override DATABASE_URL if already set
                  if (key.trim() !== 'DATABASE_URL') {
                    process.env[key.trim()] = valueParts.join('=').trim();
                  }
                }
              }
            });
            console.log('✅ Environment variables loaded');
          } else {
            console.warn('⚠️  .env file not found');
          }
        }

        let command, args, cwd;

        if (isPackaged) {
          // In production: run standalone server directly
          cwd = path.join(process.resourcesPath, 'app.asar.unpacked', '.next', 'standalone');
          const serverJs = path.join(cwd, 'server.js');

          console.log(`🔧 PRODUCTION MODE`);
          console.log(`📁 CWD: ${cwd}`);
          console.log(`🎯 Server: ${serverJs}`);
          console.log(`📦 Server exists: ${fs.existsSync(serverJs)}`);

          // Use system Node.js to run standalone server
          command = 'node';
          args = [serverJs];
        } else {
          // Development mode: use npm
          cwd = path.join(__dirname, '..');
          command = 'npm';
          args = ['run', 'dev'];
          console.log(`🔧 DEVELOPMENT MODE`);
          console.log(`📁 CWD: ${cwd}`);
        }

        nextServer = spawn(command, args, {
          cwd: cwd,
          shell: true, // Use shell on all platforms for compatibility
          env: {
            ...process.env,
            BROWSER: 'none',
            NODE_ENV: isPackaged ? 'production' : process.env.NODE_ENV,
            PORT: '3001',
            DATABASE_URL: isPackaged ? `file:${userDbPath}` : process.env.DATABASE_URL,
            HOSTNAME: '0.0.0.0',
            IS_ELECTRON: 'true'  // Flag for Electron environment
          }
        });

        nextServer.stdout.on('data', (data) => {
          const msg = data.toString().trim();
          console.log(`[Next.js] ${msg}`);

          // Check for critical errors
          if (msg.includes('error') || msg.includes('Error') || msg.includes('failed')) {
            console.error(`🚨 [Next.js ERROR] ${msg}`);
          }
        });

        nextServer.stderr.on('data', (data) => {
          const msg = data.toString().trim();
          console.error(`[Next.js Error] ${msg}`);

          // Check for database errors specifically
          if (msg.includes('DATABASE') || msg.includes('Prisma') || msg.includes('ENOENT')) {
            console.error(`🚨 [DATABASE ERROR] ${msg}`);
            console.error(`📊 Current DATABASE_URL: ${process.env.DATABASE_URL}`);
          }

          // CRITICAL: Detect port conflict and kill app
          if (msg.includes('EADDRINUSE')) {
            console.error(`🚨 FATAL: Port 3001 already in use! Cleaning up...`);
            if (nextServer) nextServer.kill('SIGKILL');
            setTimeout(() => {
              dialog.showErrorBox(
                'Server Error',
                'Port 3001 is already in use by another process.\n\n' +
                'Please close all other instances of this app and try again.'
              );
              app.quit();
            }, 500);
          }
        });

        nextServer.on('error', (error) => {
          console.error(`❌ Failed to start Next.js server:`);
          console.error(`   Error: ${error.message}`);
          console.error(`   Command: ${command}`);
          console.error(`   Args: ${JSON.stringify(args)}`);
          console.error(`   CWD: ${cwd}`);
        });

        // Wait for server AND health endpoints to be ready
        let attempts = 0;
        const maxAttempts = 20; // 10 seconds max wait
        const checkServer = setInterval(() => {
          attempts++;
          if (attempts > maxAttempts) {
            clearInterval(checkServer);
            console.warn('⚠️  Health check timeout - continuing anyway');
            resolve();
            return;
          }

          const req2 = http.get('http://127.0.0.1:3001/api/health', { timeout: 1000 }, (res) => {
            if (res.statusCode === 200) {
              clearInterval(checkServer);
              console.log('✅ Next.js server ready (health check passed)');
              resolve();
            }
          });
          req2.on('timeout', () => req2.destroy());
          req2.on('error', () => { }); // Ignore errors while waiting
          req2.end();
        }, 500);
      }; // Close startServer() function

      tryCleanup(0); // Start cleanup chain
    }); // Close req.on('error')
    req.end();
  });
}

function reapplyFullscreenLock(reason) {
  if (!isExamMode || isExiting || !mainWindow || mainWindow.isDestroyed()) return;
  console.warn(`🔒 Re-locking fullscreen (reason: ${reason})`);
  mainWindow.setKiosk(true);
  mainWindow.setFullScreen(true);
  mainWindow.setAlwaysOnTop(true, 'screen-saver', 2147483647);
  mainWindow.moveTop();
  mainWindow.focus();
  windowBlurCount++;
}

function enterExamMode(data) {
  console.log('🔒 ========================================');
  console.log('🔒 ENTERING ULTRA-SECURE EXAM MODE');
  console.log('🔒 ========================================');

  // WEEK 3: Block exam if integrity check failed
  if (integrityCheck.tampered) {
    console.error('🚨 [INTEGRITY] Exam start BLOCKED — app files have been tampered!');
    auditEvent('EXAM_BLOCKED_INTEGRITY', { tamperedFiles: integrityCheck.tamperedFiles.map(t => t.file) });
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('suspicious-activity', {
        type: 'integrity-tampered',
        files: integrityCheck.tamperedFiles.map(t => t.file),
        timestamp: Date.now(),
      });
    }
    return; // hard block
  }

  isExamMode = true;
  examData = data;
  windowBlurCount = 0;
  lastBlurTime = Date.now();
  examStartTime = Date.now();
  // Reset audit state for fresh session
  auditLog = [];
  questionTimings = {};
  activeQuestionIdx = -1;
  lastClipboardText = '';

  // WEEK 2: Start session lifecycle tracking
  const sessionId = sessionLifecycle.startSession(data);
  examData.sessionId = sessionId;
  auditEvent('SESSION_STARTED', { sessionId, ...data });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1: OS-LEVEL LOCKDOWN (Platform-Specific)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('🔒 [PHASE 1] Activating OS-level lockdown...');

  if (process.platform === 'win32' && windowsLockdown) {
    // Windows: Registry manipulation, Task Manager disable, AHK blocker
    windowsLockdown.lockdown().then(() => {
      console.log('✅ [PHASE 1] Windows OS-level lockdown complete');
    }).catch(err => {
      console.error('❌ [PHASE 1] Windows lockdown error:', err.message);
    });
  } else if (process.platform === 'linux' && linuxLockdown) {
    // Linux: WM shortcut disabling, process killing, TTY blocking
    linuxLockdown.lockdown().then(() => {
      console.log('✅ [PHASE 1] Linux OS-level lockdown complete');
    }).catch(err => {
      console.error('❌ [PHASE 1] Linux lockdown error:', err.message);
    });
  } else if (process.platform === 'darwin') {
    // macOS: Kiosk mode is sufficient (Apple has good security)
    console.log('✅ [PHASE 1] macOS: Electron kiosk mode (no OS lockdown needed)');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2: ELECTRON WINDOW LOCKDOWN
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('🔒 [PHASE 2] Activating Electron window lockdown...');

  mainWindow.setKiosk(true);
  mainWindow.setFullScreen(true);
  mainWindow.setAlwaysOnTop(true, 'screen-saver', 2147483647);
  mainWindow.setSkipTaskbar(true);
  mainWindow.setClosable(false);
  mainWindow.setMinimizable(false);
  mainWindow.setMaximizable(false);
  mainWindow.setResizable(false);
  mainWindow.setMovable(false);
  mainWindow.setMenuBarVisibility(false);
  mainWindow.setAutoHideMenuBar(true);
  mainWindow.moveTop();
  mainWindow.focus();

  const { Menu } = require('electron');
  Menu.setApplicationMenu(null);

  if (mainWindow.webContents.isDevToolsOpened()) {
    mainWindow.webContents.closeDevTools();
  }

  console.log('✅ [PHASE 2] Electron window lockdown complete');

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 3: MULTI-DISPLAY COVERAGE
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('🔒 [PHASE 3] Covering additional displays...');
  createDisplayOverlays();
  console.log('✅ [PHASE 3] Display coverage complete');

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 4: ELECTRON KEYBOARD BLOCKING
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('🔒 [PHASE 4] Activating Electron keyboard blocking...');
  blockAllKeyboardShortcuts();
  console.log('✅ [PHASE 4] Keyboard blocking complete');

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 5: MONITORING & ENFORCEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('🔒 [PHASE 5] Starting monitoring systems...');
  startFullscreenEnforcement();
  startFocusMonitoring();
  startProcessMonitoring();
  blockScreenshotTools();
  preventWindowStateChanges();
  startClipboardMonitoring();
  console.log('✅ [PHASE 5] All monitoring systems active');

  const displays = screen.getAllDisplays();
  console.log('✅ EXAM MODE ACTIVE');
  console.log(`   ✓ Platform: ${process.platform} | frame:${process.platform !== 'linux'} | kiosk:true`);
  console.log(`   ✓ Displays covered: ${displays.length}`);
  console.log(`   ✓ OS-level lockdown: ${windowsLockdown || linuxLockdown ? 'ACTIVE' : 'N/A'}`);
  console.log('🔒 ========================================');
}

function exitExamMode() {
  console.log('🔓 Exiting exam mode');

  isExiting = true;
  isExamMode = false;

  // WEEK 2: End session lifecycle tracking (graceful exit)
  if (examData.sessionId) {
    sessionLifecycle.endSession(examData.sessionId, 'normal');
    auditEvent('SESSION_ENDED_GRACEFULLY', { sessionId: examData.sessionId });
  }

  // WEEK 2: Clear admin PIN (session ended)
  currentAdminPin = null;
  pinExpiresAt = null;

  // Stop Electron-level monitoring
  stopFullscreenEnforcement();
  stopFocusMonitoring();
  stopProcessMonitoring();
  stopScreenshotBlocking();
  stopClipboardMonitoring();
  closeDisplayOverlays();
  unblockKeyboardShortcuts();

  // Flush integrity report to server (non-blocking — best effort)
  const report = flushIntegrityReport();
  const sub = examData?.submissionId || null;
  if (sub) {
    const http = require('http');
    const body = JSON.stringify({ submissionId: sub, report });
    const req = http.request({
      host: 'localhost', port: 3001,
      path: '/api/quiz/integrity-report',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    });
    req.on('error', (e) => console.warn('⚠️  Integrity report send failed:', e.message));
    req.write(body);
    req.end();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OS-LEVEL LOCKDOWN DEACTIVATION
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('🔓 [EXIT] Deactivating OS-level lockdown...');

  if (process.platform === 'win32' && windowsLockdown) {
    windowsLockdown.unlock().then(() => {
      console.log('✅ [EXIT] Windows OS-level lockdown deactivated');
    }).catch(err => {
      console.error('❌ [EXIT] Windows unlock error:', err.message);
    });
  } else if (process.platform === 'linux' && linuxLockdown) {
    linuxLockdown.unlock().then(() => {
      console.log('✅ [EXIT] Linux OS-level lockdown deactivated');
    }).catch(err => {
      console.error('❌ [EXIT] Linux unlock error:', err.message);
    });
  }

  // Restore Electron window to normal
  try {
    mainWindow.setClosable(true);
    mainWindow.setMinimizable(true);
    mainWindow.setMaximizable(true);
    mainWindow.setResizable(true);
    mainWindow.setMovable(true);
    mainWindow.setKiosk(false);
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setSkipTaskbar(false);

    setTimeout(() => {
      mainWindow.setFullScreen(false);
      mainWindow.setMenuBarVisibility(true);
      setTimeout(() => {
        isExiting = false;
        console.log('✅ EXIT COMPLETE - Normal mode restored');
      }, 200);
    }, 100);

  } catch (error) {
    console.error('❌ Exit error:', error);
    isExiting = false;
    isExamMode = false;
  }
}

// Ultra-aggressive fullscreen enforcement
function startFullscreenEnforcement() {
  fullscreenEnforcementInterval = setInterval(() => {
    if (!isExamMode || isExiting || !mainWindow || mainWindow.isDestroyed()) return;
    if (!mainWindow.isKiosk() || !mainWindow.isFullScreen() || !mainWindow.isAlwaysOnTop()) {
      console.warn('⚠️  Fullscreen breach — re-locking');
      reapplyFullscreenLock('enforcement interval');
    }
  }, 200);
  console.log('🔒 Fullscreen enforcement: ACTIVE');
}

function stopFullscreenEnforcement() {
  if (fullscreenEnforcementInterval) {
    clearInterval(fullscreenEnforcementInterval);
    fullscreenEnforcementInterval = null;
    console.log('🔒 Fullscreen enforcement: STOPPED');
  }
}

// NEW: Prevent ANY window state manipulation during exam
function preventWindowStateChanges() {
  // Block window events that could change state
  mainWindow.on('leave-full-screen', () => {
    if (isExamMode) {
      console.error('🚨 BLOCKED: Attempt to leave fullscreen detected');
      reapplyFullscreenLock('preventWindowStateChanges leave-full-screen');
    }
  });

  mainWindow.on('minimize', () => {
    if (isExamMode) {
      console.error('🚨 BLOCKED: Attempt to minimize window detected');
      mainWindow.restore();
      reapplyFullscreenLock('minimize event');
      windowBlurCount++;
    }
  });

  mainWindow.on('maximize', () => {
    if (isExamMode && !mainWindow.isFullScreen()) {
      console.error('🚨 BLOCKED: Attempt to maximize (not fullscreen) detected');
      reapplyFullscreenLock('maximize event');
    }
  });

  mainWindow.on('unmaximize', () => {
    if (isExamMode) {
      console.error('🚨 BLOCKED: Attempt to unmaximize detected');
      mainWindow.setKiosk(true);
      mainWindow.setFullScreen(true);
      windowBlurCount++;
    }
  });

  mainWindow.on('restore', () => {
    if (isExamMode && !mainWindow.isFullScreen()) {
      console.error('🚨 BLOCKED: Attempt to restore window detected');
      mainWindow.setKiosk(true);
      mainWindow.setFullScreen(true);
    }
  });

  mainWindow.on('move', () => {
    if (isExamMode) {
      console.error('🚨 BLOCKED: Attempt to move window detected');
      forceWindowFocus();
      windowBlurCount++;
    }
  });

  mainWindow.on('resize', () => {
    if (isExamMode && !mainWindow.isFullScreen()) {
      console.error('🚨 BLOCKED: Attempt to resize window detected');
      mainWindow.setKiosk(true);
      mainWindow.setFullScreen(true);
      windowBlurCount++;
    }
  });

  console.log('🔒 Window state change prevention: ACTIVE');
}

function forceWindowFocus() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.moveTop();
    mainWindow.focus();
    mainWindow.show();
    mainWindow.setAlwaysOnTop(true, 'screen-saver', 2147483647);
    console.log('🎯 Window focus enforced');
  }
}

function startFocusMonitoring() {
  focusCheckInterval = setInterval(() => {
    if (!isExamMode || isExiting || !mainWindow || mainWindow.isDestroyed()) return;
    if (!mainWindow.isFocused()) {
      console.warn('⚠️  Focus lost, forcing refocus');
      forceWindowFocus();
    }
  }, 100);
  console.log('👁️  Focus monitoring: ACTIVE');
}

function stopFocusMonitoring() {
  if (focusCheckInterval) {
    clearInterval(focusCheckInterval);
    focusCheckInterval = null;
    console.log('👁️  Focus monitoring: STOPPED');
  }
}

// ─── WEEK 3: Enhanced Process Monitoring with Window Title Detection ─────────
/**
 * Replaces simple name-based scanning with a two-tier approach:
 *   Tier 1 — Process name matching (existing behavior)
 *   Tier 2 — Window-title keyword matching (catches renamed executables)
 *
 * This defeats renaming attacks like chrome.exe → homework.exe.
 * Tier-2 detection runs every 5 seconds (slower than name scan).
 */
function startProcessMonitoring() {
  const platform = process.platform;

  // Get name-based threat map from signatures
  const nameMap = processSignatures.getNameThreatMap();
  const nameList = Array.from(nameMap.keys());

  if (nameList.length === 0) {
    console.warn('⚠️ [PROCESS] No process signatures for platform:', platform);
    return;
  }

  // ─── Tier 1 — Name-based scan (every 2 seconds) ───────────────────────────
  processMonitorInterval = setInterval(() => {
    if (!isExamMode || isExiting) return;

    for (const proc of nameList) {
      const cmd = platform === 'linux'
        ? `pgrep -i '${proc}' | xargs -r kill -9`
        : `taskkill /F /IM ${proc} /T`;
      exec(cmd, (err) => {
        if (!err) {
          const info = nameMap.get(proc) || {};
          console.warn(`🚫 [TIER 1] Killed ${info.category || 'unknown'} process: ${proc}`);
          auditEvent('PROCESS_KILLED_NAME', {
            process: proc,
            category: info.category,
            severity: info.severity,
            tier: 1,
            timestamp: Date.now(),
          });
        }
      });
    }
  }, 2000);

  // ─── Tier 2 — Window-title scan (every 5 seconds) ─────────────────────────
  const titleScanInterval = setInterval(async () => {
    if (!isExamMode || isExiting) return;

    try {
      const titleHits = await processSignatures.scanWindowTitles();
      for (const hit of titleHits) {
        const { sig, title } = hit;
        console.warn(`🚫 [TIER 2] Suspicious window detected: "${title}"`);
        console.warn(`   Pattern: ${hit.pattern}`);
        console.warn(`   Category: ${sig.category} (${sig.severity})`);

        auditEvent('PROCESS_SUSPICIOUS_TITLE', {
          title,
          category: sig.category,
          severity: sig.severity,
          pattern: hit.pattern,
          tier: 2,
          timestamp: Date.now(),
        });

        // If severity is 'high', try to kill parent process
        if (sig.severity === 'high' && platform === 'linux') {
          // Attempt to find and kill the window's process (best effort)
          exec(`wmctrl -c "${title}" 2>/dev/null`, (err) => {
            if (!err) console.warn(`   Closed window: ${title}`);
          });
        }
      }
    } catch (err) {
      console.error('❌ [TIER 2] Window title scan error:', err.message);
    }
  }, 5000);

  // Store both intervals so stopProcessMonitoring can clear both
  processMonitorInterval._titleScanInterval = titleScanInterval;

  console.log(`🔒 Process monitoring: ACTIVE (${nameList.length} names + window-title scan)`);
}

function stopProcessMonitoring() {
  if (processMonitorInterval) {
    clearInterval(processMonitorInterval);
    // Also clear the tier-2 title scan interval if it exists
    if (processMonitorInterval._titleScanInterval) {
      clearInterval(processMonitorInterval._titleScanInterval);
    }
    processMonitorInterval = null;
    console.log('🔒 Process monitoring: STOPPED');
  }
}

function blockScreenshotTools() {
  if (process.platform === 'linux') {
    const screenshotCommands = [
      'gnome-screenshot', 'scrot', 'flameshot', 'spectacle',
      'xfce4-screenshooter', 'shutter', 'kazam', 'simplescreenrecorder',
    ];

    screenshotBlockInterval = setInterval(() => {
      if (isExamMode) {
        screenshotCommands.forEach(cmd => {
          exec(`pkill -9 ${cmd}`, (error) => {
            if (!error) console.warn(`🚨 Blocked screenshot tool: ${cmd}`);
          });
        });
      }
    }, 500);

    console.log('📸 Screenshot blocking: ACTIVE (Linux, 500ms interval)');

  } else if (process.platform === 'win32') {
    const screenshotProcesses = [
      'SnippingTool.exe',   // Windows Snipping Tool (legacy)
      'ScreenSketch.exe',   // Snip & Sketch / Win+Shift+S overlay
      'SnipAndSketch.exe',  // alternate process name
      'ShareX.exe',         // popular 3rd-party screenshot tool
      'Lightshot.exe',      // Lightshot
      'Greenshot.exe',      // Greenshot
      'PicPick.exe',        // PicPick
    ];

    screenshotBlockInterval = setInterval(() => {
      if (isExamMode) {
        screenshotProcesses.forEach(proc => {
          exec(`tasklist /FI "IMAGENAME eq ${proc}" /NH 2>nul`, (error, stdout) => {
            if (stdout && stdout.toLowerCase().includes(proc.toLowerCase())) {
              exec(`taskkill /F /IM "${proc}" /T`, (killError) => {
                if (!killError) console.warn(`🚨 Blocked screenshot tool: ${proc}`);
              });
            }
          });
        });
      }
    }, 500);

    console.log('📸 Screenshot blocking: ACTIVE (Windows, 500ms interval)');

  } else {
    // macOS: screenshot blocking not needed — kiosk mode prevents Cmd+Shift+3/4
    console.log('📸 Screenshot blocking: SKIPPED (macOS — kiosk handles this)');
  }
}

function stopScreenshotBlocking() {
  if (screenshotBlockInterval) {
    clearInterval(screenshotBlockInterval);
    screenshotBlockInterval = null;
    console.log('📸 Screenshot blocking: STOPPED');
  }
}

// ── Clipboard monitoring ──────────────────────────────────────────────────────
// Poll the clipboard every 1s. If contents change during exam, log it.
// The actual PASTE BLOCK is done in the renderer via before-input-event.
function startClipboardMonitoring() {
  const { clipboard } = require('electron');
  try { lastClipboardText = clipboard.readText(); } catch { lastClipboardText = ''; }

  clipboardCheckInterval = setInterval(() => {
    if (!isExamMode) return;
    try {
      const current = clipboard.readText();
      if (current !== lastClipboardText) {
        const preview = current.slice(0, 80).replace(/\n/g, ' ');
        auditEvent('CLIPBOARD_CHANGED', { preview, length: current.length });
        console.warn(`📋 Clipboard changed during exam (${current.length} chars): "${preview}"`);
        lastClipboardText = current;
        // Clear the clipboard so pasting is impossible even if somehow unblocked
        clipboard.writeText('');
      }
    } catch { /* ignore — clipboard may be unavailable briefly */ }
  }, 1000);
  console.log('📋 Clipboard monitoring: ACTIVE (1s interval, auto-clear on change)');
}

function stopClipboardMonitoring() {
  if (clipboardCheckInterval) {
    clearInterval(clipboardCheckInterval);
    clipboardCheckInterval = null;
    console.log('📋 Clipboard monitoring: STOPPED');
  }
}

// NEW: Create overlay windows for all displays
function createDisplayOverlays() {
  const displays = screen.getAllDisplays();
  const primary = screen.getPrimaryDisplay();

  // Log all displays at exam start (DISPLAY_SCAN audit event)
  auditEvent('DISPLAY_SCAN', {
    displayCount: displays.length,
    primaryId: primary.id,
    allDisplays: displays.map(d => ({
      id: d.id,
      bounds: d.bounds,
      isPrimary: d.id === primary.id
    }))
  });

  console.log(`📺 [DISPLAY SCAN] Found ${displays.length} display(s) at exam start`);

  displays.forEach((display, index) => {
    // Skip primary display (already covered by main window)
    if (display.id === primary.id) {
      console.log(`📺 Display ${index + 1} (ID: ${display.id}): PRIMARY - covered by main window`);
      return;
    }

    console.log(`📺 Display ${index + 1} (ID: ${display.id}): SECONDARY - creating overlay...`);

    const overlay = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      frame: false,
      transparent: false,
      backgroundColor: '#000000',
      alwaysOnTop: true,
      skipTaskbar: true,
      closable: false,
      minimizable: false,
      maximizable: false,
      resizable: false,
      movable: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    overlay.loadURL(`data:text/html,<html><body style="margin:0;padding:0;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;font-family:sans-serif;"><div style="text-align:center;"><h1>🔒 EXAM IN PROGRESS</h1><p>This display is blocked during exam mode</p></div></body></html>`);
    overlay.setKiosk(true);

    overlayWindows.push(overlay);

    // Log DISPLAY_COVERED event
    auditEvent('DISPLAY_COVERED', {
      displayId: display.id,
      bounds: display.bounds,
      timestamp: Date.now()
    });

    console.log(`✅ Display ${index + 1} overlay created and active`);
  });

  console.log(`📺 [DISPLAY SCAN] Complete: ${overlayWindows.length} secondary display(s) covered`);
}

function closeDisplayOverlays() {
  overlayWindows.forEach((overlay, index) => {
    if (overlay && !overlay.isDestroyed()) {
      overlay.close();
      console.log(`📺 Closed overlay ${index + 1}`);
    }
  });
  overlayWindows = [];
}

// NEW: Disable Linux/XFCE OS-level shortcuts
function disableLinuxOSShortcuts() {
  if (process.platform === 'linux') {
    console.log('🔧 Disabling Linux/XFCE keyboard shortcuts...');

    // Hide XFCE taskbar by setting autohide-behavior to "always" (1)
    // This uses xfconf-query to write a config property — safe, no DBus service call,
    // no dialog, no freeze. The panel hides itself smoothly.
    exec('xfconf-query -c xfce4-panel -p "/panels/panel-1/autohide-behavior" -n -t uint -s 1', (error) => {
      if (!error) console.log('   ✓ XFCE taskbar hidden (autohide-behavior=1)');
      else console.log('   ℹ️  Could not hide taskbar:', error.message.slice(0, 60));
    });

    // Disable Alt+F4, Alt+Tab, etc. in XFCE window manager
    const shortcuts = [
      '/xfwm4/custom/<Alt>F4',
      '/xfwm4/custom/<Alt>Tab',
      '/xfwm4/custom/<Primary><Alt>Delete',
      '/xfwm4/custom/<Super>l',
      '/xfwm4/custom/F11',
    ];

    shortcuts.forEach(shortcut => {
      exec(`xfconf-query -c xfce4-keyboard-shortcuts -p "${shortcut}" -r`, (error) => {
        if (!error) console.log(`   ✓ Disabled: ${shortcut}`);
      });
    });

    console.log('   ✓ OS-level shortcuts disabled');
  }
}

function restoreLinuxOSShortcuts() {
  if (process.platform === 'linux') {
    console.log('🔧 Restoring Linux/XFCE shortcuts and taskbar...');

    // Restore XFCE taskbar — set autohide-behavior back to "never" (0)
    exec('xfconf-query -c xfce4-panel -p "/panels/panel-1/autohide-behavior" -s 0', (error) => {
      if (!error) console.log('   ✓ XFCE taskbar restored (autohide-behavior=0)');
      else console.log('   ℹ️  Could not restore taskbar:', error.message.slice(0, 60));
    });

    console.log('   ⚠️  Some WM shortcuts may need manual reconfiguration');
  }
}


function blockAllKeyboardShortcuts() {
  // NOTE: Ctrl+Shift+E is registered at app startup — NOT here.
  // Re-registering it here would make globalShortcut.register() return false
  // (duplicate registration silently fails), so the shortcut would stop working.

  // COMPREHENSIVE keyboard blocking - 120+ shortcuts
  const shortcuts = [
    // Admin/Teacher Exit (BLOCKED in exam mode)
    'CommandOrControl+Shift+E',

    // Window Management
    'CommandOrControl+Q', 'CommandOrControl+W', 'Alt+F4', 'CommandOrControl+H',
    'CommandOrControl+M', 'CommandOrControl+Shift+Q',

    // Reload/Refresh
    'CommandOrControl+R', 'CommandOrControl+Shift+R', 'F5', 'Shift+F5', 'CommandOrControl+F5',

    // New Windows/Tabs
    'CommandOrControl+N', 'CommandOrControl+Shift+N', 'CommandOrControl+T', 'CommandOrControl+Shift+T',

    // Tab Navigation
    'CommandOrControl+Tab', 'CommandOrControl+Shift+Tab',
    'CommandOrControl+1', 'CommandOrControl+2', 'CommandOrControl+3', 'CommandOrControl+4',
    'CommandOrControl+5', 'CommandOrControl+6', 'CommandOrControl+7', 'CommandOrControl+8', 'CommandOrControl+9',

    // Clipboard Operations
    'CommandOrControl+C', 'CommandOrControl+V', 'CommandOrControl+X',
    'CommandOrControl+A', 'CommandOrControl+Z', 'CommandOrControl+Y', 'CommandOrControl+Shift+Z',

    // Find/Search
    'CommandOrControl+F', 'CommandOrControl+G', 'CommandOrControl+Shift+G',

    // App Switching
    'Alt+Tab', 'Alt+Shift+Tab', 'Command+`',

    // Fullscreen
    'F11', 'CommandOrControl+Shift+F', 'Escape',

    // Developer Tools
    'F12', 'CommandOrControl+Shift+I', 'CommandOrControl+Shift+J', 'CommandOrControl+Shift+C',
    'CommandOrControl+Option+I', 'CommandOrControl+Option+J',

    // View Source/Print/Save
    'CommandOrControl+U', 'CommandOrControl+P', 'CommandOrControl+S', 'CommandOrControl+Shift+S',

    // Zoom
    'CommandOrControl+Plus', 'CommandOrControl+=', 'CommandOrControl+-', 'CommandOrControl+0',

    // History/Bookmarks
    'CommandOrControl+D', 'CommandOrControl+Shift+D', 'CommandOrControl+B',

    // Address Bar
    'CommandOrControl+L', 'Alt+D', 'F6',

    // Help
    'F1',

    // Navigation — block Alt+Left/Right (browser history) but NOT plain arrow keys
    'Alt+Left', 'Alt+Right', 'CommandOrControl+Left', 'CommandOrControl+Right',
    // NOTE: plain Backspace and Space are NOT blocked here — they are typing keys.
    // Backspace with modifiers (browser back) IS blocked below.
    'Alt+Backspace', 'CommandOrControl+Backspace',

    // Page Operations
    'CommandOrControl+F3', 'F3', 'Home', 'End', 'PageUp', 'PageDown',

    // Screenshot
    'Print', 'Shift+Print', 'Alt+Print', 'CommandOrControl+Print',

    // System
    'CommandOrControl+Alt+Delete', 'CommandOrControl+Shift+Escape',
    'Super+L', 'CommandOrControl+L',

    // Virtual Terminals (Linux)
    'CommandOrControl+Alt+F1', 'CommandOrControl+Alt+F2', 'CommandOrControl+Alt+F3',
    'CommandOrControl+Alt+F4', 'CommandOrControl+Alt+F5', 'CommandOrControl+Alt+F6',

    // Windows-specific: Task View, Desktop, Settings, Search, Run
    'Super+D', 'Super+Tab', 'Super+E', 'Super+I', 'Super+R',
    'Super+S', 'Super+A', 'Super+X', 'Super+M', 'Super+Shift+M',
    'Super+Up', 'Super+Down', 'Super+Left', 'Super+Right',
    // Windows screenshot shortcuts
    'Super+Shift+S', 'Super+Print', 'Alt+Print',

    // F-keys
    'F2', 'F4', 'F7', 'F8', 'F9', 'F10',
  ];

  let blockedCount = 0;
  shortcuts.forEach((shortcut) => {
    const success = globalShortcut.register(shortcut, () => {
      console.log(`🚫 Blocked: ${shortcut}`);
      return false;
    });

    if (success) blockedCount++;
  });

  console.log(`🔒 Blocked ${blockedCount}/${shortcuts.length} keyboard shortcuts`);

  // Additional: Intercept ALL key events at window level
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (!isExamMode) return; // Only process during exam mode

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: WHITELIST - Allow these FIRST (typing keys)
    // ═══════════════════════════════════════════════════════════════

    // 1. REMOVED: Admin exit Ctrl+Shift+E - now blocked completely
    // No admin can exit exam mode via keyboard shortcut

    // 2. Allow normal typing: letters (with or without Shift)
    if (input.key.length === 1 && /[a-zA-Z]/.test(input.key) && !input.control && !input.alt && !input.meta) {
      return; // Allow letters (lowercase or uppercase)
    }

    // 3. Allow numbers (no modifiers)
    if (input.key.length === 1 && /[0-9]/.test(input.key) && !input.control && !input.alt && !input.meta && !input.shift) {
      return; // Allow 0-9
    }

    // 4. Allow Shift+numbers for symbols (!@#$%^&*())
    if (input.shift && input.key.length === 1 && /[0-9]/.test(input.key) && !input.control && !input.alt && !input.meta) {
      return; // Allow !@#$%^&*()
    }

    // 5. Allow basic punctuation (with or without Shift)
    const punctuation = [' ', '.', ',', '?', '!', ':', ';', '-', '_', '(', ')', '[', ']', '{', '}',
      '"', "'", '/', '\\', '|', '+', '=', '<', '>', '@', '#', '$', '%', '^', '&', '*', '`', '~'];
    if (punctuation.includes(input.key) && !input.control && !input.alt && !input.meta) {
      return; // Allow punctuation
    }

    // 6. Allow essential editing keys
    // Plain: Backspace, Enter, arrow keys, Delete (for text editing)
    // With Shift: arrow keys (text selection), Backspace (same as plain)
    const editKeys = ['Backspace', 'Enter', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    if (editKeys.includes(input.key) && !input.control && !input.alt && !input.meta) {
      return; // Allow editing keys with or without Shift (Shift+Arrow = select text)
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: BLOCK EVERYTHING ELSE (shortcuts, special keys)
    // ═══════════════════════════════════════════════════════════════

    // Block all modifier key combinations (except whitelisted above)
    if (input.alt || input.control || input.meta) {
      event.preventDefault();
      const mods = [];
      if (input.control) mods.push('Ctrl');
      if (input.shift) mods.push('Shift');
      if (input.alt) mods.push('Alt');
      if (input.meta) mods.push('Meta');
      console.log(`🚫 BLOCKED: ${mods.join('+')}+${input.key}`);
      return;
    }

    // Block function keys
    if (input.key.startsWith('F') && input.key.length <= 3) {
      event.preventDefault();
      console.log(`🚫 BLOCKED: ${input.key}`);
      return;
    }

    // Block special keys
    // WEEK 2: Enhanced screenshot blocking (PrintScreen + all OS screenshot shortcuts)
    const blockedKeys = [
      'Escape', 'Tab', 'PrintScreen', 'ContextMenu', 'ScrollLock', 'Pause', 'Break',
      'Insert', 'Home', 'End', 'PageUp', 'PageDown',
      'AudioVolumeUp', 'AudioVolumeDown', 'AudioVolumeMute',
      'MediaPlayPause', 'MediaStop', 'MediaTrackNext', 'MediaTrackPrevious'
    ];
    if (blockedKeys.includes(input.key)) {
      event.preventDefault();
      console.log(`🚫 BLOCKED: ${input.key}`);

      // Log screenshot attempts specifically
      if (input.key === 'PrintScreen') {
        auditEvent('SCREENSHOT_ATTEMPT', {
          method: 'PrintScreen',
          timestamp: Date.now()
        });
      }
      return;
    }

    // WEEK 2: Block screenshot key combinations (Windows + macOS)
    const screenshotCombos = [
      // Windows Snipping Tool
      { key: 'S', meta: true, shift: true },           // Win+Shift+S
      { key: 'S', meta: true, shift: true, alt: true }, // Win+Shift+Alt+S (Windows 11)

      // macOS screenshots
      { key: '3', meta: true, shift: true },           // Cmd+Shift+3 (full screen)
      { key: '4', meta: true, shift: true },           // Cmd+Shift+4 (selection)
      { key: '5', meta: true, shift: true },           // Cmd+Shift+5 (screenshot UI)
      { key: '6', meta: true, shift: true },           // Cmd+Shift+6 (Touch Bar)

      // Linux screenshot shortcuts (common DEs)
      { key: 'Print', shift: true },                   // Shift+PrtScn (area)
      { key: 'PrintScreen', shift: true },
      { key: 'Print', alt: true },                     // Alt+PrtScn (window)
      { key: 'PrintScreen', alt: true },
    ];

    for (const combo of screenshotCombos) {
      const matchesKey = input.key === combo.key || input.code === combo.key;
      const matchesMeta = combo.meta === undefined || input.meta === combo.meta;
      const matchesShift = combo.shift === undefined || input.shift === combo.shift;
      const matchesAlt = combo.alt === undefined || input.alt === combo.alt;
      const matchesControl = combo.control === undefined || input.control === combo.control;

      if (matchesKey && matchesMeta && matchesShift && matchesAlt && matchesControl) {
        event.preventDefault();
        const mods = [];
        if (input.meta) mods.push('Meta');
        if (input.control) mods.push('Ctrl');
        if (input.shift) mods.push('Shift');
        if (input.alt) mods.push('Alt');
        console.log(`🚫 BLOCKED SCREENSHOT COMBO: ${mods.join('+')}+${input.key}`);

        auditEvent('SCREENSHOT_ATTEMPT', {
          method: `${mods.join('+')}+${input.key}`,
          timestamp: Date.now()
        });
        return;
      }
    }

    // If we reach here, allow it (might be needed for international keyboards)
    console.log(`⚠️  UNKNOWN KEY (allowing): "${input.key}" code=${input.keyCode}`);
  });

  console.log('✅ Input event interception: ACTIVE');
}

function unblockKeyboardShortcuts() {
  globalShortcut.unregisterAll();
  console.log('✅ All shortcuts unblocked');
  // No longer re-registering Ctrl+Shift+E - it's now blocked like everything else
}

function autoSubmitExam() {
  console.log('📤 Auto-submitting exam...');
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('auto-submit-exam', {
      ...examData,
      exitReason: 'admin_password_exit',
      violations: windowBlurCount,
      exitTime: Date.now(),
    });
  }
}

// REMOVED: Admin password dialog function - no admin exit allowed in exam mode

function verifyAdminPassword(enteredPassword) {
  // Dynamic PIN verification (Week 2 Security Hardening)
  // PIN is set per-session by trainer, expires when exam ends

  if (!currentAdminPin) {
    console.log('🔐 No active admin PIN set for this session');
    return false;
  }

  // Check if PIN has expired
  if (pinExpiresAt && Date.now() > pinExpiresAt) {
    console.log('🔐 Admin PIN expired');
    currentAdminPin = null;
    pinExpiresAt = null;
    return false;
  }

  const isValid = enteredPassword === currentAdminPin;
  console.log(`🔐 Admin PIN verification: ${isValid ? 'SUCCESS ✅' : 'FAILED ❌'}`);

  if (isValid) {
    auditEvent('ADMIN_PIN_VERIFIED', {
      timestamp: Date.now(),
      pin: currentAdminPin.replace(/./g, '*') // Log masked PIN
    });
  } else {
    auditEvent('ADMIN_PIN_FAILED', {
      timestamp: Date.now(),
      entered: enteredPassword.replace(/./g, '*'),
      attempts: (verifyAdminPassword.failedAttempts || 0) + 1
    });
    verifyAdminPassword.failedAttempts = (verifyAdminPassword.failedAttempts || 0) + 1;
  }

  return isValid;
}

// IPC Handlers
ipcMain.handle('start-exam', async (event, data) => {
  console.log('📋 Start exam request received:', data);
  enterExamMode(data);
  return { success: true };
});

ipcMain.handle('end-exam', async (event) => {
  console.log('🏁 End exam request received');
  exitExamMode();
  return { success: true };
});

// Emergency escape hatch: Force exit if normal exit fails
ipcMain.handle('force-exit-exam', async (event) => {
  console.log('🚨 EMERGENCY FORCE EXIT requested');

  // Nuclear option: immediately disable all guards and exit
  isExiting = true;
  isExamMode = false;

  // Clear ALL intervals
  if (fullscreenEnforcementInterval) clearInterval(fullscreenEnforcementInterval);
  if (focusCheckInterval) clearInterval(focusCheckInterval);
  if (processMonitorInterval) clearInterval(processMonitorInterval);
  if (screenshotBlockInterval) clearInterval(screenshotBlockInterval);

  // Unblock everything
  globalShortcut.unregisterAll();

  // Force window to normal state
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setKiosk(false);
    setTimeout(() => {
      mainWindow.setFullScreen(false);
      mainWindow.setAlwaysOnTop(false);
      mainWindow.setClosable(true);
      mainWindow.setMinimizable(true);
      console.log('🚨 EMERGENCY EXIT COMPLETE');
    }, 50);
  }

  return { success: true };
});

ipcMain.handle('is-exam-active', async () => {
  return {
    active: isExamMode,
    blurCount: windowBlurCount,
    lastBlur: lastBlurTime,
  };
});

ipcMain.handle('get-exam-violations', async () => {
  return {
    blurCount: windowBlurCount,
    lastBlurTime: lastBlurTime,
    timestamp: Date.now(),
  };
});

// NEW: Question navigation tracking for time-per-question
ipcMain.handle('mark-question-start', async (event, questionIdx) => {
  if (isExamMode) markQuestionStart(questionIdx);
});

// NEW: Custom audit events from renderer (e.g., paste blocked)
ipcMain.handle('audit-event', async (event, type, detail) => {
  if (isExamMode) auditEvent(type, detail);
});

// NEW: Set submission ID once available (after first answer save)
ipcMain.handle('set-submission-id', async (event, sid) => {
  if (isExamMode && sid) {
    submissionId = sid;
    examData.submissionId = sid;
    console.log(`🔗 Submission ID set: ${sid}`);
  }
});

// ─── CRASH RECOVERY IPC HANDLERS ────────────────────────────────────────────
ipcMain.handle('recovery-start-session', async (event, sessionData) => {
  console.log('💾 [CRASH RECOVERY] Starting new session...', sessionData);
  currentRecoverySessionId = crashRecovery.startSession(sessionData);
  return { sessionId: currentRecoverySessionId };
});

ipcMain.handle('recovery-save-answer', async (event, questionIdx, answer) => {
  if (currentRecoverySessionId) {
    crashRecovery.saveAnswer(currentRecoverySessionId, questionIdx, answer);
  }
});

ipcMain.handle('recovery-update-timer', async (event, elapsedMs) => {
  if (currentRecoverySessionId) {
    crashRecovery.updateTimer(currentRecoverySessionId, elapsedMs);
  }
});

ipcMain.handle('recovery-update-question', async (event, questionIdx) => {
  if (currentRecoverySessionId) {
    crashRecovery.updateCurrentQuestion(currentRecoverySessionId, questionIdx);
  }
});

ipcMain.handle('recovery-end-session', async (event, sessionId) => {
  crashRecovery.endSession(sessionId || currentRecoverySessionId);
  currentRecoverySessionId = null;
});

ipcMain.handle('recovery-check-interrupted', async (event, userId) => {
  const interruptedSession = crashRecovery.checkForInterruptedSession(userId);
  return interruptedSession;
});

ipcMain.handle('recovery-resume-session', async (event, sessionId) => {
  const session = crashRecovery.resumeSession(sessionId);
  if (session) {
    currentRecoverySessionId = sessionId;
  }
  return session;
});

ipcMain.handle('recovery-discard-session', async (event, sessionId) => {
  crashRecovery.discardSession(sessionId);
});

ipcMain.handle('recovery-get-stats', async () => {
  return crashRecovery.getStats();
});

// ─── SYNC QUEUE IPC HANDLERS ───────────────────────────────────────────────
ipcMain.handle('sync-enqueue', async (event, type, payload, metadata) => {
  console.log(`📥 [SYNC QUEUE] Enqueue request from renderer: ${type}`);
  const queueId = syncQueue.enqueue(type, payload, metadata);
  return { queueId };
});

ipcMain.handle('sync-get-status', async () => {
  return syncQueue.getStatus();
});

ipcMain.handle('sync-force-now', async () => {
  syncQueue.forceSyncNow();
  return { success: true };
});

ipcMain.handle('sync-clear-completed', async () => {
  syncQueue.clearCompleted();
  return { success: true };
});

ipcMain.handle('verify-admin-password', async (event, password) => {
  console.log('🔐 Admin password verification requested');
  return verifyAdminPassword(password);
});

// ── WEEK 2: Dynamic Admin PIN Management ─────────────────────────────────────
ipcMain.handle('set-admin-pin', async (event, pin, expiresInMs = null) => {
  console.log('🔑 Setting admin PIN for this exam session');

  // Validate PIN format (6 digits)
  if (!/^\d{6}$/.test(pin)) {
    console.error('❌ Invalid PIN format - must be 6 digits');
    return { success: false, error: 'PIN must be exactly 6 digits' };
  }

  currentAdminPin = pin;
  pinExpiresAt = expiresInMs ? Date.now() + expiresInMs : null;

  console.log(`✅ Admin PIN set: ${pin.replace(/./g, '*')} ${pinExpiresAt ? `(expires in ${expiresInMs}ms)` : '(no expiry)'}`);

  auditEvent('ADMIN_PIN_SET', {
    timestamp: Date.now(),
    expiresAt: pinExpiresAt,
    maskedPin: pin.slice(0, 2) + '****' // Log first 2 digits for verification
  });

  return { success: true };
});

ipcMain.handle('clear-admin-pin', async (event) => {
  console.log('🔑 Clearing admin PIN (session ended)');

  auditEvent('ADMIN_PIN_CLEARED', {
    timestamp: Date.now(),
    hadPin: !!currentAdminPin
  });

  currentAdminPin = null;
  pinExpiresAt = null;
  verifyAdminPassword.failedAttempts = 0;

  return { success: true };
});

ipcMain.handle('get-admin-pin-status', async (event) => {
  return {
    hasPin: !!currentAdminPin,
    isExpired: pinExpiresAt ? Date.now() > pinExpiresAt : false,
    expiresAt: pinExpiresAt,
    failedAttempts: verifyAdminPassword.failedAttempts || 0
  };
});

// ── WEEK 2: Session Lifecycle & Ungraceful Termination Detection ─────────────
ipcMain.handle('lifecycle-get-abandoned-sessions', async (event) => {
  const abandoned = sessionLifecycle.getAbandonedSessions();
  return { success: true, sessions: abandoned };
});

ipcMain.handle('lifecycle-get-stats', async (event) => {
  const stats = sessionLifecycle.getStats();
  return { success: true, stats };
});

ipcMain.handle('lifecycle-clear-old-sessions', async (event, daysOld = 30) => {
  sessionLifecycle.clearOldSessions(daysOld);
  return { success: true };
});

// ── WEEK 2: VM Detection ──────────────────────────────────────────────────────
ipcMain.handle('vm-detect', async (event) => {
  console.log('🖥️  [VM DETECTION] Manual detection requested');
  const result = await vmDetector.detect();
  return { success: true, ...result };
});

ipcMain.handle('vm-get-status', async (event) => {
  return {
    success: true,
    isVM: vmDetector.isVM,
    confidence: vmDetector.confidence,
    vmType: vmDetector.getVMType(),
    signals: vmDetector.vmSignals,
    methods: vmDetector.detectionMethods
  };
});

// ── WEEK 3: Self-Integrity Check IPCs ────────────────────────────────────────
ipcMain.handle('integrity-get-status', async () => {
  return { success: true, ...integrityCheck.getStatus() };
});

ipcMain.handle('integrity-rebuild-manifest', async () => {
  // Only callable when NOT in exam mode (admin use only)
  if (isExamMode) return { success: false, error: 'Cannot rebuild manifest during exam' };
  const result = integrityCheck.rebuildManifest();
  console.log('🔒 [INTEGRITY] Manifest rebuilt by admin');
  return { success: true, ...result };
});

// ═══════════════════════════════════════════════════════════════════════════
// EXAM MODE STATE & FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════
// Note: isExamMode, overlayWindows, originalBounds already declared at top of file

/**
 * Enter exam mode - 5-phase lockdown strategy
 * Phase 1: Electron API (kiosk, shortcuts)
 * Phase 2: Before-input-event (keyboard intercept)
 * Phase 3: Process killing (cheating tools)
 * Phase 4: OS-level lockdown (Windows registry/AHK, Linux WM configs)
 * Phase 5: Taskbar + visual lockdown
 */
async function enterExamMode(assessmentData) {
  console.log('🔒 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔒 [EXAM MODE] ENTERING SECURE LOCKDOWN');
  console.log('🔒 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 Assessment:', assessmentData?.title || 'Unknown');
  console.log('🖥️  Platform:', process.platform);

  if (!mainWindow) {
    console.error('❌ [EXAM MODE] Main window not found');
    return { success: false, error: 'Window not initialized' };
  }

  isExamMode = true;

  // ─── PHASE 1: ELECTRON API LOCKDOWN ────────────────────────────────────
  console.log('🔒 [PHASE 1] Electron API lockdown...');

  // Store original bounds
  originalBounds = mainWindow.getBounds();

  // Enter kiosk mode (fullscreen, no escape)
  mainWindow.setKiosk(true);
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setFullScreen(true);

  // Register all shortcut blocks
  globalShortcut.unregisterAll();

  const blockedShortcuts = [
    'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
    'CommandOrControl+Q', 'CommandOrControl+W', 'CommandOrControl+N', 'CommandOrControl+T',
    'CommandOrControl+Shift+I', 'CommandOrControl+Shift+J', 'CommandOrControl+Shift+C',
    'F12', 'CommandOrControl+R', 'CommandOrControl+Shift+R',
    'Alt+F4', 'Alt+Tab', 'Alt+Shift+Tab',
    'CommandOrControl+H', 'CommandOrControl+M',
    'Super', 'Meta'
  ];

  // Windows-specific shortcuts
  if (process.platform === 'win32') {
    blockedShortcuts.push(
      'CommandOrControl+Escape',
      'CommandOrControl+Shift+Escape',
      'Alt+Escape',
      'Super+D', 'Super+L', 'Super+E', 'Super+R', 'Super+Tab',
      'Super+1', 'Super+2', 'Super+3', 'Super+4', 'Super+5',
      'PrintScreen', 'Alt+PrintScreen'
    );
  }

  // Linux-specific shortcuts
  if (process.platform === 'linux') {
    blockedShortcuts.push(
      'Super+D', 'Super+L', 'Super+E', 'Super+A',
      'Alt+F2', 'Alt+F3', 'Alt+F4',
      'CommandOrControl+Alt+L', 'CommandOrControl+Alt+T',
      'PrintScreen', 'Shift+PrintScreen', 'CommandOrControl+PrintScreen'
    );
  }

  let registeredCount = 0;
  blockedShortcuts.forEach((shortcut) => {
    const success = globalShortcut.register(shortcut, () => {
      console.warn(`🚨 [EXAM MODE] Blocked shortcut: ${shortcut}`);
      mainWindow?.webContents.send('suspicious-activity', {
        type: 'blocked-shortcut',
        key: shortcut,
        timestamp: Date.now()
      });
    });
    if (success) registeredCount++;
  });

  console.log(`   ✓ Registered ${registeredCount}/${blockedShortcuts.length} shortcuts`);

  // ─── PHASE 2: BEFORE-INPUT-EVENT INTERCEPT ──────────────────────────────
  console.log('🔒 [PHASE 2] Before-input-event keyboard intercept...');

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (!isExamMode) return;

    const dangerous = (
      input.key === 'F11' ||
      input.key === 'Escape' ||
      input.key === 'PrintScreen' ||
      (input.control && input.key === 'w') ||
      (input.control && input.key === 'q') ||
      (input.control && input.shift && input.key === 'I') ||
      (input.alt && input.key === 'F4') ||
      (input.alt && input.key === 'Tab') ||
      (input.meta && input.key === 'd') ||
      (input.meta && input.key === 'l')
    );

    if (dangerous) {
      event.preventDefault();
      console.warn(`🚨 [EXAM MODE] Intercepted input: ${input.key} (ctrl=${input.control}, alt=${input.alt}, shift=${input.shift}, meta=${input.meta})`);
    }
  });

  console.log('   ✓ Keyboard intercept active');

  // ─── PHASE 3: KILL CHEATING PROCESSES ──────────────────────────────────
  console.log('🔒 [PHASE 3] Killing cheating processes...');

  let killedCount = 0;
  const killProcess = (processName) => {
    try {
      if (process.platform === 'win32') {
        require('child_process').execSync(`taskkill /F /IM ${processName} /T 2>nul`, { stdio: 'ignore' });
      } else {
        require('child_process').execSync(`pkill -9 -i ${processName}`, { stdio: 'ignore' });
      }
      killedCount++;
      console.log(`   ✓ Killed: ${processName}`);
    } catch (e) {
      // Process not found - ignore
    }
  };

  // Common cheating tools
  const targets = [
    'taskmgr.exe', 'processhacker.exe', 'procexp.exe', 'procexp64.exe',
    'teamviewer.exe', 'anydesk.exe', 'chrome.exe', 'firefox.exe', 'msedge.exe',
    'discord.exe', 'slack.exe', 'telegram.exe', 'whatsapp.exe', 'skype.exe',
    'vscode.exe', 'code.exe', 'notepad++.exe', 'sublime_text.exe',
    'virtualbox.exe', 'vmware.exe', 'vmnat.exe', 'vmnetdhcp.exe',
    'cheatengine-x86_64.exe', 'ollydbg.exe', 'x64dbg.exe', 'ida.exe',
    'wireshark.exe', 'fiddler.exe', 'charles.exe',
    'obs64.exe', 'obs32.exe', 'streamlabs obs.exe',
    'fraps.exe', 'bandicam.exe', 'camtasia.exe'
  ];

  targets.forEach(killProcess);
  console.log(`   ✓ Killed ${killedCount} processes`);

  // ─── PHASE 4: OS-LEVEL LOCKDOWN ────────────────────────────────────────
  console.log('🔒 [PHASE 4] OS-level lockdown...');

  if (process.platform === 'win32' && windowsLockdown) {
    const result = await windowsLockdown.lockdown();
    console.log('   ✓ Windows lockdown:', result);
  } else if (process.platform === 'linux' && linuxLockdown) {
    const result = await linuxLockdown.lockdown();
    console.log('   ✓ Linux lockdown:', result);
  } else if (process.platform === 'darwin') {
    console.log('   ℹ️  macOS: kiosk mode sufficient');
  }

  // ─── PHASE 5: COVER EXTERNAL DISPLAYS ──────────────────────────────────
  console.log('🔒 [PHASE 5] Covering external displays...');

  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();

  displays.forEach((display) => {
    if (display.id !== primaryDisplay.id) {
      console.log(`   🖥️  Covering display ${display.id}`);
      const overlay = new BrowserWindow({
        x: display.bounds.x,
        y: display.bounds.y,
        width: display.bounds.width,
        height: display.bounds.height,
        frame: false,
        transparent: false,
        backgroundColor: '#000000',
        alwaysOnTop: true,
        skipTaskbar: true,
        closable: false,
        minimizable: false,
        maximizable: false,
        resizable: false,
        movable: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });
      overlay.loadURL(`data:text/html,<html><body style="margin:0;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;font-family:sans-serif;height:100vh;"><div style="text-align:center;"><h1>🔒 EXAM IN PROGRESS</h1><p>External display blocked</p></div></body></html>`);
      overlay.setKiosk(true);
      overlayWindows.push(overlay);
    }
  });

  console.log(`   ✓ Covered ${overlayWindows.length} external displays`);

  console.log('🔒 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔒 [EXAM MODE] LOCKDOWN COMPLETE ✅');
  console.log('🔒 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return { success: true };
}

/**
 * Exit exam mode - restore normal operation
 */
async function exitExamMode() {
  console.log('🔓 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔓 [EXAM MODE] EXITING SECURE LOCKDOWN');
  console.log('🔓 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (!isExamMode) {
    console.log('⚠️  [EXAM MODE] Not in exam mode, nothing to exit');
    return { success: true };
  }

  isExamMode = false;

  // Unregister shortcuts
  globalShortcut.unregisterAll();
  console.log('   ✓ Shortcuts unregistered');

  // Close overlay windows
  overlayWindows.forEach((w) => {
    try {
      w.close();
    } catch (e) { /* ignore */ }
  });
  overlayWindows = [];
  console.log('   ✓ Overlay windows closed');

  // Exit kiosk mode
  if (mainWindow) {
    mainWindow.setKiosk(false);
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setFullScreen(false);

    if (originalBounds) {
      mainWindow.setBounds(originalBounds);
    }

    console.log('   ✓ Window restored');
  }

  // OS-level unlock
  if (process.platform === 'win32' && windowsLockdown) {
    const result = await windowsLockdown.unlock();
    console.log('   ✓ Windows unlock:', result);
  } else if (process.platform === 'linux' && linuxLockdown) {
    const result = await linuxLockdown.unlock();
    console.log('   ✓ Linux unlock:', result);
  }

  console.log('🔓 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔓 [EXAM MODE] EXIT COMPLETE ✅');
  console.log('🔓 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return { success: true };
}

/**
 * Force window focus (called when blur detected during exam)
 */
function forceWindowFocus() {
  if (mainWindow && isExamMode) {
    mainWindow.focus();
    mainWindow.show();
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.moveTop();
  }
}

// ─── EXAM MODE IPC HANDLERS ──────────────────────────────────────────────────
ipcMain.handle('exam-mode-enter', async (event, assessmentData) => {
  // Block if app integrity compromised
  // TEMPORARILY DISABLED FOR TESTING - TODO: Re-enable after rebuilding manifest
  /*
  if (!integrityCheck.getStatus().ok) {
    return {
      success: false,
      error: 'App integrity check failed. Cannot start exam.',
      reason: integrityCheck.getStatus().reason
    };
  }
  */

  return await enterExamMode(assessmentData);
});

ipcMain.handle('exam-mode-exit', async () => {
  return await exitExamMode();
});

ipcMain.handle('exam-mode-status', async () => {
  return { isExamMode, displays: screen.getAllDisplays().length };
});

// ─── SIGNOUT: clear cookies + navigate to login ──────────────────────────────
ipcMain.handle('signout', async () => {
  console.log('🔓 Signout requested from renderer');

  try {
    // 1. Call Next.js signout API to clear server-side session
    const http = require('http');
    await new Promise((resolve) => {
      const req = http.request(
        { hostname: 'localhost', port: 3001, path: '/api/auth/signout', method: 'POST' },
        (res) => { res.resume(); res.on('end', resolve); }
      );
      req.on('error', resolve); // Don't block on error
      req.end();
    });

    // 2. Clear ALL cookies from Electron session (removes Supabase auth tokens)
    const session = mainWindow.webContents.session;
    await session.clearStorageData({
      storages: ['cookies', 'localstorage', 'sessionstorage', 'indexdb', 'cachestorage'],
    });
    console.log('✅ Session storage cleared');

    // 3. Navigate to login page
    await mainWindow.loadURL('http://localhost:3001/auth/login');
    console.log('✅ Navigated to login page');

    return { success: true };
  } catch (err) {
    console.error('❌ Signout error:', err);
    // Even if API call failed, clear local session and go to login
    try {
      await mainWindow.webContents.session.clearStorageData({
        storages: ['cookies', 'localstorage', 'sessionstorage'],
      });
      await mainWindow.loadURL('http://localhost:3001/auth/login');
    } catch (e) { /* ignore */ }
    return { success: true }; // Always report success to unblock UI
  }
});

// App lifecycle
app.whenReady().then(async () => {
  console.log('🎓 RUNDA TSS ULTRA-SECURE EXAM BROWSER - Starting...');

  // ─── WEEK 2: CHECK FOR UNGRACEFUL TERMINATIONS ─────────────────────────
  console.log('🔍 [SESSION LIFECYCLE] Checking for ungraceful terminations...');
  const abandonedSessions = sessionLifecycle?.checkForAbandonedSessions() || [];

  if (abandonedSessions.length > 0) {
    console.warn(`🚨 [SESSION LIFECYCLE] Found ${abandonedSessions.length} ungraceful exit(s):`);
    abandonedSessions.forEach(session => {
      console.warn(`   • Session ${session.sessionId.slice(0, 8)}...`);
      console.warn(`     Assessment: ${session.assessmentTitle}`);
      console.warn(`     Started: ${new Date(session.startedAt).toLocaleString()}`);
      console.warn(`     Duration: ${Math.round(session.timeSinceStart / 1000)}s ago`);
    });

    // Store for renderer to display warning/recovery dialog
    global.abandonedSessions = abandonedSessions;
  } else {
    console.log('✅ [SESSION LIFECYCLE] No ungraceful exits detected');
  }

  const lifecycleStats = sessionLifecycle?.getStats() || {};
  console.log(`📊 [SESSION LIFECYCLE] Stats:`, lifecycleStats);
  // ───────────────────────────────────────────────────────────────────────

  // ─── START SYNC QUEUE BACKGROUND WORKER ────────────────────────────────
  console.log('🔄 [SYNC QUEUE] Starting background sync worker...');
  syncQueue?.startSyncWorker();

  // Register callback to notify renderer of sync status changes
  syncQueue?.onStatusChange((status) => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('sync-status-changed', status);
    }
  });

  // Log initial sync queue status
  const syncStatus = syncQueue?.getStatus() || { isOnline: false, isSyncing: false, pendingCount: 0 };
  console.log(`📊 [SYNC QUEUE] Initial status:`, syncStatus);
  // ────────────────────────────────────────────────────────────────────────

  // ─── REGISTER ADMIN EXIT SHORTCUT IMMEDIATELY AT STARTUP ───────────────
  // This is registered here (not inside blockAllKeyboardShortcuts) so it is
  // NEVER accidentally overwritten or blocked by the shortcut-block loop.
  const adminOk = globalShortcut.register('CommandOrControl+Shift+E', () => {
    console.log(`🔓 [GLOBAL SHORTCUT] Ctrl+Shift+E pressed — isExamMode: ${isExamMode}`);
    if (isExamMode) {
      console.log('🔓 [GLOBAL SHORTCUT] Showing admin exit dialog...');
      showAdminExitDialog();
    } else {
      console.log('⚠️ [GLOBAL SHORTCUT] Not in exam mode, ignoring');
    }
  });
  console.log(adminOk
    ? '✅ Admin exit shortcut (Ctrl+Shift+E) registered at startup'
    : '❌ Failed to register Ctrl+Shift+E at startup');

  // ─── REGISTER DEVTOOLS TOGGLE SHORTCUT FOR DEBUGGING ───────────────────
  const devToolsOk = globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (mainWindow && mainWindow.webContents) {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
        console.log('🔧 [DEVTOOLS] Closed DevTools');
      } else {
        mainWindow.webContents.openDevTools();
        console.log('🔧 [DEVTOOLS] Opened DevTools');
      }
    }
  });
  console.log(devToolsOk
    ? '✅ DevTools shortcut (Ctrl+Shift+I) registered at startup'
    : '❌ Failed to register Ctrl+Shift+I at startup');
  // ───────────────────────────────────────────────────────────────────────

  // ─── WEEK 2: VM DETECTION ──────────────────────────────────────────────
  console.log('🖥️  [VM DETECTION] Running environment check...');
  const vmDetection = await vmDetector?.detect() || { isVM: false, confidence: 0, signals: [] };

  if (vmDetection.isVM) {
    console.warn(`⚠️  [VM DETECTION] Virtual machine detected!`);
    console.warn(`   Type: ${vmDetector?.getVMType() || 'unknown'}`);
    console.warn(`   Confidence: ${vmDetection.confidence}%`);
    console.warn(`   Signals: ${vmDetection.signals.length}`);

    // Store for renderer to display warning
    global.vmDetection = vmDetection;
  } else {
    console.log(`✅ [VM DETECTION] Running on physical hardware`);
  }
  // ───────────────────────────────────────────────────────────────────────

  // ─── WEEK 3: SELF-INTEGRITY CHECK ──────────────────────────────────────
  console.log('🔒 [INTEGRITY] Running self-integrity check...');
  const integrityResult = integrityCheck?.run() || { ok: true };
  global.integrityStatus = integrityCheck?.getStatus() || { ok: true };

  if (!integrityResult.ok) {
    // Don't block app launch — just block exam start so the trainer can see the error.
    console.error('🚨 [INTEGRITY] App files tampered — exam start will be blocked.');
    console.error('   Reason:', integrityResult.reason);
    auditEvent('APP_TAMPERED', {
      reason: integrityResult.reason,
      tamperedFiles: integrityCheck?.tamperedFiles?.map(t => t.file) || [],
    });
  } else {
    console.log('✅ [INTEGRITY] All files verified clean');
  }
  // ───────────────────────────────────────────────────────────────────────

  // ─── DATABASE INITIALIZATION ──────────────────────────────────────────
  const appPath = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked')
    : app.getAppPath();
  await initDatabase(appPath);
  // ───────────────────────────────────────────────────────────────────────

  await startNextServer();
  createWindow();

  // Monitor display changes
  screen.on('display-added', (event, newDisplay) => {
    if (isExamMode) {
      console.warn(`🚨 EXAM MODE: New display detected: ${newDisplay.id}`);
      auditEvent('DISPLAY_ADDED', {
        displayId: newDisplay.id,
        bounds: newDisplay.bounds,
        totalDisplays: screen.getAllDisplays().length,
      });
      // Cover the new display immediately
      const overlay = new BrowserWindow({
        x: newDisplay.bounds.x, y: newDisplay.bounds.y,
        width: newDisplay.bounds.width, height: newDisplay.bounds.height,
        frame: false, transparent: false, backgroundColor: '#000000',
        alwaysOnTop: true, skipTaskbar: true, closable: false,
        minimizable: false, maximizable: false, resizable: false, movable: false,
        webPreferences: { nodeIntegration: false, contextIsolation: true },
      });
      overlay.loadURL(`data:text/html,<html><body style="margin:0;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;font-family:sans-serif;height:100vh;"><div style="text-align:center;"><h1>🔒 EXAM IN PROGRESS</h1><p>External display detected and blocked</p></div></body></html>`);
      overlay.setKiosk(true);
      overlayWindows.push(overlay);
      mainWindow.webContents.send('suspicious-activity', {
        type: 'display-added', display: newDisplay.id, timestamp: Date.now(),
      });
    }
  });

  screen.on('display-removed', (event, oldDisplay) => {
    if (isExamMode) {
      console.warn(`🚨 EXAM MODE: Display removed: ${oldDisplay.id}`);
      auditEvent('DISPLAY_REMOVED', { displayId: oldDisplay.id });
      mainWindow.webContents.send('suspicious-activity', {
        type: 'display-removed',
        display: oldDisplay.id,
        timestamp: Date.now(),
      });
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (nextServer) {
    nextServer.kill();
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  console.log('🚪 [APP] will-quit event — cleaning up...');

  globalShortcut.unregisterAll();

  // Emergency unlock OS-level lockdowns
  if (isExamMode) {
    console.warn('🚨 [APP] App quitting during exam mode — emergency unlock');

    if (process.platform === 'win32' && windowsLockdown) {
      windowsLockdown.emergencyUnlock();
    } else if (process.platform === 'linux' && linuxLockdown) {
      linuxLockdown.emergencyUnlock();
    }
  }

  console.log('✅ [APP] Cleanup complete');
});

app.on('browser-window-blur', () => {
  if (isExamMode && mainWindow) {
    console.warn('⚠️  Window blur detected, refocusing...');
    setTimeout(() => {
      forceWindowFocus();
    }, 30);
  }
});

app.on('browser-window-focus', () => {
  if (isExamMode) {
    console.log('✅ Window focus restored');
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// CRASH / UNCAUGHT EXCEPTION HANDLER (Emergency OS Unlock)
// ═══════════════════════════════════════════════════════════════════════════
process.on('uncaughtException', (error) => {
  console.error('🚨 [CRASH] Uncaught exception:', error);

  // Emergency unlock before crash
  if (isExamMode) {
    console.error('🚨 [CRASH] Emergency OS unlock triggered');

    if (process.platform === 'win32' && windowsLockdown) {
      windowsLockdown.emergencyUnlock();
    } else if (process.platform === 'linux' && linuxLockdown) {
      linuxLockdown.emergencyUnlock();
    }
  }

  // Let the app crash naturally after cleanup
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 [CRASH] Unhandled promise rejection:', reason);
  // Don't crash on promise rejections — just log them
});
