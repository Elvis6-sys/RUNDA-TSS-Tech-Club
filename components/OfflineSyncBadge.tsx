'use client';

import { useSync } from '@/src/hooks/useSync';
import { Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';

export default function OfflineSyncBadge() {
  const {
    stats,
    unsyncedCount,
    isOnline,
    isSyncing,
    isTauriApp: showInTauri,
    hasErrors
  } = useSync({ autoStart: true });

  // Don't render if not in Tauri
  if (!showInTauri) return null;

  const getBgColor = () => {
    if (hasErrors) return 'bg-red-100 text-red-800 border-red-200';
    if (isSyncing || stats.is_syncing) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (unsyncedCount > 0) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getStatusMessage = () => {
    if (isSyncing || stats.is_syncing) return 'Syncing...';
    if (!isOnline) return 'Offline Mode';
    if (hasErrors) return `${stats.total_failed} failed`;
    if (unsyncedCount > 0) return `${unsyncedCount} pending`;
    if ((stats.total_synced || 0) > 0) return 'All synced';
    return 'Sync ready';
  };

  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg border-2 ${getBgColor()} shadow-lg flex items-center gap-2 z-50`}>
      {isOnline ? (
        <Cloud className="w-4 h-4" />
      ) : (
        <CloudOff className="w-4 h-4" />
      )}

      <span className="text-sm font-medium">
        {getStatusMessage()}
      </span>

      {(isSyncing || stats.is_syncing) && (
        <RefreshCw className="w-4 h-4 animate-spin" />
      )}

      {hasErrors && (
        <AlertCircle className="w-4 h-4" />
      )}

      {unsyncedCount > 0 && !isSyncing && (
        <span className="ml-1 bg-white bg-opacity-50 px-2 py-0.5 rounded text-xs font-bold">
          {unsyncedCount}
        </span>
      )}
    </div>
  );
}
