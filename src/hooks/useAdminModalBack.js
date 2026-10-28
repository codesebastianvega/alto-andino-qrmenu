import { useEffect, useRef } from 'react';

/**
 * useAdminModalBack
 * Intercepts the browser / Android hardware "Back" button so that when a modal or drawer
 * is open inside the Admin panel, pressing "Back" CLOSES the modal instead of
 * popping the #admin hash and kicking the merchant out to the public customer menu.
 *
 * @param {boolean} isOpen - Whether the modal/drawer is currently open
 * @param {function} onClose - Callback to close the modal
 */
export function useAdminModalBack(isOpen, onClose) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen || typeof onClose !== 'function') return;

    const stateToken = `modal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Push an anchor entry onto history stack
    window.history.pushState(
      { ...(window.history.state || {}), adminModalToken: stateToken },
      '',
      window.location.href
    );

    let isPoppedByBackButton = false;

    const handlePopState = (e) => {
      // If the popped state does not have our token, the user clicked "Back"
      isPoppedByBackButton = true;
      if (onCloseRef.current) {
        onCloseRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState, { once: true });

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // If modal was closed programmatically (e.g. clicking "Save" or "X"),
      // and NOT by the physical back button, pop the extra history entry we created.
      if (!isPoppedByBackButton && window.history.state?.adminModalToken === stateToken) {
        window.history.back();
      }
    };
  }, [isOpen]);
}
