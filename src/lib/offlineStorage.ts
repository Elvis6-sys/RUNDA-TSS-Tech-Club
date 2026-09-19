/**
 * Offline Storage - Electron version
 * All Tauri references removed. Detection uses window.isElectron
 * which is set by electron/preload.js via contextBridge.
 */

// Returns true when running inside the Electron desktop app
// window.isElectron is set in electron/preload.js:
//   contextBridge.exposeInMainWorld('isElectron', true)
export const isElectronApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (window as any).isElectron === true;
};

// Keep isTauriApp as a no-op alias so any remaining import doesn't crash
// TODO: remove all call sites and delete this alias
/** @deprecated Use isElectronApp() instead */
export const isTauriApp = (): boolean => false;

export const getUnsyncedCount = async (): Promise<number> => {
  if (!isElectronApp()) return 0;
  try {
    const status = await (window as any).electronAPI?.syncGetStatus?.();
    return status?.pendingCount ?? 0;
  } catch {
    return 0;
  }
};

export const submitQuizWithOfflineSupport = async (
  userId: string,
  nodeId: string,
  blockId: string,
  quizId: string,
  answers: Record<string, any>,
  onlineSubmit: () => Promise<any>
) => {
  try {
    const result = await onlineSubmit();
    return { success: true, submissionId: result.submissionId, offlineMode: false };
  } catch (error) {
    return { success: false, offlineMode: false };
  }
};

export class OfflineStorage {
  static async getLocalUser() { return null; }
  static async getAllTracks() { return []; }
  static async getTrackById(id: string) { return null; }
}
