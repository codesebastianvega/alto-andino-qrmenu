import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Portal from "./Portal";
import { cocoa } from "../data/petFriendly";
import AAImage from "@/components/ui/AAImage";

export default function PetFriendlyModal({ open, onClose }) {
  const [tab, setTab] = useState("cocoa");

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const tabs = [
    { id: "cocoa", label: "Cocoa" },
    { id: "philosophy", label: "Filosofía" },
    { id: "gallery", label: "Galería" },
  ];

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Fondo */}
            <motion.div
              className="absolute inset-0 bg-black/50"
              onClick={onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
            />

            {/* Contenedor */}
            <motion.div
              className="relative max-h-[90vh] w-[92%] max-w-lg overflow-y-auto rounded-2xl bg-white p-5 dark:bg-neutral-900 dark:text-neutral-100"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
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

              {/* Contenido dinámico con animación */}
              <AnimatePresence mode="wait">
                {tab === "cocoa" && (
                  <motion.div
                    key="cocoa"
                    id="panel-cocoa"
                    role="tabpanel"
                    aria-labelledby="tab-cocoa"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    <AAImage
                      src={cocoa.hero}
                      alt={cocoa.name}
                      className="h-auto w-full rounded-lg"
                    />
                    <p className="mt-3 text-center text-sm">
                      Conoce a {cocoa.name}, nuestra pitbull bonsái.
                    </p>
                  </motion.div>
                )}

                {tab === "philosophy" && (
                  <motion.div
                    key="philosophy"
                    id="panel-philosophy"
                    role="tabpanel"
                    aria-labelledby="tab-philosophy"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="whitespace-pre-line text-sm">
                      {cocoa.philosophy}
                    </p>
                  </motion.div>
                )}

                {tab === "gallery" && (
                  <motion.div
                    key="gallery"
                    id="panel-gallery"
                    role="tabpanel"
                    aria-labelledby="tab-gallery"
                    className="grid grid-cols-2 gap-2 sm:grid-cols-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    {cocoa.gallery.map((img, i) => (
                      <AAImage
                        key={i}
                        src={img.src}
                        alt={img.alt}
                        className="h-auto w-full rounded-lg object-cover"
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
