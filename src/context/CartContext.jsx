// src/context/CartContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const toastEvent = (message) => {
  try {
    document.dispatchEvent(new CustomEvent("aa:toast", { detail: { message } }));
  } catch {}
};

export const getItemUnit = (it) =>
  Number(String(it?.price ?? it?.unitPrice ?? it?.priceEach).replace(/[^\d.-]/g, "")) || 0;

const CartCtx = createContext(null);

export const useCart = () => useContext(CartCtx);
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
  const entries = Object.entries(opts).map(([k, v]) => [k, Array.isArray(v) ? [...v].sort() : v]);
  entries.sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(entries);
}

function sameItem(a, b) {
  return (
    a?.productId === b?.productId &&
    a?.milk === b?.milk &&
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

  // Persiste siempre como array (en idle para no bloquear UI)
  useEffect(() => {
    if (!hasWindow) return;
    const json = JSON.stringify(asArray(items));
    let cancel = null;
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => {
        try {
          window.localStorage.setItem(STORAGE_KEY, json);
        } catch {}
      });
      cancel = () => window.cancelIdleCallback?.(id);
    } else {
      const tid = setTimeout(() => {
        try {
          window.localStorage.setItem(STORAGE_KEY, json);
        } catch {}
      }, 0);
      cancel = () => clearTimeout(tid);
    }
    return cancel;
  }, [items, hasWindow]);

  // API segura (siempre parte de un array)
  function addItem(payload) {
    setItems((prev) => normalize([...asArray(prev), { qty: 1, ...payload }]));
    setTimeout(() => toastEvent(`Añadido: ${payload?.name || "Producto"}`), 0);
  }

  function removeAt(index) {
    setItems((prev) => asArray(prev).filter((_, i) => i !== index));
  }

  function removeItem(itemOrId, options, note) {
    const ref = typeof itemOrId === "object" ? itemOrId : { productId: itemOrId, options, note };
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
      if (next[index]) next[index] = { ...next[index], qty: (next[index].qty || 1) + 1 };
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

  function clearCart() {
    setItems([]);
    setNote("");
  }

  useEffect(() => {
    const onUndo = () => {
      try {
        const raw = sessionStorage.getItem("aa_last_order");
        if (!raw) return;
        const snap = JSON.parse(raw);
        snap.items?.forEach((it) => addItem?.(it));
        setNote?.(snap.note || "");
        sessionStorage.removeItem("aa_last_order");
        document.dispatchEvent(
          new CustomEvent("aa:toast", {
            detail: { message: "Carrito restaurado" },
          }),
        );
      } catch {}
    };
    document.addEventListener("aa:undo-cart", onUndo);
    return () => document.removeEventListener("aa:undo-cart", onUndo);
  }, [addItem, setNote]);

  const { count, total } = useMemo(() => {
    const list = asArray(items);
    let c = 0,
      t = 0;
    for (const it of list) {
      const q = it?.qty || 1;
      c += q;
      const unit = getItemUnit(it);
      t += unit * q;
    }
    return { count: c, total: t };
  }, [items]);

  const value = useMemo(
    () => ({
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
      clear: clearCart,
      clearCart,
      note,
      setNote,
    }),
    [items, count, total, note],
  );

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}
