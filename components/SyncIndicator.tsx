'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Check, AlertTriangle } from 'lucide-react';

interface SyncIndicatorProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showDetails?: boolean;
}

export default function SyncIndicator({
  position = 'bottom-right',
  showDetails = false,
}: SyncIndicatorProps) {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Only render inside Electron — window.isElectron is set by preload.js
    const inElectron = typeof window !== 'undefined' &&
      (window as any).isElectron === true;
    setIsElectron(inElectron);
    if (!inElectron) return;

    const updateStatus = async () => {
      try {
        const status = await (window as any).electronAPI?.syncGetStatus?.();
        if (status) {
          setPendingCount(status.pendingCount ?? 0);
          setIsSyncing(status.isSyncing ?? false);
        }
      } catch {
        // Sync IPC not available — silent fail
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 10000);

    // Listen for sync status changes pushed from main process
    (window as any).electronAPI?.onSyncStatusChanged?.((data: any) => {
      setPendingCount(data?.pendingCount ?? 0);
      setIsSyncing(data?.isSyncing ?? false);
    });

    return () => clearInterval(interval);
  }, []);

  // Only render inside Electron
  if (!isElectron) return null;

  const handleForceSync = async () => {
    if (isSyncing || pendingCount === 0) return;
    setIsSyncing(true);
    try {
      await (window as any).electronAPI?.syncForceNow?.();
    } catch { /* silent */ }
    setTimeout(() => setIsSyncing(false), 2000);
  };

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  const badgeColor = isSyncing
    ? 'bg-yellow-500'
    : pendingCount > 0
      ? 'bg-blue-500'
      : 'bg-green-500';

  const BadgeIcon = isSyncing
    ? () => <RefreshCw className="w-4 h-4 text-white animate-spin" />
    : pendingCount > 0
      ? () => <AlertTriangle className="w-4 h-4 text-white" />
      : () => <Check className="w-4 h-4 text-white" />;

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <div
        onClick={() => setExpanded(!expanded)}
        className={`${badgeColor} rounded-full p-3 shadow-lg cursor-pointer 
                    hover:scale-110 transition-all`}
        title={pendingCount > 0 ? `${pendingCount} items pending sync` : 'All synced'}
      >
        <div className="relative">
          <BadgeIcon />
          {pendingCount > 0 && !isSyncing && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs 
                             rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl 
                        p-4 w-56 border-2 border-gray-200">
          <p className="font-semibold mb-2 text-sm">Sync Status</p>
          <p className="text-sm text-gray-600">
            {isSyncing ? 'Syncing...' : pendingCount > 0
              ? `${pendingCount} items pending`
              : 'All data synced'}
          </p>
          {pendingCount > 0 && !isSyncing && (
            <button
              onClick={handleForceSync}
              className="w-full mt-3 py-2 bg-blue-600 text-white rounded text-sm 
                         font-semibold hover:bg-blue-700 flex items-center 
                         justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Sync Now
            </button>
          )}
        </div>
      )}
    </div>
  );
}
