/**
 * Sync Client - Stub for web version
 * (Tauri/Electron-specific features disabled)
 */

export type SyncStats = {
  lastSync: Date | null;
  unsyncedCount: number;
  status: 'idle' | 'syncing' | 'error';
  is_syncing?: boolean;
  total_failed?: number;
  total_synced?: number;
};

export const getSyncStats = async (): Promise<SyncStats> => {
  return {
    lastSync: null,
    unsyncedCount: 0,
    status: 'idle',
    is_syncing: false,
    total_failed: 0,
    total_synced: 0,
  };
};

export const syncNow = async () => {
  return { success: false, message: 'Sync not available in web version' };
};

export const formatLastSync = (date: Date | null): string => {
  if (!date) return 'Never';
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const getSyncStatusColor = (stats: SyncStats): string => {
  if (stats.status === 'error') return 'red';
  if (stats.is_syncing) return 'yellow';
  if (stats.unsyncedCount > 0) return 'blue';
  return 'green';
};

export const getSyncStatusMessage = (stats: SyncStats): string => {
  if (stats.status === 'error') return 'Sync error';
  if (stats.is_syncing) return 'Syncing...';
  if (stats.unsyncedCount > 0) return `${stats.unsyncedCount} pending`;
  return 'Synced';
};

export const startSyncEngine = async () => {
  // Stub - no-op in web version
  return Promise.resolve();
};

export class SyncClient {
  static async syncUserData() {
    return { success: false, message: 'Sync not available in web version' };
  }

  static async syncTracks() {
    return { success: false, message: 'Sync not available in web version' };
  }

  static async getLastSyncTime() {
    return null;
  }
}
