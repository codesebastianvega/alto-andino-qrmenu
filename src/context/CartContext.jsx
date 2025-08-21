import { createContext, useContext, useMemo, useState } from "react";
const CartCtx = createContext(null);
function normalizeNote(note) {
  return (note || "").trim().toLowerCase();
}
function lineKeyOf(item) {
  const baseKey = item.productId + "|" + JSON.stringify(item.options || {});
  const note = normalizeNote(item.note);
  return note ? baseKey + "|note:" + note : baseKey + "|note:";
}
export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const addItem = (entry) => {
    const withDefaults = { qty: 1, options: {}, note: "", ...entry };
    const key = lineKeyOf(withDefaults);
    setItems((prev) => {
      const idx = prev.findIndex((it) => it._key === key);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + withDefaults.qty };
        return copy;
      }
      return [...prev, { id: crypto.randomUUID(), _key: key, ...withDefaults }];
    });
  };
  const updateItem = (id, patch) =>
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, ...patch, _key: lineKeyOf({ ...it, ...patch }) }
          : it
      )
    );
  const removeItem = (id) =>
    setItems((prev) => prev.filter((it) => it.id !== id));
  const clear = () => setItems([]);
  const count = useMemo(() => items.reduce((n, it) => n + it.qty, 0), [items]);
  const total = useMemo(
    () => items.reduce((n, it) => n + it.price * it.qty, 0),
    [items]
  );
  return (
    <CartCtx.Provider
      value={{ items, addItem, updateItem, removeItem, clear, count, total }}
    >
      {children}
    </CartCtx.Provider>
  );
}
export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
