import { useEffect, useState } from "react";
import { formatCOP } from "@/utils/money";

export default function FloatingCartBar({ items, total, onOpen, secondaryAction, secondaryLabel }) {
  const [animateTotal, setAnimateTotal] = useState(false);

  useEffect(() => {
    setAnimateTotal(true);
    const timeout = setTimeout(() => setAnimateTotal(false), 400);
    return () => clearTimeout(timeout);
  }, [total]);

  if (!items || items.length === 0) return null;

  return (
    <div
      data-aa-cartbar
      className="fixed inset-x-0 bottom-0 z-[70]"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 10px)" }}
    >
      <div className="mx-auto max-w-3xl px-0">
        <div className="mx-4 rounded-2xl border border-white/10 bg-[#1f2621] text-white shadow-2xl ring-1 ring-black/20">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <div className="text-xs leading-none text-white/70">Total</div>
              <div
                className={`text-xl font-semibold tabular-nums leading-tight transition-transform duration-300 ${
                  animateTotal ? "scale-105 text-emerald-300" : ""
                }`}
              >
                {formatCOP(total)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {secondaryAction && secondaryLabel && (
                <button
                  type="button"
                  onClick={secondaryAction}
                  className="h-10 rounded-xl bg-white/10 px-3 text-white ring-1 ring-white/15 hover:bg-white/15"
                >
                  {secondaryLabel}
                </button>
              )}
              <span className="sr-only" aria-live="polite">
                Total actualizado: {formatCOP(total)}
              </span>
              <button
                type="button"
                onClick={onOpen}
                className="h-10 rounded-xl bg-[#2f4131] px-4 text-white transition hover:bg-[#243326] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2"
              >
                Ver pedido ({items.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}