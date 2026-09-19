'use client';

import { useEffect, useState } from 'react';
import {
  getSyncStats,
  syncNow,
  formatLastSync,
  getSyncStatusColor,
  getSyncStatusMessage,
  type SyncStats
} from '@/src/lib/syncClient';
import { getUnsyncedCount, isElectronApp } from '@/src/lib/offlineStorage';
import { RefreshCw, Check, AlertCircle, Clock, Wifi, WifiOff } from 'lucide-react';

export default function SyncStatusPanel() {
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null);
  const [showInElectron, setShowInElectron] = useState(false);

  // Update stats periodically
  useEffect(() => {
    setShowInElectron(isElectronApp());

    if (!isElectronApp()) return;

    const updateStats = async () => {
      const syncStats = await getSyncStats();
      setStats(syncStats);

      const count = await getUnsyncedCount();
      setUnsyncedCount(count);
    };

    // Update immediately
    updateStats();

    // Update every 10 seconds
    const interval = setInterval(updateStats, 10000);

    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle manual sync
  const handleSyncNow = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    setLastSyncResult(null);

    try {
      const result = await syncNow();
      if (result.success) {
        setLastSyncResult(`✅ ${result.message}`);
      } else {
        setLastSyncResult(`❌ ${result.message}`);
      }

      // Refresh stats
      const syncStats = await getSyncStats();
      setStats(syncStats);

      const unsyncedCount = await getUnsyncedCount();
      setUnsyncedCount(unsyncedCount);

      // Clear message after 5 seconds
      setTimeout(() => setLastSyncResult(null), 5000);
    } catch (error: any) {
      setLastSyncResult(`❌ Sync failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Don't render if not in Electron
  if (!showInElectron) return null;
  if (!stats) return null;

  const statusColor = getSyncStatusColor(stats);
  const statusMessage = getSyncStatusMessage(stats);

  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    gray: 'bg-gray-50 border-gray-200 text-gray-600',
  };

  const iconColorClasses = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    gray: 'text-gray-400',
  };

  return (
    <div className={`rounded-lg border-2 p-4 ${colorClasses[statusColor as keyof typeof colorClasses]}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-5 h-5 text-green-600" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-600" />
          )}
          <h3 className="font-semibold text-lg">Sync Status</h3>
        </div>

        {stats.is_syncing ? (
          <RefreshCw className={`w-5 h-5 ${iconColorClasses[statusColor as keyof typeof iconColorClasses]} animate-spin`} />
        ) : stats.total_failed && stats.total_failed > 0 ? (
          <AlertCircle className={`w-5 h-5 ${iconColorClasses[statusColor as keyof typeof iconColorClasses]}`} />
        ) : stats.total_synced && stats.total_synced > 0 ? (
          <Check className={`w-5 h-5 ${iconColorClasses[statusColor as keyof typeof iconColorClasses]}`} />
        ) : (
          <Clock className={`w-5 h-5 ${iconColorClasses[statusColor as keyof typeof iconColorClasses]}`} />
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white bg-opacity-50 rounded p-2">
          <div className="text-xs opacity-75">Pending Sync</div>
          <div className="text-2xl font-bold">{unsyncedCount}</div>
        </div>

        <div className="bg-white bg-opacity-50 rounded p-2">
          <div className="text-xs opacity-75">Total Synced</div>
          <div className="text-2xl font-bold">{stats.total_synced}</div>
        </div>

        <div className="bg-white bg-opacity-50 rounded p-2">
          <div className="text-xs opacity-75">Failed</div>
          <div className="text-2xl font-bold">{stats.total_failed}</div>
        </div>

        <div className="bg-white bg-opacity-50 rounded p-2">
          <div className="text-xs opacity-75">Last Sync</div>
          <div className="text-sm font-semibold">
            {formatLastSync(stats.lastSync)}
          </div>
        </div>
      </div>

      {/* Status Message */}
      <div className="mb-3 text-sm font-medium">
        {isOnline ? (
          <span>🌐 Online - {statusMessage}</span>
        ) : (
          <span>📴 Offline Mode</span>
        )}
      </div>

      {/* Last Sync Result */}
      {lastSyncResult && (
        <div className="mb-3 p-2 bg-white bg-opacity-70 rounded text-sm">
          {lastSyncResult}
        </div>
      )}

      {/* Sync Button */}
      <button
        onClick={handleSyncNow}
        disabled={isSyncing || !isOnline || unsyncedCount === 0}
        className={`w-full py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${isSyncing || !isOnline || unsyncedCount === 0
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
          }`}
      >
        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Syncing...' : unsyncedCount === 0 ? 'Nothing to Sync' : `Sync Now (${unsyncedCount} items)`}
      </button>

      {/* Help Text */}
      {!isOnline && unsyncedCount > 0 && (
        <p className="text-xs mt-2 opacity-75 text-center">
          Connect to internet to sync {unsyncedCount} pending item{unsyncedCount !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
