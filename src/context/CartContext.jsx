// src/context/CartContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartCtx = createContext(null);
const STORAGE_KEY = "aa_cart";

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

// normaliza opciones para comparar
function optionsKey(opts) {
  if (!opts) return "";
  const entries = Object.entries(opts).map(([k, v]) => [
    k,
    Array.isArray(v) ? [...v] : v,
  ]);
  entries.sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(entries);
}
// identidad: productId + options + note
function sameItem(a, b) {
  return (
    a.productId === b.productId &&
    optionsKey(a.options) === optionsKey(b.options) &&
    String(a.note || "") === String(b.note || "")
  );
}

function normalize(items) {
  const out = [];
  for (const it of items) {
    const idx = out.findIndex((x) => sameItem(x, it));
    if (idx === -1) out.push({ ...it });
    else out[idx] = { ...out[idx], qty: (out[idx].qty || 1) + (it.qty || 1) };
  }
  return out;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return safeParse(raw, []);
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addItem(newItem) {
    const incoming = { qty: 1, ...newItem };
    setItems((prev) => normalize([...prev, incoming]));
  }
  function removeAt(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }
  function removeItem(productId) {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.productId === productId);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
  }
  function increment(index) {
    setItems((prev) => {
      const next = [...prev];
      if (next[index])
        next[index] = { ...next[index], qty: (next[index].qty || 1) + 1 };
      return next;
    });
  }
  function decrement(index) {
    setItems((prev) => {
      const next = [...prev];
      if (!next[index]) return prev;
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
      const next = [...prev];
      if (next[index]) next[index] = { ...next[index], qty: q };
      return next;
    });
  }
  // ✅ actualizar campos del item (p. ej. note) y re-merge si coincide con otro
  function updateItem(index, patch) {
    setItems((prev) => {
      const next = [...prev];
      if (!next[index]) return prev;
      next[index] = { ...next[index], ...patch };
      return normalize(next);
    });
  }

  function clear() {
    setItems([]);
  }

  const { count, total } = useMemo(() => {
    let c = 0,
      t = 0;
    for (const it of items) {
      const q = it.qty || 1;
      c += q;
      t += (it.price || 0) * q;
    }
    return { count: c, total: t };
  }, [items]);

  const value = {
    items,
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
  };

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
