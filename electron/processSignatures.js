/**
 * Process Signatures
 *
 * Extends the basic name-match threat list with window-title keyword
 * detection so that renamed executables (e.g. chrome.exe → homework.exe)
 * are still caught.
 *
 * Detection tiers
 * ───────────────
 * Tier 1  Name match          – exact / substring in process name
 * Tier 2  Window-title match  – regex over visible window title
 * Tier 3  (future) File hash  – SHA-256 of executable on disk
 *
 * A process needs to match ANY ONE tier to be flagged.
 * "high" severity → kill immediately + audit
 * "medium" severity → audit only (no kill)
 */

'use strict';

const { exec } = require('child_process');

// ─── Signature database ───────────────────────────────────────────────────────
// Each entry: { names[], titlePatterns[], severity, category, description }
const SIGNATURES = [
  // ── AI assistants ──────────────────────────────────────────────────────
  {
    category: 'ai_assistant',
    severity: 'high',
    description: 'AI coding / chat assistant',
    names: {
      linux:  ['cursor', 'chatgpt', 'claude', 'gemini', 'perplexity', 'codeium', 'copilot', 'bing'],
      win32:  ['Cursor.exe', 'ChatGPT.exe', 'Claude.exe', 'Gemini.exe', 'Perplexity.exe'],
    },
    titlePatterns: [
      /chatgpt/i, /claude\.ai/i, /gemini/i, /copilot/i,
      /perplexity/i, /cursor\s/i, /codeium/i, /bard/i,
      /gpt-4/i, /gpt-3/i, /openai/i, /anthropic/i,
    ],
  },
  // ── Remote desktop / screen sharing ────────────────────────────────────
  {
    category: 'remote_desktop',
    severity: 'high',
    description: 'Remote desktop or screen-sharing tool',
    names: {
      linux:  ['anydesk', 'teamviewer', 'remmina', 'x11vnc', 'tigervnc', 'xrdp', 'krdc', 'vnc'],
      win32:  ['AnyDesk.exe', 'TeamViewer.exe', 'TeamViewer_Service.exe', 'mstsc.exe', 'vncviewer.exe'],
    },
    titlePatterns: [
      /anydesk/i, /teamviewer/i, /remote desktop/i,
      /vnc viewer/i, /screen sharing/i, /remmina/i,
    ],
  },
  // ── Screen recorders ───────────────────────────────────────────────────
  {
    category: 'screen_recorder',
    severity: 'high',
    description: 'Screen recording software',
    names: {
      linux:  ['obs', 'obs-studio', 'kazam', 'simplescreenrecorder', 'recordmydesktop', 'vokoscreen'],
      win32:  ['obs64.exe', 'obs32.exe', 'ShareX.exe', 'Bandicam.exe', 'Fraps.exe', 'CamtasiaStudio.exe'],
    },
    titlePatterns: [
      /OBS Studio/i, /Open Broadcaster/i, /Bandicam/i,
      /ShareX/i, /screen recorder/i, /kazam/i,
    ],
  },
  // ── Web browsers ───────────────────────────────────────────────────────
  {
    category: 'browser',
    severity: 'high',
    description: 'Web browser (potential for looking up answers)',
    names: {
      linux:  ['firefox', 'chrome', 'chromium', 'brave', 'opera', 'epiphany', 'midori', 'vivaldi'],
      win32:  ['firefox.exe', 'chrome.exe', 'msedge.exe', 'brave.exe', 'opera.exe', 'vivaldi.exe'],
    },
    titlePatterns: [
      // Catch renamed browsers by title containing common site patterns
      /google\s*-\s*(chrome|search)/i, /mozilla firefox/i,
      /microsoft edge/i, /brave browser/i,
      /stackoverflow/i, /wikipedia/i, /w3schools/i,
      /youtube/i, /google\.com/i, /bing\.com/i,
    ],
  },
  // ── Communication apps ─────────────────────────────────────────────────
  {
    category: 'communication',
    severity: 'medium',
    description: 'Chat or messaging application',
    names: {
      linux:  ['telegram', 'discord', 'slack', 'teams', 'zoom', 'skype', 'whatsapp', 'signal'],
      win32:  ['Telegram.exe', 'Discord.exe', 'slack.exe', 'Teams.exe', 'Zoom.exe', 'Skype.exe', 'WhatsApp.exe'],
    },
    titlePatterns: [
      /telegram/i, /discord/i, /slack/i,
      /microsoft teams/i, /zoom meeting/i, /skype/i, /whatsapp/i,
    ],
  },
  // ── Text editors / IDEs (viewing notes) ────────────────────────────────
  {
    category: 'editor',
    severity: 'medium',
    description: 'Text editor or IDE (may contain notes)',
    names: {
      linux:  ['gedit', 'kate', 'code', 'atom', 'sublime', 'vim', 'emacs', 'mousepad', 'xed'],
      win32:  ['notepad.exe', 'notepad++.exe', 'Code.exe', 'sublime_text.exe', 'wordpad.exe', 'atom.exe'],
    },
    titlePatterns: [
      /visual studio code/i, /notepad\+\+/i,
      /sublime text/i, /atom editor/i,
      /\.txt\s*-/i, /\.py\s*-/i, /\.js\s*-/i, /\.md\s*-/i,
    ],
  },
];

