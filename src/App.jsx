// src/App.jsx
import { useState } from "react";
import { AppStateProvider, useAppState } from "./state/appState";

import Splash from "./views/Splash";
import Hub from "./views/Hub";
import MenuView from "./views/MenuView";
import TiendaView from "./views/TiendaView";
import MiniCart from "./components/shared/MiniCart";

function AppScreens() {
  const { setArea } = useAppState();
  const [screen, setScreen] = useState("splash");

  const handleSplashFinish = (next) => {
    // next can be "hub", "menu" or "tienda"
    setScreen(next);
  };

  const handleAreaSelect = (area) => {
    setArea(area);
    setScreen(area);
  };

  let content = null;
  if (screen === "splash") content = <Splash onFinish={handleSplashFinish} />;
  else if (screen === "hub") content = <Hub onSelect={handleAreaSelect} />;
  else if (screen === "menu") content = <MenuView onSwitch={() => handleAreaSelect("tienda")} />;
  else if (screen === "tienda") content = <TiendaView onSwitch={() => handleAreaSelect("menu")} />;

  return (
    <div className="flex min-h-screen flex-col">
      {content}
      <MiniCart />
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

