import { useState, useEffect } from 'react';
import { isRestaurantOpen } from '../../../utils/businessHours';

export function useStoreStatusTracker({ currentBusinessHours, brandConfig }) {
  const [storeStatusInfo, setStoreStatusInfo] = useState(() =>
    isRestaurantOpen(currentBusinessHours, brandConfig)
  );

  useEffect(() => {
    const checkStatus = () => {
      const nextStatus = isRestaurantOpen(currentBusinessHours, brandConfig);
      setStoreStatusInfo((prev) => {
        if (!prev && !nextStatus) return prev;
        if (
          prev?.isOpen === nextStatus?.isOpen &&
          prev?.isManualPause === nextStatus?.isManualPause &&
          prev?.isScheduleClosed === nextStatus?.isScheduleClosed &&
          prev?.message === nextStatus?.message &&
          prev?.reopenFormatted === nextStatus?.reopenFormatted
        ) {
          return prev;
        }
        return nextStatus;
      });
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [currentBusinessHours, brandConfig]);

  const isAdminContext =
    typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/admin') ||
      window.location.hash.startsWith('#admin') ||
      window.location.hash.includes('admin'));

  const isStorePausedForPublic =
    !isAdminContext && Boolean(storeStatusInfo && !storeStatusInfo.isOpen);

  return {
    storeStatusInfo,
    isStorePausedForPublic,
  };
}
