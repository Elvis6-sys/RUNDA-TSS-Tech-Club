'use client';

import { useEffect, useState } from 'react';
import { getSyncStats, syncNow, type SyncStats } from '@/src/lib/syncClient';
import { getUnsyncedCount, isTauriApp } from '@/src/lib/offlineStorage';
import { RefreshCw, Check, AlertTriangle, Wifi, WifiOff } from 'lucide-react';

interface SyncIndicatorProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showDetails?: boolean;
}

export default function SyncIndicator({
  position = 'bottom-right',
  showDetails = false
}: SyncIndicatorProps) {
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [showInTauri, setShowInTauri] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setShowInTauri(isTauriApp());

    if (!isTauriApp()) return;

    const updateStats = async () => {
      const syncStats = await getSyncStats();
      setStats(syncStats);

      const count = await getUnsyncedCount();
      setUnsyncedCount(count);
    };

    updateStats();
    const interval = setInterval(updateStats, 10000);

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

  const handleQuickSync = async () => {
    if (stats?.is_syncing || unsyncedCount === 0) return;

    try {
      await syncNow();
      const updated = await getSyncStats();
      setStats(updated);
      const count = await getUnsyncedCount();
      setUnsyncedCount(count);
    } catch (error) {
      console.error('Quick sync failed:', error);
    }
  };

  if (!showInTauri || !stats) return null;

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  const getStatusColor = () => {
    if (stats.is_syncing) return 'bg-yellow-500';
    if (unsyncedCount > 0) return 'bg-blue-500';
    if ((stats.total_failed || 0) > 0) return 'bg-red-500';
    return 'bg-green-500';
  };

  const getStatusIcon = () => {
    if (stats.is_syncing) {
      return <RefreshCw className="w-4 h-4 text-white animate-spin" />;
    }
    if (unsyncedCount > 0) {
      return <RefreshCw className="w-4 h-4 text-white" />;
    }
    if (stats.total_failed && stats.total_failed > 0) {
      return <AlertTriangle className="w-4 h-4 text-white" />;
    }
    return <Check className="w-4 h-4 text-white" />;
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {/* Compact Indicator */}
      <div
        onClick={() => setExpanded(!expanded)}
        className={`${getStatusColor()} rounded-full p-3 shadow-lg cursor-pointer hover:scale-110 transition-all`}
        title={`${unsyncedCount} items pending sync`}
      >
        <div className="relative">
          {getStatusIcon()}
          {unsyncedCount > 0 && !stats.is_syncing && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {unsyncedCount > 9 ? '9+' : unsyncedCount}
            </span>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (showDetails || unsyncedCount > 0) && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl p-4 w-64 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Sync Status</span>
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Pending:</span>
              <span className="font-semibold">{unsyncedCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Synced:</span>
              <span className="font-semibold text-green-600">{stats.total_synced}</span>
            </div>
            {stats.total_failed && stats.total_failed > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Failed:</span>
                <span className="font-semibold text-red-600">{stats.total_failed}</span>
              </div>
            )}
          </div>

          {unsyncedCount > 0 && isOnline && (
            <button
              onClick={handleQuickSync}
              disabled={stats.is_syncing}
              className="w-full mt-3 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${stats.is_syncing ? 'animate-spin' : ''}`} />
              {stats.is_syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
