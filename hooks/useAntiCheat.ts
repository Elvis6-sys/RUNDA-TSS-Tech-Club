"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CheatEvent = {
  type:
  | "blur"
  | "visibility"
  | "fullscreen_exit"
  | "context_menu"
  | "dev_tools"
  | "print_attempt"
  | "copy_attempt"
  | "paste_attempt"
  | "cut_attempt"
  | "screen_recording"
  | "screenshot_attempt"
  | "network_request"
  | "resize"
  | "multiple_tabs"
  | "virtual_machine";
  timestamp: string;
  metadata?: Record<string, any>;
};

export type AntiCheatState = {
  active: boolean;
  strikes: number;
  warning: string | null;
  autoSubmitted: boolean;
  events: CheatEvent[];
  /** True when fullscreen exited due to file picker — waiting for user click to re-enter */
  needsFullscreenRestore: boolean;
};

type UseAntiCheatOptions = {
  containerRef: React.RefObject<HTMLElement>;
  submissionId: string | null;
  studentName: string;
  nodeTitle: string;
  trackId: string;
  onAutoSubmit: () => void;
  onCheatDetected?: (strikes: number) => void;
};

const MAX_STRIKES = 1; // ONE STRIKE = INSTANT AUTO-SUBMIT (in web browser)
// In Tauri secure browser: Auto-submit disabled, violations logged only

const WARNINGS: Record<number, string> = {
  1: "🚨 QUIZ AUTO-SUBMITTED — You violated exam rules by leaving fullscreen or switching tabs.",
};

