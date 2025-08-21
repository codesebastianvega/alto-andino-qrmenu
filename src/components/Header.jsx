// src/components/Header.jsx
import { getTableId } from "../utils/table";

const IG_URL =
  import.meta.env.VITE_INSTAGRAM_URL ||
  "https://instagram.com/altoandinozipaquira";
const IG_HANDLE =
  (IG_URL.split("/").filter(Boolean).pop() || "@altoandinozipaquira").replace(
    "@",
    "@"
  );
const RAW_WA = (import.meta.env.VITE_WHATSAPP || "573209009972").replace(
  /\D/g,
  ""
);
const WA_NUM = RAW_WA.startsWith("57") ? RAW_WA : `57${RAW_WA}`;
const WA_DISPLAY = WA_NUM.replace(/^57/, "").replace(
  /(\d{3})(\d{3})(\d{4})/,
  "$1 $2 $3"
); // 320 900 9972
const WA_LINK = `https://wa.me/${WA_NUM}`;

function MarkersLegend() {
  const markers = [
    { icon: "🌿", label: "Veggie/Vegano" },
    { icon: "🌶️", label: "Picante" },
    { icon: "🐝", label: "Con miel" },
    { icon: "🚫🍬", label: "Sin azúcar añadida" },
    { icon: "🌾", label: "Gluten" },
    { icon: "🥛", label: "Lácteos" },
    { icon: "🥚", label: "Huevo" },
    { icon: "🥜", label: "Frutos secos" },
    { icon: "🫘", label: "Soya" },
    { icon: "🐟", label: "Pescado/Mariscos" },
  ];

  return (
    <details className="mt-3">
      <summary
        id="aa-guide-anchor"
        className="text-xs font-medium text-alto-primary cursor-pointer select-none"
      >
        Guía dietaria y alérgenos
      </summary>
      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {markers.map((m) => (
          <div
            key={m.label}
            className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-alto-warmwhite px-2 py-1 text-xs"
          >
            <span className="text-base leading-none">{m.icon}</span>
            <span className="text-neutral-700">{m.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-neutral-600">
        Si tienes alergias, avísanos. Algunas preparaciones comparten área;
        podría haber trazas.
      </p>
    </details>
  );
}

export default function Header() {
  const table = getTableId();

  return (
    <>
      <header className="mb-6">
        {/* Logo centrado y sin fondo */}
        <div className="flex flex-col items-center text-center">
          <img
            src="/logoalto.png"
            alt="Alto Andino Delicatessen"
            className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 object-contain drop-shadow-sm"
          />
          <h1 className="mt-2 text-alto-text text-base sm:text-lg font-extrabold tracking-tight">
            Alto Andino Delicatessen
          </h1>
          <p className="text-[11px] sm:text-xs text-neutral-600">
            Ingredientes locales y de temporada · Pet Friendly
          </p>

          {/* ✅ Chip con la mesa (si existe en la URL o guardada) */}
          {table && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-semibold">
              Mesa {table}
            </span>
          )}
        </div>

        {/* Línea sutil y datos + guía */}
        <div className="mt-4 border-t border-neutral-200 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-xs sm:text-sm text-neutral-700">
            <p className="text-center sm:text-left">
              Carrera 15 # 1 – 111, San Pablo
            </p>
            <div className="text-center text-sm text-neutral-700">
              Instagram: <a href={IG_URL} target="_blank" rel="noreferrer" className="font-medium text-[#2f4131] hover:underline">@{IG_HANDLE.replace('@','')}</a>
              {" · "}
              WhatsApp: <a href={WA_LINK} target="_blank" rel="noreferrer" className="font-medium text-[#2f4131] hover:underline">{WA_DISPLAY}</a>
            </div>
            <div className="sm:text-right">
              <MarkersLegend />
            </div>
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-40 bg-[rgba(250,247,242,0.9)] backdrop-blur border-b border-black/5">
        <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="font-semibold text-[#2f4131] text-base sm:text-lg">
            Alto Andino Delicatessen
          </div>
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("aa-guide-anchor");
              if (el) el.click();
            }}
            className="text-[#2f4131] text-sm font-medium underline decoration-[#2f4131]/40 hover:decoration-[#2f4131] focus:outline-none focus:ring-2 focus:ring-[rgba(47,65,49,0.3)] rounded px-1"
          >
            Guía dietaria y alérgenos
          </button>
        </div>
      </div>
    </>
  );
}
