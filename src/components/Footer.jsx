import React from "react";

function IconInstagram(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.3" cy="6.7" r="1" />
    </svg>
  );
}

function IconWhatsApp(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false" {...props}>
      <path
        d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8.5 9.6c.2-.5.4-.6.8-.6h.4c.2 0 .4.1.5.3l.6 1c.1.2.1.4 0 .6l-.3.5a.5.5 0 0 0 0 .5c.3.6.8 1.2 1.4 1.6.2.2.4.2.6 0l.5-.3c.2-.1.4-.1.6 0l1 .6c.2.1.3.3.3.5v.4c0 .4-.2.6-.6.8-.4.2-.9.3-1.4.3-1.8 0-4.3-1.9-5.2-3.5-.4-.6-.8-1.5-.9-2 0-.6.1-1 .3-1.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconStar(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false" {...props}>
      <path
        d="m12 3.5 2.6 5.3 5.9.9-4.3 4.2 1 5.9-5.2-2.7-5.2 2.7 1-5.9L3.5 9.7l5.9-.9L12 3.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function Footer() {
  const IG_URL =
    import.meta.env.VITE_INSTAGRAM_URL ||
    "https://instagram.com/altoandinozipaquira";
  const RAW_WA = (import.meta.env.VITE_WHATSAPP || "573209009972").replace(
    /\D/g,
    ""
  );
  const WA_NUM = RAW_WA.startsWith("57") ? RAW_WA : `57${RAW_WA}`;
  const WA_LINK = `https://wa.me/${WA_NUM}`;
  const REVIEWS_URL = import.meta.env.VITE_GOOGLE_REVIEWS_URL || "#";

  return (
    <footer
      className="mt-10"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
    >
      <div className="max-w-3xl mx-auto px-4">
        <div className="rounded-2xl bg-white p-6 sm:p-7 shadow-sm ring-1 ring-black/5">
          <p className="text-center text-base sm:text-lg font-semibold text-neutral-900">
            ¿Te gustó la experiencia?
            <span className="font-normal text-neutral-700">
              {" "}Síguenos o déjanos tu reseña.
            </span>
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <a
              href={IG_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 h-10 rounded-full border border-neutral-300 bg-white hover:border-neutral-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgba(47,65,49,0.3)]"
            >
              <IconInstagram className="w-4 h-4" />
              <span className="font-medium">Instagram</span>
            </a>

            <a
              href={WA_LINK}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 h-10 rounded-full border border-neutral-300 bg-white hover:border-neutral-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgba(47,65,49,0.3)]"
            >
              <IconWhatsApp className="w-4 h-4" />
              <span className="font-medium">WhatsApp</span>
            </a>

            <a
              href={REVIEWS_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 h-10 rounded-full border border-neutral-300 bg-white hover:border-neutral-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgba(47,65,49,0.3)]"
            >
              <IconStar className="w-4 h-4" />
              <span className="font-medium">Reseñas</span>
            </a>
          </div>

          <div className="mt-5 text-center text-sm text-neutral-600">
            Carrera 15 # 1 – 111, San Pablo
          </div>

          <p className="mt-5 text-center text-xs text-neutral-500">
            Diseñado por Sebas (UXIO) y desarrollado con GPT-5 Thinking ✨
          </p>
        </div>
      </div>
    </footer>
  );
}

