import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function GuideModal({ open, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!open) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative max-w-md w-[92%] rounded-2xl bg-[#FAF7F2] p-5 shadow-lg">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-3 right-3 h-8 w-8 grid place-items-center rounded-full bg-black/5 hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131]"
        >×</button>
        {children}
      </div>
    </div>,
    document.body
  );
}

