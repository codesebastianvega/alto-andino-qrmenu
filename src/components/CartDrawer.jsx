// src/components/CartDrawer.jsx
import { useEffect } from "react";
import { useCart } from "../context/CartContext";
import { COP } from "../utils/money";
import { getTableId } from "../utils/table";

// Configura tu WhatsApp (formato internacional, sin +, sin espacios)
// Ej: Colombia 57 + número
const PHONE = import.meta.env.VITE_WHATSAPP || "573222285900";

function buildWhatsAppUrl(cart) {
  const table = getTableId();

  const lines = [];
  lines.push("*Pedido Alto Andino*");
  if (table) lines.push(`Mesa: ${table}`);
  lines
    .push("")
    (
      // Items
      cart.items || []
    )
    .forEach((it, idx) => {
      const qty = it.qty ?? 1;
      const unit = it.price ?? 0;
      const subtotal = unit * qty;

      lines.push(`${idx + 1}. ${it.name} x${qty} — $${COP(subtotal)}`);

      // Opciones
      if (it.options) {
        const opts = Object.entries(it.options)
          .map(([k, v]) =>
            Array.isArray(v) ? `${k}: ${v.join(", ")}` : `${k}: ${v}`
          )
          .join(" · ");
        if (opts) lines.push(`   ${opts}`);
      }

      // Nota por ítem
      if (it.note) lines.push(`   Nota: ${it.note}`);
    });

  lines.push("");
  lines.push(`Total: $${COP(cart.total || 0)}`);

  const message = lines.join("\n");
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;
}

export default function CartDrawer({ onClose }) {
  const cart = useCart();

  // Evita scroll del body cuando el drawer está abierto
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const removeItem = (it) => {
    // Intentamos métodos comunes sin romper si no existen
    if (typeof cart.removeItem === "function") cart.removeItem(it.productId);
    else if (typeof cart.remove === "function") cart.remove(it.productId);
    // si tu contexto usa otra firma, dímela y lo ajusto
  };

  const clearCart = () => {
    if (typeof cart.clear === "function") cart.clear();
  };

  const waUrl = buildWhatsAppUrl(cart);

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* panel */}
      <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl border-l border-neutral-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-base font-bold">Tu pedido</h3>
          <button
            className="text-sm text-neutral-600 hover:text-neutral-900"
            onClick={onClose}
            aria-label="Cerrar"
          >
            Cerrar ✕
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.items && cart.items.length > 0 ? (
            cart.items.map((it, idx) => (
              <div
                key={`${it.productId}-${idx}`}
                className="rounded-xl border border-neutral-200 p-3"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {it.name}{" "}
                      {it.qty > 1 ? (
                        <span className="text-neutral-500">×{it.qty}</span>
                      ) : null}
                    </p>
                    <p className="text-sm text-neutral-600">
                      ${COP((it.price || 0) * (it.qty || 1))}
                    </p>
                  </div>
                  <button
                    className="text-xs text-red-600 hover:underline shrink-0"
                    onClick={() => removeItem(it)}
                  >
                    Eliminar
                  </button>
                </div>

                {/* Opciones */}
                {it.options && (
                  <ul className="mt-2 text-xs text-neutral-700 space-y-1">
                    {Object.entries(it.options).map(([k, v]) => (
                      <li key={k}>
                        <span className="font-semibold">{k}:</span>{" "}
                        {Array.isArray(v) ? v.join(", ") : String(v)}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Nota */}
                {it.note && (
                  <p className="mt-2 text-xs text-neutral-600">
                    <span className="font-semibold">Nota:</span> {it.note}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="text-sm text-neutral-600">
              Tu carrito está vacío.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">Total</span>
            <span className="text-lg font-bold">${COP(cart.total || 0)}</span>
          </div>

          <div className="flex gap-2">
            <button
              className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50"
              onClick={onClose}
            >
              Seguir pidiendo
            </button>

            <button
              className="flex-1 rounded-lg bg-emerald-700 text-white px-3 py-2 text-sm hover:opacity-90"
              onClick={() => window.open(waUrl, "_blank")}
              disabled={!cart.items || cart.items.length === 0}
              title={getTableId() ? `Mesa ${getTableId()}` : undefined}
            >
              Enviar por WhatsApp
            </button>
          </div>

          <div className="flex justify-between items-center">
            <button
              className="text-xs text-neutral-500 hover:underline"
              onClick={clearCart}
              disabled={!cart.items || cart.items.length === 0}
            >
              Vaciar carrito
            </button>
            {/* Muestra la mesa si existe */}
            <span className="text-[11px] text-neutral-500">
              {getTableId() ? `Mesa: ${getTableId()}` : "Sin mesa"}
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
