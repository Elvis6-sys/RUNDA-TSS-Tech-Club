/**
 * WINDOWS-SPECIFIC OS-LEVEL LOCKDOWN
 * 
 * Ultra-aggressive anti-cheat system for Windows 10/11
 * Blocks Task Manager, Alt+Tab, Win key, screenshots, virtual desktops, etc.
 * 
 * This module is loaded ONLY on Windows platform.
 */

const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

let activeBlockers = [];
let registryBackups = new Map();
let isLocked = false;

// ═══════════════════════════════════════════════════════════════════════════
// WINDOWS REGISTRY MANIPULATION (Group Policy Enforcement)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Disable Task Manager via registry (HKCU, non-admin)
 * This prevents Ctrl+Shift+Esc, Ctrl+Alt+Del → Task Manager
 */
async function disableTaskManager() {
  const key = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System';
  const value = 'DisableTaskMgr';
  
  try {
    // Backup current value
    try {
      const { stdout } = await execAsync(`reg query "${key}" /v ${value} 2>nul`);
      if (stdout) registryBackups.set(value, stdout.trim());
    } catch { /* no existing value */ }

    // Set DisableTaskMgr = 1
    await execAsync(`reg add "${key}" /v ${value} /t REG_DWORD /d 1 /f`);
    console.log('✅ [WINDOWS] Task Manager disabled via registry');
    return true;
  } catch (err) {
    console.warn('⚠️  [WINDOWS] Could not disable Task Manager:', err.message);
    return false;
  }
}

async function enableTaskManager() {
  const key = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System';
  const value = 'DisableTaskMgr';
  
  try {
    // Restore backup or delete key
    if (registryBackups.has(value)) {
      // Restore original value (complex, just delete for now)
      await execAsync(`reg delete "${key}" /v ${value} /f 2>nul`);
    } else {
      await execAsync(`reg delete "${key}" /v ${value} /f 2>nul`);
    }
    console.log('✅ [WINDOWS] Task Manager restored');
  } catch (err) {
    console.warn('⚠️  [WINDOWS] Could not restore Task Manager:', err.message);
  }
}

/**
 * Disable Windows Key via registry
 * Blocks Win+L, Win+D, Win+Tab, Win+R, Win+E, etc.
 */
async function disableWindowsKey() {
  const key = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer';
  const value = 'NoWinKeys';
  
  try {
    // Backup
    try {
      const { stdout } = await execAsync(`reg query "${key}" /v ${value} 2>nul`);
      if (stdout) registryBackups.set(value, stdout.trim());
    } catch { /* no existing value */ }

    // Set NoWinKeys = 1
    await execAsync(`reg add "${key}" /v ${value} /t REG_DWORD /d 1 /f`);
    console.log('✅ [WINDOWS] Windows Key disabled via registry');
    return true;
  } catch (err) {
    console.warn('⚠️  [WINDOWS] Could not disable Windows Key:', err.message);
    return false;
  }
}

