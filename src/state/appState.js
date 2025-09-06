// src/state/appState.js
import React, { createContext, useContext, useState } from "react";

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [mode, setModeState] = useState("pickup");
  const [area, setAreaState] = useState("menu");
  const [cart, setCart] = useState({ items: [] });

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

  const value = { mode, area, cart, setMode, setArea, resetCart };
  return React.createElement(AppStateContext.Provider, { value }, children);
}

export const useAppState = () => useContext(AppStateContext);

