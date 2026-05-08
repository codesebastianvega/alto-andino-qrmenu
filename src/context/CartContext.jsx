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
  if (!opts || Object.keys(opts).length === 0) return "";
  // Sort keys to ensure consistent comparison
  const sortedKeys = Object.keys(opts).sort();
  const parts = sortedKeys.map(k => {
    const v = opts[k];
    return `${k}:${Array.isArray(v) ? [...v].sort().join(',') : v}`;
  });
  return parts.join('|');
}

// Asegura que el item tenga campos consistentes para comparación y visualización
function normalizeItem(p) {
  if (!p) return p;
  const productId = p.productId || p.id || p.productId_ext;
  return {
    ...p,
    productId,
    id: p.id || productId, // Garantiza id para compatibilidad con ProductQuickView
    image: p.image || p.image_url,
    image_url: p.image_url || p.image,
  };
}

function sameItem(a, b) {
  const na = normalizeItem(a);
  const nb = normalizeItem(b);
  return (
    na?.productId === nb?.productId &&
    na?.milk === nb?.milk &&
    optionsKey(na?.options) === optionsKey(nb?.options) &&
    String(na?.note || "") === String(nb?.note || "")
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

  const [note, setNote] = useState(() => {
    if (!hasWindow) return "";
    return window.localStorage.getItem(`${STORAGE_KEY}_note`) || "";
  });

  // Persist always
  const saveCart = (itemsToSave, noteToSave) => {
    if (!hasWindow) return;
    try {
      if (itemsToSave !== undefined) {
        const json = JSON.stringify(asArray(itemsToSave));
        window.localStorage.setItem(STORAGE_KEY, json);
      }
      if (noteToSave !== undefined) {
        window.localStorage.setItem(`${STORAGE_KEY}_note`, String(noteToSave));
      }
    } catch (err) {
      console.error("Error saving cart to localStorage:", err);
    }
  };

  useEffect(() => {
    if (!hasWindow) return;
    saveCart(items, note);

    // Ensure save on page leave for mobile reliability
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveCart(items, note);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handleVisibilityChange);
    };
  }, [items, note, hasWindow]);

  // API segura (siempre parte de un array)
  function addItem(payload) {
    const item = normalizeItem(payload);
    setItems((prev) => normalize([...asArray(prev), { qty: 1, ...item }]));
    setTimeout(() => toastEvent(`Añadido: ${item?.name || "Producto"}`), 0);
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
      const raw = localStorage.getItem("aa_last_order");
        if (!raw) return;
        const snap = JSON.parse(raw);
        snap.items?.forEach((it) => addItem?.(it));
        setNote?.(snap.note || "");
        localStorage.removeItem("aa_last_order");
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
