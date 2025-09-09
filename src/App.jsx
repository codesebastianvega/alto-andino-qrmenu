// src/App.jsx
import { useState, useEffect } from "react";
import { AppStateProvider, useAppState } from "./state/appState";
import { subscribeAvailability } from "./services/catalog";

import Splash from "./views/Splash";
import Hub from "./views/Hub";
import MenuView from "./views/MenuView";
import TiendaView from "./views/TiendaView";
import Checkout from "./views/Checkout";
import MiniCart from "./components/shared/MiniCart";

function AppScreens() {
  const { setArea, applyRealtimePatch } = useAppState();
  const [screen, setScreen] = useState(() =>
    window.location.pathname === "/checkout" ? "checkout" : "splash",
  );

  const handleSplashFinish = (next) => {
    // next can be "hub", "menu" or "tienda"
    if (window.location.pathname !== "/") {
      window.history.replaceState(null, "", "/");
    }
    setScreen(next);
  };

  const handleAreaSelect = (area) => {
    setArea(area);
    if (window.location.pathname !== "/") {
      window.history.replaceState(null, "", "/");
    }
    setScreen(area);
  };

  useEffect(() => {
    const unsub = subscribeAvailability(applyRealtimePatch);
    return () => unsub?.();
  }, [applyRealtimePatch]);

  let content = null;
  if (screen === "splash") content = <Splash onFinish={handleSplashFinish} />;
  else if (screen === "hub") content = <Hub onSelect={handleAreaSelect} />;
  else if (screen === "menu") content = <MenuView onSwitch={() => handleAreaSelect("tienda")} />;
  else if (screen === "tienda") content = <TiendaView onSwitch={() => handleAreaSelect("menu")} />;
  else if (screen === "checkout") content = <Checkout />;

  return (
    <div className="flex min-h-screen flex-col">
      {content}
      {screen !== "checkout" && <MiniCart />}
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <AppScreens />
    </AppStateProvider>
  );
}

