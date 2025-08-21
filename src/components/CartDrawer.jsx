// src/components/CartDrawer.jsx
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { COP } from "../utils/money";
import { getTableId } from "../utils/table";

// WhatsApp destino (formato internacional, sin +, sin espacios)
const PHONE = import.meta.env.VITE_WHATSAPP || "573222285900";

// nota general: persistimos de forma suave (opcional)
const NOTE_KEY = "aa_order_note";

function buildWhatsAppUrl(items, total, orderNote) {
  const table = getTableId();
  const lines = [];
  lines.push("*Pedido Alto Andino*");
  if (table) lines.push(`Mesa: ${table}`);
  lines.push("");
  (items || []).forEach((it, idx) => {
    const qty = it?.qty ?? 1;
    const unit = it?.price ?? 0;
    const subtotal = unit * qty;
    lines.push(
      `${idx + 1}. ${it?.name || "Producto"} x${qty} — $${COP(subtotal)}`
    );
    if (it?.options) {
      const opts = Object.entries(it.options)
        .map(([k, v]) =>
          Array.isArray(v) ? `${k}: ${v.join(", ")}` : `${k}: ${v}`
        )
        .join(" · ");
      if (opts) lines.push(`   ${opts}`);
    }
    if (it?.note) lines.push(`   Nota: ${it.note}`);
  });

  lines.push("");
  lines.push(`Total: $${COP(total || 0)}`);
  if (orderNote?.trim()) {
    lines.push("");
    lines.push(`Nota general: ${orderNote.trim()}`);
  }

  const message = lines.join("\n");
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;
}

const SUGGESTIONS = [
  "Sin sal",
  "Poco picante",
  "Bien cocido",
  "Sin cilantro",
  "Sin cebolla",
  "Sin azúcar",
  "Aparte la salsa",
  "Leche deslactosada",
];

