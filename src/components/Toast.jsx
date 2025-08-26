import React, { useEffect, useState } from "react";

function getCartBarHeight() {
  try {
    const el = document.querySelector("[data-aa-cartbar]");
    return el ? el.offsetHeight : 0;
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
    const update = () => setOffset(getCartBarHeight());
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
      const { message, actionLabel, onAction, duration } = e?.detail || {};
      setMsg(message || "Añadido al carrito");
      setAction(actionLabel ? { label: actionLabel, onAction } : null);
      setShow(true);
      const updateOffset = () => setOffset(getCartBarHeight());
      updateOffset();
      offsetId = setTimeout(updateOffset, 0);
      hideId = setTimeout(() => {
        setShow(false);
        setAction(null);
      }, duration || 1600);
    };
    document.addEventListener("aa:toast", onToast);
    return () => {
      clearTimeout(hideId);
      clearTimeout(offsetId);
      document.removeEventListener("aa:toast", onToast);
    };

  }, []);

  return (
    <div
      aria-live="polite"
      className={[
        "fixed left-1/2 -translate-x-1/2 z-[120] pointer-events-none w-max",
        "transition-opacity duration-200",
        show ? "opacity-100" : "opacity-0",
      ].join(" ")}
      style={{ bottom: `calc(${offset}px + env(safe-area-inset-bottom, 0px) + 10px)` }}
    >
      <div className="rounded-full bg-[#2f4131] text-white px-4 h-9 flex items-center gap-3 shadow-2xl ring-1 ring-black/10 w-max pointer-events-auto">
        <span className="text-[11px] font-medium whitespace-nowrap">{msg}</span>
        {action && (
          <button
            type="button"
            className="text-[11px] font-medium underline"
            onClick={() => {
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
    document.dispatchEvent(
      new CustomEvent("aa:toast", { detail: { message, ...opts } })
    );
  } catch {}
};


