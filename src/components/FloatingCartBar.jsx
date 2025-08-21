import { COP } from "../utils/money";

export default function FloatingCartBar({ items, total, onOpen, secondaryAction, secondaryLabel }) {
  if (!items || items.length === 0) return null;
  return (
    <div
      data-aa-cartbar
      className="fixed bottom-0 inset-x-0 z-[70]"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 8px)' }}
    >
      <div className="max-w-3xl mx-auto px-4">
        <div className="relative rounded-t-2xl bg-[#1f2621] text-white shadow-2xl ring-1 ring-black/20 border-t border-white/10 before:content-[''] before:absolute before:inset-x-0 before:-top-px before:h-px before:bg-white/10">
          <div className="relative grid grid-cols-[1fr_auto] items-center gap-3 py-3">
            <div>
              <div className="text-sm text-white/85">Total</div>
              <div className="font-semibold text-lg tabular-nums text-white">${COP(total)}</div>
            </div>
            <div className="flex items-center gap-2">
              {secondaryAction && secondaryLabel && (
                <button
                  onClick={secondaryAction}
                  className="h-10 px-3 rounded-xl bg-white/10 text-white hover:bg-white/15 ring-1 ring-white/15"
                >
                  {secondaryLabel}
                </button>
              )}
              <button
                onClick={onOpen}
                className="h-10 px-4 rounded-xl bg-[#2f4131] text-white hover:bg-[#243326] transition focus:outline-none focus:ring-2 focus:ring-[rgba(47,65,49,0.3)]"
              >
                Ver pedido
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
