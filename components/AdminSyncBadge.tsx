'use client';

import { useSync } from '@/src/hooks/useSync';
import { Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';

interface AdminSyncBadgeProps {
  isAdmin: boolean;
}

export default function AdminSyncBadge({ isAdmin }: AdminSyncBadgeProps) {
  const {
    stats,
    unsyncedCount,
    isOnline,
    isSyncing,
    isTauriApp: showInTauri,
    hasErrors
  } = useSync({ autoStart: true });

  // Only show if admin AND in Tauri app
  if (!showInTauri || !isAdmin) return null;

  const getBgColor = () => {
    if (hasErrors) return 'bg-red-100 text-red-800 border-red-200';
    if (isSyncing || stats.is_syncing) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (unsyncedCount > 0) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getStatusMessage = () => {
    if (isSyncing || stats.is_syncing) return 'Syncing...';
    if (!isOnline) return 'Offline';
    if (hasErrors) return `${stats.total_failed || 0} failed`;
    if (unsyncedCount > 0) return `${unsyncedCount} pending`;
    if ((stats.total_synced || 0) > 0) return 'Synced';
    return 'Ready';
  };

  return (
    <div className={`fixed bottom-4 right-4 px-3 py-2 rounded-lg border-2 ${getBgColor()} shadow-lg flex items-center gap-2 z-50 text-xs`}>
      {isOnline ? (
        <Cloud className="w-3 h-3" />
      ) : (
        <CloudOff className="w-3 h-3" />
      )}

      <span className="font-medium">
        {getStatusMessage()}
      </span>

      {(isSyncing || stats.is_syncing) && (
        <RefreshCw className="w-3 h-3 animate-spin" />
      )}

      {hasErrors && (
        <AlertCircle className="w-3 h-3" />
      )}

      {unsyncedCount > 0 && !isSyncing && (
        <span className="ml-1 bg-white bg-opacity-50 px-1.5 py-0.5 rounded font-bold">
          {unsyncedCount}
        </span>
      )}

      <span className="text-[10px] opacity-60 ml-1">ADMIN</span>
    </div>
  );
}
