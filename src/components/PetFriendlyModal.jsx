import { useEffect, useState } from "react";
import Portal from "./Portal";
import { cocoa } from "../data/petFriendly";
import AAImage from "@/components/ui/AAImage";

export default function PetFriendlyModal({ open, onClose }) {
  const [tab, setTab] = useState("cocoa");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (open) {
      setVisible(true);
    } else {
      const t = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!visible) return null;

  const tabs = [
    { id: "cocoa", label: "Cocoa" },
    { id: "philosophy", label: "Filosofía" },
    { id: "gallery", label: "Galería" },
  ];

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
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />

        {/* Contenedor */}
        <div
          className={`relative max-h-[90vh] w-[92%] max-w-lg overflow-y-auto rounded-2xl bg-white p-5 transition-all duration-200 ease-out dark:bg-neutral-900 dark:text-neutral-100 ${
            open ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-5"
          }`}
        >
          {/* Botón cerrar */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/5 hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2"
          >
            ×
          </button>

          {/* Tabs */}
          <div className="mb-4" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.id}
                id={`tab-${t.id}`}
                role="tab"
                aria-selected={tab === t.id}
                aria-controls={`panel-${t.id}`}
                onClick={() => setTab(t.id)}
                className={`mb-2 mr-2 rounded-full px-3 py-1 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2 ${
                  tab === t.id
                    ? "bg-[#2f4131] text-white"
                    : "bg-black/5 text-neutral-700 hover:bg-black/10"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Contenido dinámico */}
          {tab === "cocoa" && (
            <div
              id="panel-cocoa"
              role="tabpanel"
              aria-labelledby="tab-cocoa"
              className="transition-opacity duration-200"
            >
              <AAImage
                src={cocoa.hero}
                alt={cocoa.name}
                className="h-auto w-full rounded-lg"
              />
              <p className="mt-3 text-center text-sm">
                Conoce a {cocoa.name}, nuestra pitbull bonsái.
              </p>
            </div>
          )}

          {tab === "philosophy" && (
            <div
              id="panel-philosophy"
              role="tabpanel"
              aria-labelledby="tab-philosophy"
              className="transition-opacity duration-200"
            >
              <p className="whitespace-pre-line text-sm">
                {cocoa.philosophy}
              </p>
            </div>
          )}

          {tab === "gallery" && (
            <div
              id="panel-gallery"
              role="tabpanel"
              aria-labelledby="tab-gallery"
              className="grid grid-cols-2 gap-2 transition-opacity duration-200 sm:grid-cols-3"
            >
              {cocoa.gallery.map((img, i) => (
                <AAImage
                  key={i}
                  src={img.src}
                  alt={img.alt}
                  className="h-auto w-full rounded-lg object-cover"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}