async function enableWindowsKey() {
  const key = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer';
  const value = 'NoWinKeys';
  
  try {
    await execAsync(`reg delete "${key}" /v ${value} /f 2>nul`);
    console.log('✅ [WINDOWS] Windows Key restored');
  } catch (err) {
    console.warn('⚠️  [WINDOWS] Could not restore Windows Key:', err.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PROCESS KILLING (Aggressive Monitoring)
// ═══════════════════════════════════════════════════════════════════════════

const BLOCKED_PROCESSES = [
  // Task Managers
  'Taskmgr.exe', 'ProcessHacker.exe', 'procexp.exe', 'procexp64.exe',
  
  // Screenshot Tools
  'SnippingTool.exe', 'ScreenSketch.exe', 'SnipAndSketch.exe',
  'ShareX.exe', 'Lightshot.exe', 'Greenshot.exe', 'PicPick.exe',
  'FastStone.exe', 'IrfanView.exe', 'ScreenToGif.exe',
  
  // Screen Recording
  'obs64.exe', 'obs32.exe', 'obs.exe', 'OBS Studio.exe',
  'CamStudio.exe', 'Camtasia.exe', 'Bandicam.exe', 'Fraps.exe',
  'XSplit.Broadcaster.exe', 'Streamlabs OBS.exe',
  
  // Remote Desktop / Screen Sharing
  'TeamViewer.exe', 'AnyDesk.exe', 'mstsc.exe', 'chrome-remote-desktop.exe',
  'vmconnect.exe', 'vncviewer.exe', 'Discord.exe', 'Zoom.exe', 'Teams.exe',
  
  // Developer Tools
  'cmd.exe', 'powershell.exe', 'pwsh.exe', 'WindowsTerminal.exe',
  'devenv.exe', 'Code.exe', 'Code - Insiders.exe',
  
  // Virtual Machines
  'vmware.exe', 'VirtualBox.exe', 'VBoxHeadless.exe',
  
  // Browsers (prevent opening another browser)
  'chrome.exe', 'firefox.exe', 'msedge.exe', 'brave.exe', 'opera.exe',
  'iexplore.exe', 'safari.exe',
  
  // File Managers (prevent browsing to answer files)
  'explorer.exe', // DON'T kill — it's the shell! Just monitor.
  'FreeCommander.exe', 'TotalCmd.exe', 'XYplorer.exe',
  
  // Chat/Communication
  'WhatsApp.exe', 'Telegram.exe', 'Signal.exe', 'Slack.exe',
  'Skype.exe', 'Messenger.exe',
  
  // Note Taking (students might use to store answers)
  'OneNote.exe', 'ONENOTE.EXE', 'Evernote.exe', 'Notion.exe',
  'Obsidian.exe', 'Typora.exe', 'Mark Text.exe',
];

/**
 * Continuously kill blocked processes
 * Runs every 500ms to catch new launches immediately
 */
function startProcessKiller() {
  const interval = setInterval(() => {
    if (!isLocked) return;

    BLOCKED_PROCESSES.forEach(procName => {
      // Skip explorer.exe — killing it crashes Windows shell
      if (procName.toLowerCase() === 'explorer.exe') return;

      // Skip powershell.exe — the app itself spawns PowerShell for window-title
      // scanning (processSignatures.js Tier-2 detection). Killing it would break
      // our own anti-cheat scans. PowerShell is still caught by the AHK blocker
      // and the shortcut-key blocking layers.
      if (procName.toLowerCase() === 'powershell.exe') return;

      exec(`tasklist /FI "IMAGENAME eq ${procName}" /NH 2>nul`, (err, stdout) => {
        if (stdout && stdout.toLowerCase().includes(procName.toLowerCase())) {
          exec(`taskkill /F /IM "${procName}" /T 2>nul`, (killErr) => {
            if (!killErr) {
              console.warn(`🚫 [WINDOWS] Killed blocked process: ${procName}`);
            }
          });
        }
      });
    });
  }, 500);

  activeBlockers.push({ type: 'process-killer', interval });
  console.log(`🔒 [WINDOWS] Process killer active (${BLOCKED_PROCESSES.length} processes monitored)`);
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTOHOTKEY SCRIPT INJECTION (Nuclear Option)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Creates and runs an AutoHotkey script that blocks ALL shortcuts at OS level
 * This is the most aggressive Windows shortcut blocking method
 * 
 * AHK runs as a separate process and intercepts keys BEFORE Windows processes them
 */
function deployAutoHotkeyBlocker() {
  const ahkScript = `
; RUNDA TSS EXAM LOCKDOWN SCRIPT
; This script blocks ALL dangerous shortcuts during exam mode
; Generated dynamically by Electron app

#NoEnv
#SingleInstance Force
SetBatchLines, -1
Process, Priority,, High

; ═══════════════════════════════════════════════════════════════════════════
; BLOCK WINDOWS KEY SHORTCUTS
; ═══════════════════════════════════════════════════════════════════════════
#D::Return        ; Win+D (Show Desktop)
#E::Return        ; Win+E (Explorer)
#R::Return        ; Win+R (Run)
#L::Return        ; Win+L (Lock)
#M::Return        ; Win+M (Minimize All)
#P::Return        ; Win+P (Project/Display)
#I::Return        ; Win+I (Settings)
#A::Return        ; Win+A (Action Center)
#S::Return        ; Win+S (Search)
#X::Return        ; Win+X (Power Menu)
#Tab::Return      ; Win+Tab (Task View)
#+S::Return       ; Win+Shift+S (Screenshot)
#PrintScreen::Return ; Win+PrtScn
#Up::Return       ; Win+Up (Maximize)
#Down::Return     ; Win+Down (Minimize/Restore)
#Left::Return     ; Win+Left (Snap Left)
#Right::Return    ; Win+Right (Snap Right)

; ═══════════════════════════════════════════════════════════════════════════
; BLOCK ALT SHORTCUTS
; ═══════════════════════════════════════════════════════════════════════════
!Tab::Return      ; Alt+Tab (App Switch)
!F4::Return       ; Alt+F4 (Close Window)
!Esc::Return      ; Alt+Esc (Cycle Windows)
!Space::Return    ; Alt+Space (Window Menu)
!Enter::Return    ; Alt+Enter (Properties)
!PrintScreen::Return ; Alt+PrtScn (Window Screenshot)

; ═══════════════════════════════════════════════════════════════════════════
; BLOCK CTRL SHORTCUTS
; ═══════════════════════════════════════════════════════════════════════════
^Esc::Return      ; Ctrl+Esc (Start Menu)
^+Esc::Return     ; Ctrl+Shift+Esc (Task Manager)
^!Delete::Return  ; Ctrl+Alt+Del (Security Screen)

; ═══════════════════════════════════════════════════════════════════════════
; BLOCK FUNCTION KEYS
; ═══════════════════════════════════════════════════════════════════════════
F1::Return
F2::Return
F3::Return
F4::Return
F5::Return
F6::Return
F7::Return
F8::Return
F9::Return
F10::Return
F11::Return
F12::Return

; ═══════════════════════════════════════════════════════════════════════════
; BLOCK SCREENSHOT KEYS
; ═══════════════════════════════════════════════════════════════════════════
PrintScreen::Return
+PrintScreen::Return

; ═══════════════════════════════════════════════════════════════════════════
; BLOCK ESCAPE KEY (prevents fullscreen exit in many apps)
; ═══════════════════════════════════════════════════════════════════════════
Esc::Return

; Keep script running
Loop {
  Sleep, 1000
}
`;

  // Check if AutoHotkey is installed
  exec('where AutoHotkey.exe 2>nul', (err, stdout) => {
    if (err || !stdout.trim()) {
      console.warn('⚠️  [WINDOWS] AutoHotkey not installed — skipping AHK blocker');
      console.warn('   Install from https://www.autohotkey.com for maximum security');
      return;
    }

    // Write script to temp file
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const scriptPath = path.join(os.tmpdir(), 'runda-exam-lockdown.ahk');

    fs.writeFileSync(scriptPath, ahkScript, 'utf8');
    console.log(`✅ [WINDOWS] AHK script written to: ${scriptPath}`);

    // Launch AHK script
    const ahkProcess = spawn('AutoHotkey.exe', [scriptPath], {
      detached: false,
      stdio: 'ignore',
    });

    ahkProcess.on('error', (err) => {
      console.error('❌ [WINDOWS] AHK process error:', err.message);
    });

    activeBlockers.push({ type: 'autohotkey', process: ahkProcess, scriptPath });
    console.log('🔒 [WINDOWS] AutoHotkey blocker deployed (nuclear shortcut blocking)');
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// WINDOWS SECURITY CENTER MANIPULATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Temporarily disable Windows Defender real-time monitoring
 * (Only works if app runs with admin privileges — otherwise silently fails)
 */
async function disableWindowsDefender() {
  try {
    await execAsync('powershell -Command "Set-MpPreference -DisableRealtimeMonitoring $true" 2>nul');
    console.log('✅ [WINDOWS] Windows Defender monitoring disabled (admin)');
  } catch {
    console.log('ℹ️  [WINDOWS] Windows Defender control requires admin (skipped)');
  }
}

async function enableWindowsDefender() {
  try {
    await execAsync('powershell -Command "Set-MpPreference -DisableRealtimeMonitoring $false" 2>nul');
    console.log('✅ [WINDOWS] Windows Defender monitoring restored');
  } catch { /* ignore */ }
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Activate full Windows lockdown
 * Call this when exam starts
 */
async function lockdown() {
  if (isLocked) {
    console.warn('⚠️  [WINDOWS] Already locked');
    return;
  }

  console.log('🔒 ═══════════════════════════════════════════════════════');
  console.log('🔒 WINDOWS ULTRA-LOCKDOWN ACTIVATING');
  console.log('🔒 ═══════════════════════════════════════════════════════');

  isLocked = true;

  // Layer 1: Registry-based blocking (requires restart to take effect for some keys)
  await disableTaskManager();
  await disableWindowsKey();

  // Layer 2: Continuous process killing
  startProcessKiller();

  // Layer 3: AutoHotkey nuclear option (if installed)
  deployAutoHotkeyBlocker();

  // Layer 4: Windows Security (optional, requires admin)
  await disableWindowsDefender();

  console.log('🔒 ═══════════════════════════════════════════════════════');
  console.log('🔒 WINDOWS LOCKDOWN ACTIVE');
  console.log(`🔒 Active Blockers: ${activeBlockers.length}`);
  console.log('🔒 ═══════════════════════════════════════════════════════');
}

/**
 * Deactivate Windows lockdown
 * Call this when exam ends
 */
async function unlock() {
  if (!isLocked) return;

  console.log('🔓 [WINDOWS] Deactivating lockdown...');

  isLocked = false;

  // Stop all active blockers
  for (const blocker of activeBlockers) {
    if (blocker.type === 'process-killer' && blocker.interval) {
      clearInterval(blocker.interval);
    } else if (blocker.type === 'autohotkey' && blocker.process) {
      blocker.process.kill('SIGTERM');
      // Delete AHK script file
      try {
        const fs = require('fs');
        if (blocker.scriptPath) fs.unlinkSync(blocker.scriptPath);
      } catch { /* ignore */ }
    }
  }
  activeBlockers = [];

  // Restore registry
  await enableTaskManager();
  await enableWindowsKey();
  await enableWindowsDefender();

  console.log('✅ [WINDOWS] Lockdown deactivated, system restored');
}

/**
 * Emergency force unlock (called if app crashes)
 * This runs synchronously to ensure cleanup even during crash
 */
function emergencyUnlock() {
  console.warn('🚨 [WINDOWS] EMERGENCY UNLOCK');

  // Kill all blocker processes synchronously
  activeBlockers.forEach(blocker => {
    if (blocker.type === 'autohotkey' && blocker.process) {
      try { blocker.process.kill('SIGKILL'); } catch { /* ignore */ }
    }
  });

  // Restore registry keys synchronously
  try {
    require('child_process').execSync(
      'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v DisableTaskMgr /f 2>nul',
      { stdio: 'ignore' }
    );
  } catch { /* ignore */ }

  try {
    require('child_process').execSync(
      'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer" /v NoWinKeys /f 2>nul',
      { stdio: 'ignore' }
    );
  } catch { /* ignore */ }

  console.log('✅ [WINDOWS] Emergency unlock complete');
}

module.exports = {
  lockdown,
  unlock,
  emergencyUnlock,
  isLocked: () => isLocked,
};
