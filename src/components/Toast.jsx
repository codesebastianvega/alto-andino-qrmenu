import React, { useEffect, useState } from "react";

function getBottomOffset() {
  try {
    const cartEl = document.querySelector("[data-aa-cartbar]");
    if (cartEl && cartEl.offsetHeight > 0) return cartEl.offsetHeight;

    const adminBarEl = document.querySelector("[data-aa-admin-bottombar]");
    if (adminBarEl && window.innerWidth < 1024) {
      return 76;
    }
    return 0;
  } catch {
    return 0;
  }
}

export default function Toast() {
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);
  const [offset, setOffset] = useState(0);
  const [action, setAction] = useState(null);

  useEffect(() => {
    const update = () => setOffset(getBottomOffset());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    let hideId;
    let offsetId;

    const onToast = (e) => {
      clearTimeout(hideId);
      clearTimeout(offsetId);
      const { message, actionLabel, onAction, duration, icon, type } = e?.detail || {};
      const normalize = (s = "") => String(s);
      setMsg({ 
        text: normalize(message || "Añadido al carrito"), 
        icon,
        type 
      });
      setAction(actionLabel ? { label: actionLabel, onAction } : null);
      setShow(true);
      const updateOffset = () => setOffset(getBottomOffset());
      updateOffset();
      offsetId = setTimeout(updateOffset, 0);
      hideId = setTimeout(() => {
        setShow(false);
        setAction(null);
      }, duration || 2500); // Increased duration slightly
    };

    document.addEventListener("aa:toast", onToast);
    return () => {
      clearTimeout(hideId);
      clearTimeout(offsetId);
      document.removeEventListener("aa:toast", onToast);
    };
  }, []);

  const getTypeStyles = () => {
    switch (msg?.type) {
      case 'error': return 'bg-red-600 ring-red-700/20';
      case 'success': return 'bg-emerald-600 ring-emerald-700/20';
      case 'info': return 'bg-blue-600 ring-blue-700/20';
      default: return 'bg-emerald-600 ring-emerald-700/20'; // Default to success style for better visibility
    }
  };

  const hasDialog = typeof document !== 'undefined' && Boolean(document.querySelector('[role="dialog"]'));

  return (
    <div
      aria-live="polite"
      role="status"
      className={[
        "fixed left-1/2 z-[200] max-w-[90vw] -translate-x-1/2 transition-all duration-300 ease-out",
        hasDialog ? (show ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0") : (show ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"),
      ].join(" ")}
      style={
        hasDialog
          ? { top: `calc(env(safe-area-inset-top, 0px) + 24px)` }
          : { bottom: `calc(${offset}px + env(safe-area-inset-bottom, 0px) + 20px)` }
      }
    >
      <div 
        onClick={() => {
          if (!action) {
            setShow(false);
          }
        }}
        className={`flex min-h-[44px] w-max max-w-full items-center gap-3 rounded-2xl px-5 py-2.5 text-white shadow-2xl ring-1 cursor-pointer select-none active:scale-95 transition-transform ${getTypeStyles()}`}
      >
        {msg?.icon && <span className="text-base flex-shrink-0">{msg.icon}</span>}
        <span className="text-xs font-bold tracking-tight text-center leading-snug">{msg?.text}</span>
        {action && (
          <button
            type="button"
            className="rounded-lg bg-white/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest hover:bg-white/30 transition-colors focus-visible:outline-none flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              action.onAction?.();
              setShow(false);
              setAction(null);
            }}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

export const toast = (message, opts = {}) => {
  try {
    document.dispatchEvent(new CustomEvent("aa:toast", { detail: { message, ...opts } }));
  } catch {}
};

toast.error = (message, opts = {}) => toast(message, { ...opts, type: 'error' });
toast.success = (message, opts = {}) => toast(message, { ...opts, type: 'success' });
toast.info = (message, opts = {}) => toast(message, { ...opts, type: 'info' });

