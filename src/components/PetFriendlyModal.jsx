import { useEffect, useState } from "react";
import Portal from "./Portal";
import { cocoa } from "../data/petFriendly";

export default function PetFriendlyModal({ open, onClose }) {
  const [tab, setTab] = useState("cocoa");

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!open) return null;

  const tabs = [
    { id: "cocoa", label: "Cocoa" },
    { id: "philosophy", label: "Filosofía" },
    { id: "gallery", label: "Galería" },
  ];

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
          <div className="mb-4" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.id}
                id={`tab-${t.id}`}
                role="tab"
                aria-selected={tab === t.id}
                aria-controls={`panel-${t.id}`}
                onClick={() => setTab(t.id)}
                className={`mr-2 mb-2 px-3 py-1 text-sm font-medium rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131] ${
                  tab === t.id
                    ? "bg-[#2f4131] text-white"
                    : "bg-black/5 text-neutral-700 hover:bg-black/10"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {tab === "cocoa" && (
            <div id="panel-cocoa" role="tabpanel" aria-labelledby="tab-cocoa">
              <img
                src={cocoa.hero}
                alt={cocoa.name}
                loading="lazy"
                className="w-full h-auto rounded-lg"
              />
              <p className="mt-3 text-sm text-center">Conoce a {cocoa.name}, nuestra pitbull bonsái.</p>
            </div>
          )}
          {tab === "philosophy" && (
            <div id="panel-philosophy" role="tabpanel" aria-labelledby="tab-philosophy">
              <p className="text-sm whitespace-pre-line">{cocoa.philosophy}</p>
            </div>
          )}
          {tab === "gallery" && (
            <div
              id="panel-gallery"
              role="tabpanel"
              aria-labelledby="tab-gallery"
              className="grid grid-cols-2 sm:grid-cols-3 gap-2"
            >
              {cocoa.gallery.map((img, i) => (
                <img
                  key={i}
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  className="w-full h-auto rounded-lg object-cover"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}
