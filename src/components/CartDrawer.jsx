import { COP } from "../utils/money";
import { useCart } from "../context/CartContext";
import { useQueryParam } from "../utils/useQueryParam";
const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "573222285900";
export default function CartDrawer({ onClose }) {
  const cart = useCart();
  const mesa = useQueryParam("mesa");
  const composeMessage = () => {
    const header = `Pedido Alto Andino%0A${mesa ? `Mesa: ${mesa}%0A` : ""}`;
    const lines = cart.items
      .map((it) => {
        const details = [];
        if (it.options && Object.keys(it.options).length) {
          details.push(
            Object.entries(it.options)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" · ")
          );
        }
        if (it.note?.trim()) details.push(`Nota: ${it.note.trim()}`);
        const detailLine = details.length ? `%0A ${details.join(" · ")}` : "";
        return `• ${it.qty} x ${it.name} - $${COP(it.price)}${detailLine}`;
      })
      .join("%0A");
    const footer = `%0A—%0ATotal: $${COP(cart.total)}%0AGracias ✨`;
    return `${header}${lines}${footer}`;
  };
  const goWhatsApp = () => {
    const url = `https://wa.me/${WA_NUMBER}?text=${composeMessage()}`;
    window.location.href = url;
  };
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">Tu carrito</h3>
          <button onClick={onClose} className="text-sm text-neutral-600">
            Cerrar
          </button>
        </div>
        {cart.items.length === 0 ? (
          <p className="text-sm text-neutral-600">Aún no agregas productos.</p>
        ) : (
          <ul className="space-y-3">
            {cart.items.map((it) => (
              <li
                key={it.id}
                className="flex items-start justify-between gap-3 border-b pb-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{it.name}</p>
                  {it.options && Object.keys(it.options).length > 0 && (
                    <p className="text-xs text-neutral-600 whitespace-pre-line mt-1">
                      {Object.entries(it.options)
                        .map(
                          ([k, v]) =>
                            `${k}: ${Array.isArray(v) ? v.join(", ") : v}`
                        )
                        .join(" · ")}
                    </p>
                  )}
                  <div className="mt-2">
                    <label className="block text-[11px] text-neutral-500">
                      Nota para cocina
                    </label>
                    <input
                      value={it.note || ""}
                      onChange={(e) =>
                        cart.updateItem(it.id, { note: e.target.value })
                      }
                      placeholder="Ej.: bien cocido, sin sal, poca salsa..."
                      maxLength={120}
                      className="mt-1 w-full rounded-lg border px-2 py-1 text-sm"
                    />
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Precio unitario: ${COP(it.price)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() =>
                        cart.updateItem(it.id, { qty: Math.max(1, it.qty - 1) })
                      }
                      className="px-2 rounded border"
                    >
                      −
                    </button>
                    <span className="text-sm w-6 text-center">{it.qty}</span>
                    <button
                      onClick={() =>
                        cart.updateItem(it.id, { qty: it.qty + 1 })
                      }
                      className="px-2 rounded border"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => cart.removeItem(it.id)}
                    className="text-[11px] text-red-600 mt-2"
                  >
                    Quitar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-neutral-600">Total</p>
          <p className="text-xl font-bold">${COP(cart.total)}</p>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={cart.clear}
            className="px-4 py-3 rounded-xl border text-sm"
          >
            Vaciar
          </button>
          <button
            onClick={goWhatsApp}
            className="flex-1 px-4 py-3 rounded-xl bg-alto-primary text-white font-semibold shadow"
          >
            Enviar por WhatsApp
          </button>
        </div>
        {mesa && (
          <p className="mt-2 text-[11px] text-neutral-500">
            Se enviará con la etiqueta de mesa <b>{mesa}</b>.
          </p>
        )}
      </div>
    </div>
  );
}
