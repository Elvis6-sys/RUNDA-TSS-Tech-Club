/**
 * Offline Storage - Stub for web version
 * (Tauri/Electron-specific features disabled)
 */

export const isTauriApp = () => false;

export const getUnsyncedCount = async () => 0;

export const submitQuizWithOfflineSupport = async (
  userId: string,
  nodeId: string,
  blockId: string,
  quizId: string,
  answers: Record<string, any>,
  onlineSubmit: () => Promise<any>
) => {
  // Stub for web version - just tries online submit
  try {
    const result = await onlineSubmit();
    return { success: true, submissionId: result.submissionId, offlineMode: false };
  } catch (error) {
    return { success: false, offlineMode: false };
  }
};

export class OfflineStorage {
  static async getLocalUser() {
    return null;
  }

  static async getAllTracks() {
    return [];
  }

  static async getTrackById(id: string) {
    return null;
  }
}
