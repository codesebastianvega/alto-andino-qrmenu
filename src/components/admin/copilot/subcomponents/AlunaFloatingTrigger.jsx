import LumiEmblem from '../components/LumiEmblem';

export default function AlunaFloatingTrigger({ onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group fixed bottom-[calc(env(safe-area-inset-bottom,0px)+84px)] right-3 z-[70] flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/30 bg-gradient-to-br from-[#173D24] to-[#0A1F12] text-white shadow-[0_10px_28px_rgba(23,61,36,0.45)] transition hover:-translate-y-0.5 hover:scale-105 hover:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-200 md:bottom-5 md:right-5 md:h-14 md:w-14"
      aria-label="Abrir Lumi, copiloto operativo"
      aria-haspopup="dialog"
    >
      <LumiEmblem
        size={24}
        className="text-emerald-300 group-hover:rotate-12 transition-transform duration-300"
        aria-hidden="true"
      />
      <span className="pointer-events-none absolute right-full mr-2 hidden whitespace-nowrap rounded-lg bg-gray-950 px-3 py-1.5 text-xs font-bold text-white shadow-lg group-hover:block group-focus-visible:block">
        Lumi · Copiloto Aluna
      </span>
    </button>
  );
}