export default function CartDrawer({ onClose }) {
  const { items, total, removeAt, increment, decrement, updateItem, clear } =
    useCart();
  const [editingIdx, setEditingIdx] = useState(null);
  const [draftNote, setDraftNote] = useState("");
  const [orderNote, setOrderNote] = useState(
    () => localStorage.getItem(NOTE_KEY) || ""
  );
  const table = getTableId();

  // bloquear scroll del body
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(NOTE_KEY, orderNote || "");
  }, [orderNote]);

  const startEdit = (idx, current) => {
    setEditingIdx(idx);
    setDraftNote(current || "");
  };
  const cancelEdit = () => {
    setEditingIdx(null);
    setDraftNote("");
  };
  const saveEdit = () => {
    const text = draftNote.trim();
    updateItem(editingIdx, { note: text || undefined });
    cancelEdit();
  };
  const removeNote = (idx) => updateItem(idx, { note: undefined });

  const waUrl = buildWhatsAppUrl(items, total, orderNote);

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
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
          {items.length > 0 ? (
            items.map((it, idx) => {
              const isEditing = editingIdx === idx;
              return (
                <div
                  key={`${it?.productId || "it"}-${idx}`}
                  className="rounded-xl border border-neutral-200 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {it?.name || "Producto"}
                      </p>
                      <p className="text-sm text-neutral-600">
                        ${COP((it?.price || 0) * (it?.qty || 1))}
                      </p>
                    </div>

                    {/* Controles cantidad + borrar */}
                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        className="h-8 w-8 rounded-full border border-neutral-300 hover:bg-neutral-50"
                        aria-label="Disminuir"
                        onClick={() => decrement(idx)}
                      >
                        −
                      </button>
                      <span className="w-6 text-center tabular-nums">
                        {it?.qty || 1}
                      </span>
                      <button
                        className="h-8 w-8 rounded-full border border-neutral-300 hover:bg-neutral-50"
                        aria-label="Aumentar"
                        onClick={() => increment(idx)}
                      >
                        +
                      </button>

                      <button
                        className="ml-2 h-8 w-8 rounded-full border border-red-200 text-red-600 hover:bg-red-50"
                        title="Eliminar"
                        aria-label="Eliminar"
                        onClick={() => removeAt(idx)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Opciones */}
                  {it?.options && (
                    <ul className="mt-2 text-xs text-neutral-700 space-y-1">
                      {Object.entries(it.options).map(([k, v]) => (
                        <li key={k}>
                          <span className="font-semibold">{k}:</span>{" "}
                          {Array.isArray(v) ? v.join(", ") : String(v)}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Notas por ítem */}
                  <div className="mt-2">
                    {!isEditing && !it?.note && (
                      <button
                        className="text-xs text-emerald-700 hover:underline"
                        onClick={() => startEdit(idx, "")}
                      >
                        + Agregar nota
                      </button>
                    )}

                    {!isEditing && it?.note && (
                      <div className="text-xs text-neutral-700">
                        <span className="font-semibold">Nota:</span> {it.note}{" "}
                        <button
                          className="ml-2 text-emerald-700 hover:underline"
                          onClick={() => startEdit(idx, it.note)}
                        >
                          Editar
                        </button>
                        <button
                          className="ml-2 text-red-600 hover:underline"
                          onClick={() => removeNote(idx)}
                        >
                          Quitar
                        </button>
                      </div>
                    )}

                    {isEditing && (
                      <div className="mt-2 rounded-lg border border-neutral-200 p-2">
                        <textarea
                          value={draftNote}
                          onChange={(e) =>
                            setDraftNote(e.target.value.slice(0, 140))
                          }
                          className="w-full text-xs outline-none resize-none"
                          rows={3}
                          placeholder="Ej: sin sal, poco picante, bien cocido… (máx. 140)"
                        />
                        <div className="mt-2 flex flex-wrap gap-1">
                          {SUGGESTIONS.map((s) => (
                            <button
                              key={s}
                              type="button"
                              className="px-2 py-1 rounded-full border text-[11px] hover:bg-neutral-50"
                              onClick={() =>
                                setDraftNote((d) => (d ? `${d}, ${s}` : s))
                              }
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[11px] text-neutral-500">
                            {(draftNote || "").length}/140
                          </span>
                          <div className="flex gap-2">
                            <button
                              className="text-xs px-3 py-1 rounded-lg border hover:bg-neutral-50"
                              onClick={cancelEdit}
                            >
                              Cancelar
                            </button>
                            <button
                              className="text-xs px-3 py-1 rounded-lg bg-emerald-700 text-white hover:opacity-90"
                              onClick={saveEdit}
                            >
                              Guardar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-neutral-600">
              Tu carrito está vacío.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 p-4 space-y-3">
          {/* Nota general (opcional) */}
          <div className="rounded-lg border border-neutral-200 p-2">
            <label className="text-xs font-semibold text-neutral-700">
              Nota general del pedido (opcional)
            </label>
            <textarea
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value.slice(0, 200))}
              className="mt-1 w-full text-xs outline-none resize-none"
              rows={2}
              placeholder="Ej: sin maní en ningún plato, entregar en recepción, etc. (máx. 200)"
            />
            <div className="mt-1 text-[11px] text-neutral-500 text-right">
              {(orderNote || "").length}/200
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">Total</span>
            <span className="text-lg font-bold">${COP(total)}</span>
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
              onClick={() =>
                window.open(buildWhatsAppUrl(items, total, orderNote), "_blank")
              }
              disabled={items.length === 0}
              title={table ? `Mesa ${table}` : undefined}
            >
              Enviar por WhatsApp
            </button>
          </div>

          <div className="flex justify-between items-center">
            <button
              className="text-xs text-neutral-500 hover:underline"
              onClick={clear}
              disabled={items.length === 0}
            >
              Vaciar carrito
            </button>
            <span className="text-[11px] text-neutral-500">
              {table ? `Mesa: ${table}` : "Sin mesa"}
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
