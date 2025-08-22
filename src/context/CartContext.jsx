// src/context/CartContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const toastEvent = (message) => {
  try { document.dispatchEvent(new CustomEvent("aa:toast", { detail: { message } })); } catch {}
};

const toNumberCOP = (v) => {
  if (typeof v === "number") return v;
  if (!v) return 0;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return isFinite(n) ? n : 0;
};

const CartCtx = createContext(null);
const STORAGE_KEY = "aa_cart";

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}
const asArray = (v) => (Array.isArray(v) ? v : []);

// normaliza opciones para comparar items iguales
function optionsKey(opts) {
  if (!opts) return "";
  const entries = Object.entries(opts).map(([k, v]) => [
    k,
    Array.isArray(v) ? [...v].sort() : v,
  ]);
  entries.sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(entries);
}
function sameItem(a, b) {
  return (
    a?.productId === b?.productId &&
    optionsKey(a?.options) === optionsKey(b?.options) &&
    String(a?.note || "") === String(b?.note || "")
  );
}
function normalize(items) {
  const list = asArray(items);
  const out = [];
  for (const it of list) {
    const idx = out.findIndex((x) => sameItem(x, it));
    if (idx === -1) out.push({ ...it });
    else out[idx] = { ...out[idx], qty: (out[idx].qty || 1) + (it.qty || 1) };
  }
  return out;
}

export function CartProvider({ children }) {
  const hasWindow = typeof window !== "undefined";
  // Lee el storage y sanea: si no es array, borra y arranca vacío
  const [items, setItems] = useState(() => {
    if (!hasWindow) return [];
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = safeParse(raw, []);
    if (!Array.isArray(parsed)) {
      window.localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    return parsed;
  });

  const [note, setNote] = useState("");

  // Persiste siempre como array
  useEffect(() => {
    if (!hasWindow) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(asArray(items)));
  }, [items, hasWindow]);

  // API segura (siempre parte de un array)
  function addItem(payload) {
    setItems((prev) => normalize([...asArray(prev), { qty: 1, ...payload }]));
    toastEvent(`Añadido: ${payload?.name || "Producto"}`);
  }
  function removeAt(index) {
    setItems((prev) => asArray(prev).filter((_, i) => i !== index));
  }
  function removeItem(itemOrId, options, note) {
    const ref =
      typeof itemOrId === "object"
        ? itemOrId
        : { productId: itemOrId, options, note };
    setItems((prev) => {
      const base = asArray(prev);
      const idx = base.findIndex((x) => sameItem(x, ref));
      if (idx < 0) return base;
      const next = [...base];
      next.splice(idx, 1);
      return next;
    });
  }
  function increment(index) {
    setItems((prev) => {
      const next = [...asArray(prev)];
      if (next[index])
        next[index] = { ...next[index], qty: (next[index].qty || 1) + 1 };
      return next;
    });
  }
  function decrement(index) {
    setItems((prev) => {
      const next = [...asArray(prev)];
      if (!next[index]) return next;
      const q = (next[index].qty || 1) - 1;
      if (q <= 0) {
        next.splice(index, 1);
        return next;
      }
      next[index] = { ...next[index], qty: q };
      return next;
    });
  }
  function setQty(index, qty) {
    const q = Math.max(1, Number(qty) || 1);
    setItems((prev) => {
      const next = [...asArray(prev)];
      if (next[index]) next[index] = { ...next[index], qty: q };
      return next;
    });
  }
  function updateItem(index, patch) {
    setItems((prev) => {
      const next = [...asArray(prev)];
      if (!next[index]) return next;
      next[index] = { ...next[index], ...patch };
      return normalize(next);
    });
  }
  function clear() {
    setItems([]);
  }

  const { count, total } = useMemo(() => {
    const list = asArray(items);
    let c = 0,
      t = 0;
    for (const it of list) {
      const q = it?.qty || 1;
      c += q;
      const unit = toNumberCOP(it?.price ?? it?.unitPrice ?? it?.priceEach);
      t += unit * q;
    }
    return { count: c, total: t };
  }, [items]);

  const value = {
    items: asArray(items),
    count,
    total,
    addItem,
    removeItem,
    removeAt,
    increment,
    decrement,
    setQty,
    updateItem,
    clear,
    note,
    setNote,
  };

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
