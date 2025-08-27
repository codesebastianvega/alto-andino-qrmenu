import { useEffect, useState } from "react";
import Portal from "./Portal";

export default function StoryModal({ open, onClose, story }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
    } else {
      // retrasa desmontaje para permitir animación de salida
      const timeout = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!visible) return null;

  return (
    <Portal>
      <div
        className={`fixed inset-0 z-[80] flex items-center justify-center transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Fondo */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
        {/* Contenido */}
        <div
          className={`relative max-h-[90vh] w-[92%] max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl transition-all duration-200 ease-out dark:bg-neutral-900 dark:text-neutral-100 ${
            open ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/5 hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2"
          >
            ×
          </button>

          <h2 className="mb-4 text-lg font-semibold">{story.title}</h2>
          {story.sections?.map((sec, i) => (
            <div key={i} className="mb-4 last:mb-0">
              {sec.image && (
                <img
                  src={sec.image}
                  alt={sec.heading}
                  loading="lazy"
                  className="mb-2 h-auto w-full rounded-md"
                />
              )}
              {sec.heading && <h3 className="mb-1 text-base font-medium">{sec.heading}</h3>}
              {sec.body && <p className="whitespace-pre-line text-sm">{sec.body}</p>}
            </div>
          ))}
        </div>
      </div>
    </Portal>
  );
}