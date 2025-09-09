// src/state/appState.js
import React, { createContext, useContext, useEffect, useState } from "react";

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    try {
      return window.localStorage.getItem("mode") || "pickup";
    } catch {
      return "pickup";
    }
  });
  const [tableId, setTableIdState] = useState(() => {
    try {
      return window.localStorage.getItem("tableId") || null;
    } catch {
      return null;
    }
  });
  const [area, setAreaState] = useState(() => {
    try {
      return window.localStorage.getItem("area") || "menu";
    } catch {
      return "menu";
    }
  });
  const [cart, setCart] = useState(() => {
    try {
      const raw = window.localStorage.getItem("cart");
      const parsed = raw ? JSON.parse(raw) : { items: [] };
      return Array.isArray(parsed?.items) ? parsed : { items: [] };
    } catch {
      return { items: [] };
    }
  });
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const setTableId = (id) => {
    setTableIdState(id);
    try {
      if (id !== null && id !== undefined) {
        window.localStorage.setItem("tableId", id);
      } else {
        window.localStorage.removeItem("tableId");
      }
    } catch {}
  };

  const setMode = (m) => {
    setModeState(m);
    try {
      window.localStorage.setItem("mode", m);
    } catch {}
    if (m !== "mesa") {
      setTableId(null);
    }
  };

  const setArea = (a) => {
    setAreaState(a);
    try {
      window.localStorage.setItem("area", a);
    } catch {}
  };

  const getIncompatibleItemsForMode = (m) => {
    return cart.items
      .filter((item) => {
        const product = products.find((p) => p.id === item.productId);
        const modes = product?.fulfillment_modes || ["mesa", "pickup", "delivery"];
        return !modes.includes(m);
      })
      .map((item) => item.id);
  };

  const removeItemsByIds = (ids) => {
    setCart((prev) => ({
      items: prev.items.filter((it) => !ids.includes(it.id)),
    }));
  };

  const addToCart = (p = {}) => {
    const modes = p.fulfillment_modes || ["mesa", "pickup", "delivery"];
    if (!modes.includes(mode)) return;
    setCart((prev) => ({
      items: [
        ...prev.items,
        {
          id: `${p.id || p.productId}-${Date.now()}`,
          productId: p.id || p.productId,
          name: p.name,
          unit_price_cop: p.price_cop,
          qty: 1,
        },
      ],
    }));
  };

  const clearCart = () => setCart({ items: [] });

  useEffect(() => {
    try {
      window.localStorage.setItem("cart", JSON.stringify(cart));
    } catch {}
  }, [cart]);

  const getCartTotalCop = () =>
    cart.items.reduce(
      (sum, it) => sum + (it.unit_price_cop || 0) * (it.qty || 1),
      0,
    );

  const applyRealtimePatch = (p) =>
    setProducts((prev) =>
      prev.map((item) => (item.id === p.id ? { ...item, ...p } : item))
    );

  const value = {
    mode,
    tableId,
    area,
    cart,
    categories,
    products,
    setMode,
    setTableId,
    setArea,
    addToCart,
    getIncompatibleItemsForMode,
    removeItemsByIds,
    clearCart,
    getCartTotalCop,
    setCategories,
    setProducts,
    applyRealtimePatch,
  };
  return React.createElement(AppStateContext.Provider, { value }, children);
}

export const useAppState = () => useContext(AppStateContext);

export const useCartItems = () => {
  const { cart } = useAppState();
  return cart.items;
};

