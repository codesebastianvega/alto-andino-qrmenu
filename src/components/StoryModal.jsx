import { useEffect } from "react";
import Portal from "./Portal";

export default function StoryModal({ open, onClose, story }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!open || !story) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[80] flex items-center justify-center" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative max-w-lg w-[92%] max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 dark:bg-neutral-900 dark:text-neutral-100">
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute top-3 right-3 h-8 w-8 grid place-items-center rounded-full bg-black/5 hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131]"
          >
            ×
          </button>
          <h2 className="text-lg font-semibold mb-4">{story.title}</h2>
          {story.sections?.map((sec, i) => (
            <div key={i} className="mb-4 last:mb-0">
              {sec.image && (
                <img
                  src={sec.image}
                  alt={sec.heading}
                  loading="lazy"
                  className="w-full h-auto rounded-md mb-2"
                />
              )}
              {sec.heading && (
                <h3 className="text-base font-medium mb-1">{sec.heading}</h3>
              )}
              {sec.body && (
                <p className="text-sm whitespace-pre-line">{sec.body}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </Portal>
  );
}
