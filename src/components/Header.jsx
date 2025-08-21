// src/components/Header.jsx
import { getTableId } from "../utils/table";

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
      <summary className="text-xs font-medium text-alto-primary cursor-pointer select-none">
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
    <header className="mb-6">
      {/* Logo centrado y sin fondo */}
      <div className="flex flex-col items-center text-center">
        <img
          src="/logoalto.png"
          alt="Alto Andino Delicatessen"
          className="h-28 w-28 sm:h-36 sm:w-36 object-contain drop-shadow-sm"
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
          <p className="text-center">
            Instagram: @altoandino · WhatsApp: 322 228 5900
          </p>
          <div className="sm:text-right">
            <MarkersLegend />
          </div>
        </div>
      </div>
    </header>
  );
}
