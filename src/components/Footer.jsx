import React from "react";

export default function Footer() {
  // URLs desde env con fallback
  const IG_URL = import.meta.env.VITE_INSTAGRAM_URL || "https://instagram.com/altoandinozipaquira";
  const RAW_WA = (import.meta.env.VITE_WHATSAPP || "573209009972").replace(/\D/g, "");
  const WA_NUM = RAW_WA.startsWith("57") ? RAW_WA : `57${RAW_WA}`;
  const WA_LINK = `https://wa.me/${WA_NUM}`;
  const REVIEWS_URL = import.meta.env.VITE_GOOGLE_REVIEWS_URL || "#";

  return (
    <footer
      className="mt-10"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
    >
      <div className="max-w-3xl mx-auto px-4">
        <div className="rounded-2xl bg-[#FAF7F2] p-6 sm:p-7 shadow-sm ring-1 ring-black/5">
          {/* Título + CTA pills */}
          <p className="text-center text-base sm:text-lg font-medium text-neutral-900">
            ¿Te gustó la experiencia?
            <span className="font-normal text-neutral-700"> Síguenos o déjanos tu reseña.</span>
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <a
              href={IG_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 h-10 rounded-full border border-neutral-300 bg-white hover:border-neutral-400 shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-[rgba(47,65,49,0.3)]"
            >
              <span aria-hidden>📸</span>
              <span className="font-medium">Instagram</span>
            </a>

            <a
              href={WA_LINK}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 h-10 rounded-full border border-emerald-100 bg-emerald-50 hover:border-emerald-200 shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-[rgba(47,65,49,0.3)]"
            >
              <span aria-hidden>💬</span>
              <span className="font-medium">WhatsApp</span>
            </a>

            <a
              href={REVIEWS_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 h-10 rounded-full border border-amber-200 bg-amber-50 hover:border-amber-300 shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-[rgba(47,65,49,0.3)]"
            >
              <span aria-hidden>⭐</span>
              <span className="font-medium">Reseñas</span>
            </a>
          </div>

          {/* Solo dirección (sin duplicar IG/WA en texto) */}
          <div className="mt-5 text-center text-sm text-neutral-700">
            Carrera 15 # 1 – 111, San Pablo
          </div>

          {/* Créditos */}
          <p className="mt-5 text-center text-xs text-neutral-500">
            Diseñado por Sebas (UXIO) y desarrollado con GPT-5 Thinking ✨
          </p>
        </div>
      </div>
    </footer>
  );
}
