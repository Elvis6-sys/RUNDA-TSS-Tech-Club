/**
 * Enhanced Anti-Cheat Hook v2 with Screen Recording Detection,
 * Network Monitoring, Clipboard Protection, VM Detection
 */

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
  needsFullscreenRestore: boolean;
  deviceFingerprint?: string;
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

const MAX_STRIKES = 3;

const WARNINGS: Record<number, string> = {
  1: "⚠️ Warning 1 of 2 — You attempted to violate quiz rules. Stay focused on the quiz screen.",
  2: "🚨 Final Warning — One more violation will auto-submit your quiz with current answers.",
};

export function useAntiCheatEnhanced({
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

  // Grace periods and flags
  const graceRef = useRef(false);
  const warningRef = useRef(false);
  const filePickerRef = useRef(false);

  // ── Device Fingerprinting ─────────────────────────────────────────────────
  const generateFingerprint = useCallback((): string => {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0,
      (navigator as any).deviceMemory || 0,
    ];

    // Simple hash
    const str = components.join("|");
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return hash.toString(16);
  }, []);

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
    // Check multiple indicators that we're in Tauri
    if (typeof window === 'undefined') return false;

    // Primary: Check for __TAURI__ global object
    if ('__TAURI__' in window) return true;

    // Secondary: Check user agent for Tauri identifier
    if (navigator.userAgent.includes('Tauri')) return true;

    // Tertiary: Check sessionStorage flag (set on activate)
    if (sessionStorage.getItem('quiz_in_tauri') === 'true') return true;

    return false;
  }, []);

  // ── Violation handler ─────────────────────────────────────────────────────
  const handleViolation = useCallback(async (type: CheatEvent["type"], metadata?: Record<string, any>) => {
    const cur = stateRef.current;
    if (
      !cur.active ||
      cur.autoSubmitted ||
      graceRef.current ||
      warningRef.current ||
      filePickerRef.current
    ) return;

    const event: CheatEvent = { type, timestamp: new Date().toISOString(), metadata };
    const strikes = cur.strikes + 1;
    onCheatDetected?.(strikes);

    // In Tauri secure browser: Log violations but NEVER auto-submit
    // The environment is already locked down at OS level
    if (isInTauri()) {
      // Just log the violation, no auto-submit ever
      setState(s => ({ ...s, strikes, warning: null, events: [...s.events, event] }));
      report(event, false); // false = not auto-submitted
      console.log(`[Tauri Mode] Violation logged: ${type} (Strike ${strikes}/${MAX_STRIKES}) - Auto-submit disabled`);
      return;
    }

    // In regular web browser: Use 3-strike auto-submit system
    if (strikes >= MAX_STRIKES) {
      warningRef.current = false;
      setState(s => ({ ...s, strikes, autoSubmitted: true, active: false, warning: null, needsFullscreenRestore: false, events: [...s.events, event] }));
      report(event, true);
      await exitFullscreen();
      onAutoSubmit();
    } else {
      warningRef.current = true;
      setState(s => ({ ...s, strikes, warning: WARNINGS[strikes] ?? null, events: [...s.events, event] }));
      report(event, false);
    }
  }, [onAutoSubmit, report, exitFullscreen, onCheatDetected, isInTauri]);

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  const activate = useCallback(async () => {
    warningRef.current = false;
    filePickerRef.current = false;

    const fingerprint = generateFingerprint();
    const inTauri = isInTauri();

    setState({
      active: true, strikes: 0, warning: null, autoSubmitted: false,
      events: [], needsFullscreenRestore: false, deviceFingerprint: fingerprint,
    });

    // Only enter fullscreen if NOT in Tauri (Tauri handles its own fullscreen)
    if (!inTauri) {
      await enterFullscreen();
      graceRef.current = true;
      setTimeout(() => { graceRef.current = false; }, 1500);
    } else {
      console.log('[Tauri Mode] Secure Browser detected - Fullscreen managed by Tauri');
    }

    // Store fingerprint
    sessionStorage.setItem('quiz_fingerprint', fingerprint);

    // Store Tauri mode flag
    if (inTauri) {
      sessionStorage.setItem('quiz_in_tauri', 'true');
    }
  }, [enterFullscreen, generateFingerprint, isInTauri]);

  const deactivate = useCallback(async () => {
    warningRef.current = false;
    filePickerRef.current = false;
    setState(s => ({ ...s, active: false, warning: null, needsFullscreenRestore: false }));

    // Only exit fullscreen if NOT in Tauri
    if (!isInTauri()) {
      await exitFullscreen();
    }

    // Clear session data
    sessionStorage.removeItem('quiz_fingerprint');
    sessionStorage.removeItem('quiz_in_tauri');
    localStorage.removeItem('quiz_session_active');
  }, [exitFullscreen, isInTauri]);

  const dismissWarning = useCallback(async () => {
    warningRef.current = false;
    setState(s => ({ ...s, warning: null }));
    await enterFullscreen();
    graceRef.current = true;
    setTimeout(() => { graceRef.current = false; }, 1200);
  }, [enterFullscreen]);

  const openFilePicker = useCallback((inputEl: HTMLInputElement) => {
    filePickerRef.current = true;

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      filePickerRef.current = false;

      if (stateRef.current.active && !document.fullscreenElement) {
        setState(s => ({ ...s, needsFullscreenRestore: true }));
      }

      inputEl.removeEventListener("change", onFileChange);
      window.removeEventListener("focus", onWindowFocus);
      clearTimeout(fallbackTimer);
    };

    const onFileChange = () => { setTimeout(cleanup, 200); };
    const onWindowFocus = () => { setTimeout(cleanup, 400); };
    const fallbackTimer = setTimeout(cleanup, 30_000);

    inputEl.addEventListener("change", onFileChange, { once: true });
    window.addEventListener("focus", onWindowFocus, { once: true });

    inputEl.click();
  }, []);

  // ── Event listeners ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!state.active) return;

    // Log environment mode
    const inTauri = isInTauri();
    console.log(`[AntiCheat] Mode: ${inTauri ? 'TAURI SECURE BROWSER' : 'WEB BROWSER'}`);
    console.log(`[AntiCheat] Auto-submit: ${inTauri ? 'DISABLED' : 'ENABLED (3 strikes)'}`);
    console.log(`[AntiCheat] ESC blocking: ${inTauri ? 'OS-level (Tauri)' : 'Web-level (preventDefault)'}`);

    let resizeTimer: ReturnType<typeof setTimeout>;
    let monitorInterval: ReturnType<typeof setInterval>;

    // ── Basic Events ──────────────────────────────────────────────────────
    const onBlur = () => {
      if (filePickerRef.current) return;

      // In Tauri secure mode, window is always on top and focused
      // Blur events in Tauri are false positives from internal events
      if (isInTauri()) {
        console.log('[Tauri Mode] Blur event ignored (window always on top)');
        return;
      }

      handleViolation("blur");
    };

    const onVisibility = () => {
      if (filePickerRef.current) return;
      if (document.hidden) handleViolation("visibility");
    };

    const onFSChange = () => {
      if (filePickerRef.current) return;

      // In Tauri, fullscreen is managed by the app itself, not the web page
      // Don't trigger violations for fullscreen changes in Tauri
      if (isInTauri()) {
        console.log('[Tauri Mode] Fullscreen change detected but ignored (Tauri manages fullscreen)');
        return;
      }

      if (!document.fullscreenElement && stateRef.current.active && !stateRef.current.autoSubmitted) {
        handleViolation("fullscreen_exit");
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      handleViolation("context_menu");
    };

    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => handleViolation("resize"), 800);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!stateRef.current.active) return;

      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const k = e.key.toUpperCase();

      // Block ALL function keys (F1-F12)
      const functionKeys = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'];
      if (functionKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        // F11 is fullscreen toggle, F12 is dev tools - count as violations
        if (e.key === 'F11' || e.key === 'F12') {
          handleViolation("dev_tools");
        }
        return false;
      }

      // Block special keys: Escape, PrintScreen, ScrollLock, Pause
      // ⚠️ ESC should be COMPLETELY BLOCKED, not trigger auto-submit
      // The Tauri secure browser already blocks ESC at OS level
      const specialBlockedKeys = ['Escape', 'PrintScreen', 'ScrollLock', 'Pause', 'Break'];
      if (specialBlockedKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // ESC is blocked silently in secure browser - DO NOT log violation
        // because it would trigger auto-submit after 3 strikes
        if (e.key === 'PrintScreen') {
          handleViolation("screenshot_attempt");
        }
        // For ESC: just block it silently, no violation
        return false;
      }

      const blocked =
        (ctrl && shift && ["I", "J", "C", "K"].includes(k)) ||
        (ctrl && ["U", "S", "P", "C", "A", "F"].includes(k));

      if (blocked) {
        e.preventDefault();
        e.stopPropagation();

        if (e.key === "Escape") handleViolation("fullscreen_exit");
        else if (ctrl && shift) handleViolation("dev_tools");
        else if (ctrl && k === "P") handleViolation("print_attempt");
      }
    };

    const onSelectStart = (e: Event) => {
      const t = e.target as HTMLElement;
      if (!["BUTTON", "INPUT", "TEXTAREA", "A", "SELECT", "LABEL"].includes(t.tagName)) {
        e.preventDefault();
      }
    };

    const onDragStart = (e: DragEvent) => { e.preventDefault(); };

    // ── Clipboard Protection ──────────────────────────────────────────────
    const onCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (!["INPUT", "TEXTAREA"].includes(target.tagName)) {
        e.preventDefault();
        handleViolation("copy_attempt");
      }
    };

    const onCut = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (!["INPUT", "TEXTAREA"].includes(target.tagName)) {
        e.preventDefault();
        handleViolation("cut_attempt");
      }
    };

    const onPaste = (e: ClipboardEvent) => {
      // Log paste attempts
      handleViolation("paste_attempt", { content: e.clipboardData?.getData("text")?.substring(0, 50) });
    };

    // ── Screen Recording Detection ────────────────────────────────────────
    const checkScreenRecording = async () => {
      try {
        if ('permissions' in navigator) {
          try {
            // @ts-ignore
            const result = await navigator.permissions.query({ name: 'display-capture' });
            if (result.state === 'granted') {
              handleViolation("screen_recording");
            }
          } catch { /* Not supported */ }
        }
      } catch { /* Silent fail */ }
    };

    // ── Network Monitoring ────────────────────────────────────────────────
    const originalFetch = window.fetch;
    const originalXHROpen = XMLHttpRequest.prototype.open;

    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const urlObj = new URL(url, window.location.origin);

      const allowedDomains = [window.location.hostname, 'localhost', '127.0.0.1'];
      const isAllowed = allowedDomains.some(domain => urlObj.hostname.includes(domain));

      if (!isAllowed && stateRef.current.active) {
        console.warn("🚫 Blocked external request during quiz:", url);
        handleViolation("network_request", { url });
        throw new Error("External network requests are blocked during quiz");
      }

      return originalFetch.apply(this, arguments as any);
    };

    XMLHttpRequest.prototype.open = function (method: string, url: string | URL) {
      const urlStr = typeof url === 'string' ? url : url.href;
      const urlObj = new URL(urlStr, window.location.origin);

      const allowedDomains = [window.location.hostname, 'localhost', '127.0.0.1'];
      const isAllowed = allowedDomains.some(domain => urlObj.hostname.includes(domain));

      if (!isAllowed && stateRef.current.active) {
        console.warn("🚫 Blocked XHR request during quiz:", urlStr);
        handleViolation("network_request", { url: urlStr });
        throw new Error("External network requests are blocked during quiz");
      }

      return originalXHROpen.apply(this, arguments as any);
    };

    // ── Multiple Tabs Detection ───────────────────────────────────────────
    const checkMultipleTabs = () => {
      const sessionId = sessionStorage.getItem('quiz_session_id') || crypto.randomUUID();
      sessionStorage.setItem('quiz_session_id', sessionId);

      const storedSession = localStorage.getItem('quiz_session_active');

      if (storedSession && storedSession !== sessionId) {
        handleViolation("multiple_tabs", { currentSession: sessionId, storedSession });
      } else {
        localStorage.setItem('quiz_session_active', sessionId);
      }
    };

    // ── Virtual Machine Detection ─────────────────────────────────────────
    const detectVirtualMachine = () => {
      const indicators: string[] = [];

      // Check GPU
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            const vmGpus = ['VMware', 'VirtualBox', 'Parallels', 'QEMU', 'Microsoft Basic'];
            if (vmGpus.some(vm => renderer && renderer.includes(vm))) {
              indicators.push('VM GPU');
            }
          }
        }
      } catch { /* Silent fail */ }

      // Check hardware
      const cores = navigator.hardwareConcurrency;
      if (cores && (cores === 1 || cores === 2)) {
        indicators.push('Low CPU cores');
      }

      // Check screen resolution
      const commonVmRes = ['800x600', '1024x768', '1280x800', '1280x1024'];
      const currentRes = `${window.screen.width}x${window.screen.height}`;
      if (commonVmRes.includes(currentRes)) {
        indicators.push('VM resolution');
      }

      // Check user agent
      const ua = navigator.userAgent.toLowerCase();
      const vmIndicators = ['virtualbox', 'vmware', 'parallels', 'qemu'];
      if (vmIndicators.some(vm => ua.includes(vm))) {
        indicators.push('VM in UA');
      }

      if (indicators.length >= 2) {
        handleViolation("virtual_machine", { indicators });
      }
    };

    // ── Start Monitoring ──────────────────────────────────────────────────
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("fullscreenchange", onFSChange);
    document.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("selectstart", onSelectStart);
    document.addEventListener("dragstart", onDragStart);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener("paste", onPaste);

    // Periodic checks
    monitorInterval = setInterval(() => {
      checkScreenRecording();
      checkMultipleTabs();
    }, 5000);

    // Initial checks
    detectVirtualMachine();
    checkMultipleTabs();

    // ── Cleanup ───────────────────────────────────────────────────────────
    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("fullscreenchange", onFSChange);
      document.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("selectstart", onSelectStart);
      document.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("paste", onPaste);

      clearTimeout(resizeTimer);
      clearInterval(monitorInterval);

      // Restore original functions
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalXHROpen;

      // Clear session data
      localStorage.removeItem('quiz_session_active');
    };
  }, [state.active, handleViolation]);

  return { state, activate, deactivate, dismissWarning, openFilePicker, restoreFullscreen, isInTauri: isInTauri() };
}