// ─── Platform helpers ─────────────────────────────────────────────────────────

/**
 * Linux: get all window titles using `xdotool search --all --name ""`
 * Falls back to `wmctrl -l` if xdotool is not installed.
 * Returns Promise<string[]>  (list of titles)
 */
function getLinuxWindowTitles() {
  return new Promise((resolve) => {
    exec('wmctrl -l 2>/dev/null', (err, stdout) => {
      if (!err && stdout) {
        // wmctrl format: <id> <desktop> <host> <title>
        const titles = stdout.split('\n')
          .map(line => line.replace(/^0x[\da-f]+\s+\d+\s+\S+\s+/i, '').trim())
          .filter(Boolean);
        return resolve(titles);
      }
      // Try xdotool
      exec('xdotool search --all --name "" 2>/dev/null', (err2, stdout2) => {
        if (!err2 && stdout2) {
          const ids = stdout2.trim().split('\n').filter(Boolean).slice(0, 40);
          const cmds = ids.map(id => `xdotool getwindowname ${id}`);
          exec(cmds.join(' ; '), (err3, out3) => {
            resolve(err3 ? [] : out3.split('\n').map(t => t.trim()).filter(Boolean));
          });
        } else {
          resolve([]);
        }
      });
    });
  });
}

/**
 * Windows: use PowerShell to get all visible window titles.
 * Returns Promise<string[]>
 */
function getWindowsWindowTitles() {
  return new Promise((resolve) => {
    const ps = `(Get-Process | Where-Object {$_.MainWindowTitle -ne ''} | Select-Object -ExpandProperty MainWindowTitle) -join '\n'`;
    exec(`powershell -NoProfile -Command "${ps}"`, { timeout: 3000 }, (err, stdout) => {
      if (err) return resolve([]);
      resolve(stdout.split('\n').map(t => t.trim()).filter(Boolean));
    });
  });
}

async function getAllWindowTitles() {
  if (process.platform === 'linux')  return getLinuxWindowTitles();
  if (process.platform === 'win32')  return getWindowsWindowTitles();
  return []; // macOS — handled by process name only for now
}

// ─── Main scanner ──────────────────────────────────────────────────────────────
/**
 * Scan for threats using name + window-title detection.
 * Returns Promise<Array<{ sig, name?, title?, tier }>>
 */
async function scan() {
  const hits = [];
  const platform = process.platform;
  const titles = await getAllWindowTitles();

  for (const sig of SIGNATURES) {
    const nameList = sig.names[platform] || [];

    // Tier 1 — name check (delegated to caller via existing pgrep/tasklist;
    //           we return the sig so caller can also check names if needed)
    for (const name of nameList) {
      hits.push({ source: 'name_list', sig, name, tier: 1 });
    }

    // Tier 2 — window title
    for (const title of titles) {
      for (const pattern of sig.titlePatterns) {
        if (pattern.test(title)) {
          hits.push({ source: 'window_title', sig, title, pattern: pattern.source, tier: 2 });
          break; // one pattern match per title per sig is enough
        }
      }
    }
  }

  return hits;
}

/**
 * Dedicated window-title scan — called separately from name-based monitoring.
 * Returns only window-title hits so we don't double-count name hits.
 */
async function scanWindowTitles() {
  const hits = [];
  const titles = await getAllWindowTitles();

  for (const sig of SIGNATURES) {
    for (const title of titles) {
      for (const pattern of sig.titlePatterns) {
        if (pattern.test(title)) {
          hits.push({ sig, title, pattern: pattern.source });
          break;
        }
      }
    }
  }

  return hits;
}

/**
 * Get flat name lists for the current platform (used by existing pgrep loop).
 * Returns Map<name, { category, severity }>
 */
function getNameThreatMap() {
  const map = new Map();
  for (const sig of SIGNATURES) {
    const names = sig.names[process.platform] || [];
    for (const name of names) {
      map.set(name.toLowerCase(), { category: sig.category, severity: sig.severity, description: sig.description });
    }
  }
  return map;
}

module.exports = { scan, scanWindowTitles, getNameThreatMap, SIGNATURES };