export function useAntiCheat({
  containerRef,
  submissionId,
  studentName,
  nodeTitle,
  trackId,
  onAutoSubmit,
  onCheatDetected,
}: UseAntiCheatOptions) {
  const [state, setState] = useState<AntiCheatState>({
    active: false, strikes: 0, warning: null,
    autoSubmitted: false, events: [], needsFullscreenRestore: false,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  // Suppress all violation detection during startup / dismissal grace window
  const graceRef = useRef(false);
  // Suppress while warning dialog is visible
  const warningRef = useRef(false);
  // Suppress while OS file-picker is open (set true before click, false after focus returns)
  const filePickerRef = useRef(false);

  // ── Fullscreen ────────────────────────────────────────────────────────────
  const enterFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen({ navigationUI: "hide" });
      }
    } catch (err) {
      console.warn("[AntiCheat] Fullscreen denied:", err);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); }
    catch { /* ignore */ }
  }, []);

  // Called by the quiz UI when student clicks "Return to fullscreen" button
  const restoreFullscreen = useCallback(async () => {
    setState(s => ({ ...s, needsFullscreenRestore: false }));
    await enterFullscreen();
    graceRef.current = true;
    setTimeout(() => { graceRef.current = false; }, 800);
  }, [enterFullscreen]);

  // ── Reporting ────────────────────────────────────────────────────────────
  const report = useCallback(async (event: CheatEvent, autoSubmitted: boolean) => {
    if (!submissionId) return;
    try {
      await fetch("/api/quiz/cheat-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, studentName, nodeTitle, trackId, event, autoSubmitted }),
      });
    } catch { /* non-fatal */ }
  }, [submissionId, studentName, nodeTitle, trackId]);

  // ── Detect if running in Tauri ───────────────────────────────────────────
  const isInTauri = useCallback(() => {
    if (typeof window === 'undefined') return false;
    if (sessionStorage.getItem('quiz_in_tauri') === 'true') return true;
    if ('__TAURI__' in window) return true;
    if (navigator.userAgent.includes('Tauri')) return true;
    return false;
  }, []);

  // ── Detect if running in Electron ────────────────────────────────────────
  const isInElectron = useCallback(() => {
    if (typeof window === 'undefined') return false;
    // Set by electron/preload.js via contextBridge
    if ((window as any).isElectron === true) return true;
    // Fallback: check user agent
    if (navigator.userAgent.toLowerCase().includes('electron')) return true;
    return false;
  }, []);

  // ── Detect if running in ANY secure browser (Tauri OR Electron) ──────────
  const isInSecureBrowser = useCallback(() => {
    return isInTauri() || isInElectron();
  }, [isInTauri, isInElectron]);

  // ── Violation handler ─────────────────────────────────────────────────────
  const handleViolation = useCallback(async (type: CheatEvent["type"]) => {
    const cur = stateRef.current;
    if (
      !cur.active ||
      cur.autoSubmitted ||
      graceRef.current ||
      warningRef.current ||
      filePickerRef.current
    ) return;

    const event: CheatEvent = { type, timestamp: new Date().toISOString() };
    const strikes = cur.strikes + 1;
    onCheatDetected?.(strikes);

    // ⚠️ SECURE BROWSER MODE (Electron OR Tauri): Log violations but NEVER auto-submit
    // The environment is already locked down at OS level
    if (isInSecureBrowser()) {
      console.log(`[Secure Browser] Violation logged: ${type} (Strike ${strikes}) - Auto-submit DISABLED`);
      setState(s => ({ ...s, strikes, warning: null, events: [...s.events, event] }));
      report(event, false); // false = not auto-submitted
      return; // Exit early - no auto-submit in secure browser
    }

    // 🌐 WEB MODE: Use instant auto-submit (1 strike = fail)
    if (strikes >= MAX_STRIKES) {
      warningRef.current = false;
      console.warn(`[Web Mode] Strike ${strikes}/${MAX_STRIKES} - AUTO-SUBMITTING QUIZ`);
      setState(s => ({ ...s, strikes, autoSubmitted: true, active: false, warning: null, needsFullscreenRestore: false, events: [...s.events, event] }));
      report(event, true);
      await exitFullscreen();
      onAutoSubmit();
    } else {
      warningRef.current = true;
      setState(s => ({ ...s, strikes, warning: WARNINGS[strikes] ?? null, events: [...s.events, event] }));
      report(event, false);

      // Set a short grace period to avoid immediate re-detection
      graceRef.current = true;
      setTimeout(() => { graceRef.current = false; }, 800);
    }
  }, [onAutoSubmit, report, exitFullscreen, onCheatDetected, isInSecureBrowser]);

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  const activate = useCallback(async () => {
    warningRef.current = false;
    filePickerRef.current = false;

    const inSecureBrowser = isInSecureBrowser();
    console.log(`🔒 [AntiCheat] Mode: ${inSecureBrowser ? 'SECURE BROWSER (Electron/Tauri)' : 'WEB BROWSER'}`);
    console.log(`🔒 [AntiCheat] Auto-submit: ${inSecureBrowser ? 'DISABLED (OS handles security)' : 'ENABLED (1 strike = instant fail)'}`);

    setState({ active: true, strikes: 0, warning: null, autoSubmitted: false, events: [], needsFullscreenRestore: false });

    // Only manage fullscreen in web browser mode
    // In Electron/Tauri, fullscreen is managed at the OS level
    if (!inSecureBrowser) {
      await enterFullscreen();
      graceRef.current = true;
      setTimeout(() => { graceRef.current = false; }, 1500);
    } else {
      console.log(`🔒 [Secure Browser] Fullscreen managed by OS — web fullscreen skipped`);
    }
  }, [enterFullscreen, isInSecureBrowser]);

  const deactivate = useCallback(async () => {
    warningRef.current = false;
    filePickerRef.current = false;
    setState(s => ({ ...s, active: false, warning: null, needsFullscreenRestore: false }));
    await exitFullscreen();
  }, [exitFullscreen]);

  const dismissWarning = useCallback(async () => {
    warningRef.current = false;
    setState(s => ({ ...s, warning: null }));

    // Restore fullscreen when user dismisses warning (this IS a user gesture)
    await enterFullscreen();

    // Short grace period after dismissing warning to prevent immediate re-trigger
    graceRef.current = true;
    setTimeout(() => { graceRef.current = false; }, 600);
  }, [enterFullscreen]);

  /**
   * Call this BEFORE triggering a file input click.
   *
   * Strategy:
   * 1. Set filePickerRef = true  → all blur/visibility/FSchange events ignored
   * 2. Click the input
   * 3. Listen for `change` on the input (user picked or cancelled) OR
   *    `focus` returning to window (user cancelled without picking)
   * 4. After picker closes:
   *    - If fullscreen was lost, set needsFullscreenRestore = true
   *      so the quiz UI shows a "Return to fullscreen" button
   *    - That button calls restoreFullscreen() which IS a user gesture
   * 5. Clear filePickerRef
   */
  const openFilePicker = useCallback((inputEl: HTMLInputElement) => {
    filePickerRef.current = true;

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      filePickerRef.current = false;

      // If fullscreen was exited while picker was open, request restore via UI button
      // (can't call requestFullscreen here — not a user gesture)
      if (stateRef.current.active && !document.fullscreenElement) {
        setState(s => ({ ...s, needsFullscreenRestore: true }));
      }

      inputEl.removeEventListener("change", onFileChange);
      window.removeEventListener("focus", onWindowFocus);
      clearTimeout(fallbackTimer);
    };

    // Picker closed because user selected a file
    const onFileChange = () => {
      setTimeout(cleanup, 200); // small delay to let browser settle
    };

    // Picker closed because user cancelled (window gets focus back)
    const onWindowFocus = () => {
      // Extra delay — some browsers fire focus while picker is still visible
      setTimeout(cleanup, 400);
    };

    // Hard fallback — clear after 30s no matter what
    const fallbackTimer = setTimeout(cleanup, 30_000);

    inputEl.addEventListener("change", onFileChange, { once: true });
    window.addEventListener("focus", onWindowFocus, { once: true });

    inputEl.click();
  }, []);

  // ── Event listeners ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!state.active) return;

    let resizeTimer: ReturnType<typeof setTimeout>;

    const onBlur = () => {
      if (filePickerRef.current) return;
      // In Tauri, window is always on top - blur is false positive
      if (isInSecureBrowser()) {
        console.log('[Secure Browser] Blur ignored (OS handles window focus)');
        return;
      }
      handleViolation("blur");
    };

    const onVisibility = () => {
      if (filePickerRef.current) return;
      // In Tauri, visibility changes are false positives
      if (isInSecureBrowser()) {
        console.log('[Secure Browser] Visibility change ignored');
        return;
      }
      if (document.hidden) handleViolation("visibility");
    };

    const onFSChange = () => {
      if (filePickerRef.current) return; // picker caused fullscreen exit — handled separately
      // In Tauri, fullscreen is managed by Tauri itself, not the web page
      if (isInSecureBrowser()) {
        console.log('[Secure Browser] Fullscreen change ignored (OS manages window)');
        return;
      }
      if (!document.fullscreenElement && stateRef.current.active && !stateRef.current.autoSubmitted) {
        // Student exited fullscreen - IMMEDIATE AUTO-SUBMIT (1 strike = fail)
        console.warn("[Web Mode] FULLSCREEN VIOLATION DETECTED - AUTO-SUBMITTING QUIZ");
        handleViolation("fullscreen_exit");
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      // In Tauri, right-click is already blocked - no need to log violation
      if (isInSecureBrowser()) {
        console.log('[Secure Browser] Context menu blocked (no violation logged)');
        return;
      }
      handleViolation("context_menu");
    };

    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => handleViolation("resize"), 800);
    };

    // ULTRA-AGGRESSIVE key blocking - SINGLE LAYER with smart detection
    const onKeyDown = (e: KeyboardEvent) => {
      if (!stateRef.current.active) return;

      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;
      const k = e.key.toUpperCase();

      // Allow typing in input fields, textareas, and contenteditable elements
      const target = e.target as HTMLElement;
      const isTypingField = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.getAttribute('contenteditable') === 'true'
      );

      // Block ALL keys when warning is shown (except what's needed for dialog)
      if (warningRef.current) {
        // Only allow Tab, Enter, Space for warning dialog interaction
        if (!['Tab', 'Enter', ' '].includes(e.key)) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        return;
      }

      // PRIORITY 1: Block Escape IMMEDIATELY - before anything else
      if (e.key === 'Escape' || e.keyCode === 27) {
        e.preventDefault();
        e.stopPropagation();

        // In Tauri: ESC is already blocked at OS level - no violation
        if (isInSecureBrowser()) {
          console.log('[Secure Browser] ESC blocked at OS level (no violation logged)');
          return false;
        }

        // In Web: ESC triggers fullscreen_exit violation
        handleViolation("fullscreen_exit");
        return false;
      }

      // PRIORITY 2: Block ALL function keys (F1-F12) - ULTRA AGGRESSIVE
      const functionKeys = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'];
      if (functionKeys.includes(e.key) || (e.keyCode >= 112 && e.keyCode <= 123)) {
        e.preventDefault();
        e.stopPropagation();
        // F11 is fullscreen toggle, F12 is dev tools - count as violations
        if (e.key === 'F11' || e.keyCode === 122 || e.key === 'F12' || e.keyCode === 123) {
          handleViolation("dev_tools");
        }
        return false;
      }

      // PRIORITY 3: Block special keys - ULTRA AGGRESSIVE
      const specialBlockedKeys = ['PrintScreen', 'ScrollLock', 'Pause', 'Break'];
      if (specialBlockedKeys.includes(e.key) || e.keyCode === 44 || e.keyCode === 145 || e.keyCode === 19) {
        e.preventDefault();
        e.stopPropagation();
        if (e.key === 'PrintScreen' || e.keyCode === 44) {
          handleViolation("screenshot_attempt");
        }
        return false;
      }

      // PRIORITY 4: Block Alt+F4 (close window)
      if (alt && (e.key === 'F4' || e.keyCode === 115)) {
        e.preventDefault();
        e.stopPropagation();
        handleViolation("fullscreen_exit");
        return false;
      }

      // PRIORITY 5: Block copy/paste/cut attempts - ONLY with Ctrl key
      // BUT allow in typing fields (students need to type their answers)
      if (!isTypingField && ctrl && k === "C") {
        e.preventDefault();
        e.stopPropagation();
        handleViolation("copy_attempt");
        return false;
      }
      if (!isTypingField && ctrl && k === "V") {
        e.preventDefault();
        e.stopPropagation();
        handleViolation("paste_attempt");
        return false;
      }
      if (!isTypingField && ctrl && k === "X") {
        e.preventDefault();
        e.stopPropagation();
        handleViolation("cut_attempt");
        return false;
      }

      // PRIORITY 6: Block developer tools shortcuts - ONLY with Ctrl+Shift
      if (ctrl && shift && ["I", "J", "C", "K"].includes(k)) {
        e.preventDefault();
        e.stopPropagation();
        handleViolation("dev_tools");
        return false;
      }

      // PRIORITY 7: Block other dangerous shortcuts - ONLY with Ctrl key
      if (ctrl && ["U", "S", "P", "A", "F"].includes(k)) {
        e.preventDefault();
        e.stopPropagation();
        if (k === "P") {
          handleViolation("print_attempt");
        }
        return false;
      }

      // PRIORITY 8: Block Ctrl+W (close tab) and Ctrl+Q (quit browser) - ONLY with Ctrl
      if (ctrl && (k === "W" || k === "Q")) {
        e.preventDefault();
        e.stopPropagation();
        handleViolation("fullscreen_exit");
        return false;
      }

      // ✅ Allow ALL other keys (A-Z, 0-9, Backspace, Space, Enter, etc.) for typing answers
    };

    const onSelectStart = (e: Event) => {
      const t = e.target as HTMLElement;
      if (!["BUTTON", "INPUT", "TEXTAREA", "A", "SELECT", "LABEL"].includes(t.tagName)) e.preventDefault();
    };

    const onDragStart = (e: DragEvent) => { e.preventDefault(); };

    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      handleViolation("copy_attempt");
    };

    const onPaste = (e: ClipboardEvent) => {
      // Allow paste in input fields (for student's own answers)
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      e.preventDefault();
      handleViolation("paste_attempt");
    };

    const onCut = (e: ClipboardEvent) => {
      e.preventDefault();
      handleViolation("cut_attempt");
    };

    // Prevent tab/window closing during quiz
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (stateRef.current.active && !stateRef.current.autoSubmitted) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome
        return ''; // Required for older browsers
      }
    };

    // Add ALL event listeners with CAPTURE phase for maximum priority
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("fullscreenchange", onFSChange);
    document.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("resize", onResize);
    window.addEventListener("beforeunload", onBeforeUnload); // Prevent closing

    // SINGLE-layer keyboard blocking (capture phase for priority)
    // Removed keyup/keypress to prevent event stacking and freezing
    window.addEventListener("keydown", onKeyDown, true); // Capture phase

    document.addEventListener("selectstart", onSelectStart);
    document.addEventListener("dragstart", onDragStart);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("cut", onCut);

    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("fullscreenchange", onFSChange);
      document.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("beforeunload", onBeforeUnload); // Remove unload preventer

      // Remove keyboard listener
      window.removeEventListener("keydown", onKeyDown, true);

      document.removeEventListener("selectstart", onSelectStart);
      document.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("cut", onCut);
      clearTimeout(resizeTimer);
    };
  }, [state.active, handleViolation, isInSecureBrowser]);

  return { state, activate, deactivate, dismissWarning, openFilePicker, restoreFullscreen };
}
