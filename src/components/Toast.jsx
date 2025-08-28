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
      const normalize = (s = "") => String(s);
      setMsg(normalize(message || "Añadido al carrito"));
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
      role="status"
      className={[
        "pointer-events-none fixed left-1/2 z-[120] w-max -translate-x-1/2",
        "transition-opacity duration-200",
        show ? "opacity-100" : "opacity-0",
      ].join(" ")}
      style={{
        bottom: `calc(${offset}px + env(safe-area-inset-bottom, 0px) + 10px)`,
      }}
    >
      <div className="pointer-events-auto flex h-9 w-max items-center gap-3 rounded-full bg-[#2f4131] px-4 text-white shadow-2xl ring-1 ring-black/10">
        <span className="whitespace-nowrap text-[11px] font-medium">{msg}</span>
        {action && (
          <button
            type="button"
            className="rounded text-[11px] font-medium underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2"
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
    document.dispatchEvent(new CustomEvent("aa:toast", { detail: { message, ...opts } }));
  } catch {}
};

