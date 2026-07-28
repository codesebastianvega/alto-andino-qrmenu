import { useCallback, useEffect, useState } from 'react';
import { pendingOrders } from '@/utils/offlineDb';
import { syncPendingOrders } from '@/services/orderSync';

export function useConnectivity() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const refresh = useCallback(async () => {
    try { setPendingCount((await pendingOrders.list()).length); } catch { setPendingCount(0); }
  }, []);

  useEffect(() => {
    const handleOffline = () => setOnline(false);
    const handleOnline = async () => {
      setOnline(true);
      setSyncing(true);
      await syncPendingOrders();
      await refresh();
      setSyncing(false);
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    window.addEventListener('aluna:orders-synced', refresh);
    refresh();
    if (navigator.onLine) handleOnline();
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('aluna:orders-synced', refresh);
    };
  }, [refresh]);

  return { online, pendingCount, syncing };
}

