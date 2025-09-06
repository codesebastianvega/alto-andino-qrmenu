// src/state/appState.js
import React, { createContext, useContext, useState } from "react";

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [mode, setModeState] = useState("pickup");
  const [area, setAreaState] = useState("menu");
  const [cart, setCart] = useState({ items: [] });
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const setMode = (m) => {
    setModeState(m);
    try {
      window.localStorage.setItem("mode", m);
    } catch {}
  };

  const setArea = (a) => {
    setAreaState(a);
    try {
      window.localStorage.setItem("area", a);
    } catch {}
  };

  const resetCart = () => setCart({ items: [] });

  const applyRealtimePatch = (p) =>
    setProducts((prev) =>
      prev.map((item) => (item.id === p.id ? { ...item, ...p } : item))
    );

  const value = {
    mode,
    area,
    cart,
    categories,
    products,
    setMode,
    setArea,
    resetCart,
    setCategories,
    setProducts,
    applyRealtimePatch,
  };
  return React.createElement(AppStateContext.Provider, { value }, children);
}

export const useAppState = () => useContext(AppStateContext);

