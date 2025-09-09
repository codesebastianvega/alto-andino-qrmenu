// src/state/appState.js
import React, { createContext, useContext, useState } from "react";

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
  const [cart, setCart] = useState({ items: [] });
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
        return !((product?.fulfillment_modes || []).includes(m));
      })
      .map((item) => item.id);
  };

  const removeItemsByIds = (ids) => {
    setCart((prev) => ({
      items: prev.items.filter((it) => !ids.includes(it.id)),
    }));
  };

  const resetCart = () => setCart({ items: [] });

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
    getIncompatibleItemsForMode,
    removeItemsByIds,
    resetCart,
    setCategories,
    setProducts,
    applyRealtimePatch,
  };
  return React.createElement(AppStateContext.Provider, { value }, children);
}

export const useAppState = () => useContext(AppStateContext);

