import React from "react";

function IconInstagram(props){return(<svg viewBox="0 0 24 24" aria-hidden focusable="false" {...props}><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.6"/><circle cx="17.3" cy="6.7" r="1"/></svg>)}
function IconWhatsApp(props){return(<svg viewBox="0 0 24 24" aria-hidden focusable="false" {...props}><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3Z" fill="none" stroke="currentColor" strokeWidth="1.6"/><path d="M8.5 9.6c.2-.5.4-.6.8-.6h.4c.2 0 .4.1.5.3l.6 1c.1.2.1.4 0 .6l-.3.5a.5.5 0 0 0 0 .5c.3.6.8 1.2 1.4 1.6.2.2.4.2.6 0l.5-.3c.2-.1.4-.1.6 0l1 .6c.2.1.3.3.3.5v.4c0 .4-.2.6-.6.8-.4.2-.9.3-1.4.3-1.8 0-4.3-1.9-5.2-3.5-.4-.6-.8-1.5-.9-2 0-.6.1-1 .3-1.4Z" fill="currentColor"/></svg>)}
function IconStar(props){return(<svg viewBox="0 0 24 24" aria-hidden focusable="false" {...props}><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.2 1 5.9-5.2-2.7-5.2 2.7 1-5.9L3.5 9.7l5.9-.9L12 3.5Z" fill="currentColor"/></svg>)}

export default function Footer(){
  const IG_URL = import.meta.env.VITE_INSTAGRAM_URL || "https://instagram.com/altoandinozipaquira";
  const RAW_WA = (import.meta.env.VITE_WHATSAPP || "573209009972").replace(/\D/g,"");
  const WA_NUM = RAW_WA.startsWith("57") ? RAW_WA : `57${RAW_WA}`;
  const WA_LINK = `https://wa.me/${WA_NUM}`;
  const REVIEWS_URL = import.meta.env.VITE_GOOGLE_REVIEWS_URL || "#";

  // Tokens de color con alto contraste sobre #243326
  const BG = "#243326";
  const TEXT = "#FAF7F2";       // primario (alto contraste, ~12:1)
  const TEXT_SUB = "#EDE8E0";   // secundario legible (>9:1)
  const TEXT_MUTED = "#D8D2C8"; // créditos (>7:1)
  const BORDER = "#FAF7F2CC";   // beige 80% para bordes

  return (
    <footer className="mt-10" style={{ backgroundColor: BG, paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 12px)" }}>
      <div className="max-w-3xl mx-auto px-4 py-5">
        {/* Línea breve (texto sólido, sin opacidad) */}
        <p className="text-center text-[13px]" style={{ color: TEXT_SUB }}>
          ¿Te gustó la experiencia?
        </p>

        {/* micro-chips ghost (texto/beige sólidos para contraste) */}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <a href={IG_URL} target="_blank" rel="noreferrer"
             className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] bg-transparent hover:bg-white/10 transition
                        focus:outline-none focus:ring-2 focus:ring-white/40"
             style={{ color: TEXT, border: `1px solid ${BORDER}` }}
             aria-label="Abrir Instagram">
            <IconInstagram className="w-3.5 h-3.5" />
            <span>Instagram</span>
          </a>

          <a href={WA_LINK} target="_blank" rel="noreferrer"
             className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] bg-transparent hover:bg-white/10 transition
                        focus:outline-none focus:ring-2 focus:ring-white/40"
             style={{ color: TEXT, border: `1px solid ${BORDER}` }}
             aria-label="Abrir WhatsApp">
            <IconWhatsApp className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>

          <a href={REVIEWS_URL} target="_blank" rel="noreferrer"
             className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] bg-transparent hover:bg-white/10 transition
                        focus:outline-none focus:ring-2 focus:ring-white/40"
             style={{ color: TEXT, border: `1px solid ${BORDER}` }}
             aria-label="Abrir reseñas">
            <IconStar className="w-3.5 h-3.5" />
            <span>Reseñas</span>
          </a>
        </div>

        {/* Dirección + créditos (colores sólidos legibles) */}
        <div className="mt-3 text-center text-[12px]" style={{ color: TEXT_SUB }}>
          Carrera 15 # 1 – 111, San Pablo
        </div>
        <p className="mt-2 text-center text-[11px]" style={{ color: TEXT_MUTED }}>
          Diseñado por Sebas (UXIO) · GPT-5 Thinking
        </p>
      </div>
    </footer>
  );
}
