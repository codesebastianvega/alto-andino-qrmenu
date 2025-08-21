// src/components/CartDrawer.jsx
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { getTableId } from "../utils/table";

function COP(n) {
  try {
    return new Intl.NumberFormat("es-CO").format(Math.round(n || 0));
  } catch {
    return String(n || 0);
  }
}
const PHONE = import.meta.env.VITE_WHATSAPP || "573222285900";
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
  if ((orderNote || "").trim()) {
    lines.push("", `Nota general: ${(orderNote || "").trim()}`);
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

  useEffect(() => {
    const p = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = p;
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

  // estilos rápidos
  const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,.4)" };
  const panel = {
    position: "fixed",
    top: 0,
    right: 0,
    height: "100vh",
    width: "100%",
    maxWidth: 420,
    background: "#fff",
    boxShadow: "-6px 0 24px rgba(0,0,0,.15)",
    display: "flex",
    flexDirection: "column",
  };
  const row = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50 }}>
      <div style={overlay} onClick={onClose} />
      <aside style={panel}>
        {/* Header */}
        <div style={{ padding: 16, borderBottom: "1px solid #e5e5e5", ...row }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
            Tu pedido
          </h3>
          <button
            onClick={onClose}
            style={{
              fontSize: 13,
              color: "#444",
              background: "transparent",
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: "4px 8px",
            }}
          >
            Cerrar ✕
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
          {items.length > 0 ? (
            items.map((it, idx) => {
              const isEditing = editingIdx === idx;
              return (
                <div
                  key={`${it?.productId || "it"}-${idx}`}
                  style={{
                    border: "1px solid #e5e5e5",
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {it?.name || "Producto"}
                      </div>
                      <div style={{ fontSize: 13, color: "#666" }}>
                        ${COP((it?.price || 0) * (it?.qty || 1))}
                      </div>
                    </div>

                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <button
                        aria-label="Disminuir"
                        onClick={() => decrement(idx)}
                        style={{
                          height: 32,
                          width: 32,
                          border: "1px solid #ddd",
                          borderRadius: 16,
                          background: "#fff",
                        }}
                      >
                        −
                      </button>
                      <span style={{ width: 24, textAlign: "center" }}>
                        {it?.qty || 1}
                      </span>
                      <button
                        aria-label="Aumentar"
                        onClick={() => increment(idx)}
                        style={{
                          height: 32,
                          width: 32,
                          border: "1px solid #ddd",
                          borderRadius: 16,
                          background: "#fff",
                        }}
                      >
                        +
                      </button>
                      <button
                        title="Eliminar"
                        aria-label="Eliminar"
                        onClick={() => removeAt(idx)}
                        style={{
                          height: 32,
                          width: 32,
                          border: "1px solid #f3b5b5",
                          color: "#c00",
                          borderRadius: 16,
                          background: "#fff",
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {it?.options && (
                    <ul
                      style={{
                        marginTop: 8,
                        paddingLeft: 16,
                        fontSize: 12,
                        color: "#444",
                      }}
                    >
                      {Object.entries(it.options).map(([k, v]) => (
                        <li key={k}>
                          <strong>{k}:</strong>{" "}
                          {Array.isArray(v) ? v.join(", ") : String(v)}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Notas */}
                  <div style={{ marginTop: 8 }}>
                    {!isEditing && !it?.note && (
                      <button
                        onClick={() => startEdit(idx, "")}
                        style={{
                          fontSize: 12,
                          color: "#065f46",
                          background: "transparent",
                          border: "none",
                          padding: 0,
                        }}
                      >
                        + Agregar nota
                      </button>
                    )}
                    {!isEditing && it?.note && (
                      <div style={{ fontSize: 12, color: "#333" }}>
                        <strong>Nota:</strong> {it.note}{" "}
                        <button
                          onClick={() => startEdit(idx, it.note)}
                          style={{
                            fontSize: 12,
                            color: "#065f46",
                            background: "transparent",
                            border: "none",
                          }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => removeNote(idx)}
                          style={{
                            fontSize: 12,
                            color: "#b00020",
                            background: "transparent",
                            border: "none",
                            marginLeft: 8,
                          }}
                        >
                          Quitar
                        </button>
                      </div>
                    )}
                    {isEditing && (
                      <div
                        style={{
                          marginTop: 8,
                          border: "1px solid #eee",
                          borderRadius: 8,
                          padding: 8,
                        }}
                      >
                        <textarea
                          value={draftNote}
                          onChange={(e) =>
                            setDraftNote(e.target.value.slice(0, 140))
                          }
                          rows={3}
                          placeholder="Ej: sin sal, poco picante, bien cocido… (máx. 140)"
                          style={{
                            width: "100%",
                            fontSize: 12,
                            resize: "none",
                          }}
                        />
                        <div
                          style={{
                            marginTop: 6,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 6,
                          }}
                        >
                          {SUGGESTIONS.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() =>
                                setDraftNote((d) => (d ? `${d}, ${s}` : s))
                              }
                              style={{
                                fontSize: 11,
                                padding: "3px 8px",
                                border: "1px solid #ddd",
                                borderRadius: 999,
                              }}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                        <div
                          style={{
                            marginTop: 8,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ fontSize: 11, color: "#666" }}>
                            {(draftNote || "").length}/140
                          </span>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={cancelEdit}
                              style={{
                                fontSize: 12,
                                padding: "6px 10px",
                                border: "1px solid #ddd",
                                borderRadius: 8,
                                background: "#fff",
                              }}
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={saveEdit}
                              style={{
                                fontSize: 12,
                                padding: "6px 10px",
                                border: "none",
                                borderRadius: 8,
                                background: "#065f46",
                                color: "#fff",
                              }}
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
            <div style={{ fontSize: 14, color: "#666" }}>
              Tu carrito está vacío.
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #e5e5e5", padding: 16 }}>
          {/* Nota general */}
          <div
            style={{
              border: "1px solid #eee",
              borderRadius: 8,
              padding: 8,
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: "#333" }}>
              Nota general del pedido (opcional)
            </div>
            <textarea
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value.slice(0, 200))}
              rows={2}
              placeholder="Ej: sin maní en ningún plato, entregar en recepción, etc. (máx. 200)"
              style={{
                width: "100%",
                marginTop: 6,
                fontSize: 12,
                resize: "none",
              }}
            />
            <div style={{ textAlign: "right", fontSize: 11, color: "#666" }}>
              {(orderNote || "").length}/200
            </div>
          </div>

          <div style={{ ...row, marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: "#666" }}>Total</span>
            <span style={{ fontSize: 18, fontWeight: 800 }}>${COP(total)}</span>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: 10,
                background: "#fff",
              }}
            >
              Seguir pidiendo
            </button>
            <button
              onClick={() => window.open(waUrl, "_blank")}
              disabled={items.length === 0}
              title={table ? `Mesa ${table}` : undefined}
              style={{
                flex: 1,
                padding: "10px 12px",
                border: "none",
                borderRadius: 10,
                background: "#065f46",
                color: "#fff",
                opacity: items.length === 0 ? 0.5 : 1,
              }}
            >
              Enviar por WhatsApp
            </button>
          </div>

          <div style={{ marginTop: 8, ...row }}>
            <button
              onClick={clear}
              disabled={items.length === 0}
              style={{
                fontSize: 12,
                color: "#666",
                background: "transparent",
                border: "none",
                textDecoration: "underline",
                opacity: items.length === 0 ? 0.5 : 1,
              }}
            >
              Vaciar carrito
            </button>
            <span style={{ fontSize: 11, color: "#666" }}>
              {getTableId() ? `Mesa: ${getTableId()}` : "Sin mesa"}
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
