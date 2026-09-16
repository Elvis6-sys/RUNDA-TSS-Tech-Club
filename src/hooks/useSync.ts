'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getSyncStats,
  syncNow,
  startSyncEngine,
  type SyncStats
} from '@/src/lib/syncClient';
import { getUnsyncedCount, isTauriApp } from '@/src/lib/offlineStorage';

interface UseSyncOptions {
  autoStart?: boolean;
  refreshInterval?: number; // milliseconds
}

export function useSync(options: UseSyncOptions = {}) {
  const { autoStart = true, refreshInterval = 10000 } = options;

  const [stats, setStats] = useState<SyncStats>({
    lastSync: null,
    unsyncedCount: 0,
    status: 'idle',
    is_syncing: false,
    total_failed: 0,
    total_synced: 0,
  });

  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize sync engine
  useEffect(() => {
    if (!isTauriApp() || !autoStart) return;

    const init = async () => {
      try {
        await startSyncEngine();
        setIsInitialized(true);
      } catch (err: any) {
        console.warn('Sync engine already running or failed to start:', err.message);
        setIsInitialized(true); // Continue anyway
      }
    };

    init();
  }, [autoStart]);

  // Update stats periodically
  useEffect(() => {
    if (!isTauriApp()) return;

    const updateStats = async () => {
      try {
        const syncStats = await getSyncStats();
        setStats(syncStats);

        const count = await getUnsyncedCount();
        setUnsyncedCount(count);
      } catch (err: any) {
        setError(err.message);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setError(null);
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Manual sync function
  const sync = useCallback(async () => {
    if (!isTauriApp()) {
      throw new Error('Sync only available in Tauri app');
    }

    if (isSyncing) {
      throw new Error('Sync already in progress');
    }

    if (!isOnline) {
      throw new Error('Cannot sync while offline');
    }

    setIsSyncing(true);
    setError(null);

    try {
      const count = await syncNow();

      // Refresh stats
      const syncStats = await getSyncStats();
      setStats(syncStats);

      const unsyncedCount = await getUnsyncedCount();
      setUnsyncedCount(unsyncedCount);

      return count;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isOnline]);

  // Refresh stats manually
  const refresh = useCallback(async () => {
    if (!isTauriApp()) return;

    try {
      const syncStats = await getSyncStats();
      setStats(syncStats);

      const count = await getUnsyncedCount();
      setUnsyncedCount(count);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  return {
    // State
    stats,
    unsyncedCount,
    isOnline,
    isSyncing,
    error,
    isInitialized,
    isTauriApp: isTauriApp(),

    // Actions
    sync,
    refresh,

    // Computed
    canSync: isOnline && !isSyncing && unsyncedCount > 0,
    hasPendingItems: unsyncedCount > 0,
    hasErrors: (stats.total_failed ?? 0) > 0,
  };
}
